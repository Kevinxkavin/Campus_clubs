import { confirmAction } from '../util/confirmToast';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchClubs, fetchClubEvents, fetchPendingClubEvents, fetchClubPosts,
  apiReviewEvent, apiApproveMember, apiRejectMember, apiRemoveMember,
  apiDeleteEvent, apiDeletePost, adminCreateUser, apiUpdateClub
} from '../api';
import { CheckCircle, XCircle, Users, CalendarDays, MapPin, Clock, Eye, Trash2, UserPlus, Upload, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const readImage = (file, done) => {
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB'); return; }
  const reader = new FileReader();
  reader.onload = e => done(e.target.result);
  reader.readAsDataURL(file);
};

const fmt     = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
const fmtFull = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const timeSince = (d) => {
  const s = Math.floor((new Date() - new Date(d)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.max(1,Math.floor(s/60))}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

function EventReviewCard({ event, onRefresh }) {
  const [comment, setComment]   = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleReview = async (status) => {
    if (status === 'rejected' && !comment.trim()) { toast.error('Please add a comment when rejecting.'); return; }
    try {
      await apiReviewEvent(event._id, status, comment);
      toast.success(status === 'approved' ? 'Event approved!' : 'Event rejected.');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  return (
    <div className="card" style={{ marginBottom:16 }}>
      <div className="card-body">
        <div style={{ display:'flex',gap:16,alignItems:'flex-start' }}>
          {event.poster && <img src={event.poster} alt="poster" style={{ width:80,height:80,borderRadius:10,objectFit:'cover',flexShrink:0 }}/>}
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap' }}>
              <h3 style={{ fontSize:16,fontWeight:700 }}>{event.title}</h3>
              <span className="badge badge-student">{event.category}</span>
              <span className="badge badge-pending">Pending</span>
            </div>
            <p style={{ fontSize:13,color:'var(--text-secondary)',marginBottom:10,lineHeight:1.6 }}>{event.description}</p>
            <div style={{ display:'flex',gap:14,flexWrap:'wrap',fontSize:12,color:'var(--text-muted)',marginBottom:10 }}>
              <span style={{ display:'flex',alignItems:'center',gap:4 }}><CalendarDays size={12}/> {fmtFull(event.eventDate)}</span>
              <span style={{ display:'flex',alignItems:'center',gap:4 }}><MapPin size={12}/> {event.venue||'TBD'}</span>
              <span style={{ display:'flex',alignItems:'center',gap:4 }}><Users size={12}/> Max {event.maxParticipants}</span>
              <span style={{ display:'flex',alignItems:'center',gap:4 }}><Clock size={12}/> Deadline: {fmtFull(event.registrationDeadline)}</span>
            </div>
            {event.registrationUrl && (
              <div style={{ fontSize:12,marginBottom:10 }}>
                Registration Link: <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--purple-light)',textDecoration:'underline' }}>{event.registrationUrl}</a>
              </div>
            )}
            <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:12 }}>
              Submitted by <strong>{event.createdBy?.name}</strong> · {fmt(event.createdAt)}
            </div>

            {(event.registrationFields||[]).length > 0 && (
              <div>
                <button className="btn btn-ghost btn-xs" onClick={()=>setExpanded(e=>!e)} style={{ marginBottom:8 }}>
                  <Eye size={12}/> {expanded?'Hide':'View'} registration form ({event.registrationFields.length} fields)
                </button>
                {expanded && (
                  <div style={{ background:'var(--bg-secondary)',borderRadius:8,padding:12,border:'1px solid var(--border)',marginBottom:10 }}>
                    {event.registrationFields.map((f,i)=>(
                      <div key={i} style={{ fontSize:12,marginBottom:4,display:'flex',gap:6 }}>
                        <span style={{ color:'var(--text-muted)' }}>{i+1}.</span>
                        <span>{f.label}</span>
                        <span style={{ color:'var(--purple-light)' }}>({f.type})</span>
                        {f.required && <span style={{ color:'#f87171' }}>*required</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <textarea className="form-textarea" rows={2} placeholder="Add feedback comment (required for rejection)..."
              value={comment} onChange={e=>setComment(e.target.value)} style={{ marginBottom:12 }}/>
            <div style={{ display:'flex',gap:10 }}>
              <button className="btn btn-primary btn-sm" onClick={()=>handleReview('approved')}><CheckCircle size={14}/> Approve</button>
              <button className="btn btn-danger btn-sm" onClick={()=>handleReview('rejected')}><XCircle size={14}/> Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoordinatorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('events');
  const [myClub, setMyClub]             = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allClubEvents, setAllClubEvents] = useState([]);
  const [clubPosts, setClubPosts]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [studentForm, setStudentForm] = useState({ name:'',email:'',studentId:'',bio:'',skills:'',password:'student123' });
  const [clubForm, setClubForm] = useState({ logoUrl:'', bannerUrl:'' });

  const load = useCallback(async () => {
    try {
      const clubs = await fetchClubs();
      const club = clubs.find(c => c.coordinator?._id === user._id);
      if (!club) { setLoading(false); return; }
      setMyClub(club);
      setClubForm({ logoUrl: club.logoUrl || '', bannerUrl: club.bannerUrl || '' });

      const [pending, all, posts] = await Promise.all([
        fetchPendingClubEvents(club._id),
        fetchClubEvents(club._id),
        fetchClubPosts(club._id).catch(() => []),
      ]);
      setPendingEvents(pending);
      setAllClubEvents(all);
      setClubPosts(posts);
    } catch { toast.error('Failed to load coordinator data'); }
    finally { setLoading(false); }
  }, [user._id]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (uid) => { try { await apiApproveMember(myClub._id, uid); toast.success('Member approved!'); load(); } catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); } };
  const handleReject  = async (uid) => { try { await apiRejectMember(myClub._id, uid);  toast.success('Request rejected.'); load(); } catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); } };
  const handleRemove  = async (uid) => {
    if (!await confirmAction('Remove this member?')) return;
    try { await apiRemoveMember(myClub._id, uid); toast.success('Member removed.'); load(); } catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };
  const handleDeleteEvent = async (eid) => {
    if (!await confirmAction('Delete this event?')) return;
    try { await apiDeleteEvent(eid); toast.success('Event deleted.'); load(); } catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };
  const handleDeletePost = async (pid) => {
    if (!await confirmAction('Delete this post?')) return;
    try { await apiDeletePost(pid); toast.success('Post deleted.'); load(); } catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.email || !studentForm.studentId) { toast.error('Name, Email and Student ID are required!'); return; }
    try {
      await adminCreateUser({ ...studentForm, role: 'student' });
      toast.success('Student account created!');
      setStudentForm({ name:'',email:'',studentId:'',bio:'',skills:'',password:'student123' });
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed to create student'); }
  };
  const handleClubProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiUpdateClub(myClub._id, clubForm);
      toast.success('Club profile updated!');
      load();
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed to update club profile'); }
  };

  if (loading) return <div style={{ textAlign:'center',padding:60,color:'var(--text-muted)' }}>Loading...</div>;
  if (!myClub) return <div className="empty-state"><h3>No club assigned</h3><p>You are not assigned as a coordinator of any club.</p></div>;

  const members        = myClub.members || [];
  const pendingMembers = myClub.pendingMembers || [];
  const SC = { pending:'badge-pending', approved:'badge-approved', rejected:'badge-rejected' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Coordinator — {myClub.name}</h1>
        <p className="page-subtitle">Manage event approvals, club membership, posts and add students</p>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28 }}>
        {[
          ['Pending Events', pendingEvents.length, '#f59e0b'],
          ['Pending Joins',  pendingMembers.length,'#3b82f6'],
          ['Club Posts',     clubPosts.length,     '#10b981'],
          ['Club Members',   members.length,       '#7c3aed'],
        ].map(([lbl,val,col])=>(
          <div key={lbl} className="stat-card" style={{ padding:'16px 20px' }}>
            <div className="stat-number" style={{ color:col,fontSize:24 }}>{val}</div>
            <div className="stat-label" style={{ fontSize:11 }}>{lbl}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[
          ['events',      `Event Approvals (${pendingEvents.length})`],
          ['all',         `All Events (${allClubEvents.length})`],
          ['members',     `Members (${members.length})`],
          ['pending',     `Pending Joins (${pendingMembers.length})`],
          ['posts',       `Club Posts (${clubPosts.length})`],
          ['profile',     'Club Profile'],
          ['add-student', 'Add Student'],
        ].map(([id,lbl])=>(
          <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab==='events' && (
        pendingEvents.length===0
          ? <div className="empty-state"><CheckCircle size={48} style={{ margin:'0 auto 16px',opacity:.3 }}/><h3>No pending events</h3><p>All caught up!</p></div>
          : pendingEvents.map(e => <EventReviewCard key={e._id} event={e} onRefresh={load}/>)
      )}

      {tab==='all' && (
        allClubEvents.length===0 ? <div className="empty-state"><h3>No events yet</h3></div> : (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {allClubEvents.map(e=>(
              <div key={e._id} className="card">
                <div className="card-body" style={{ display:'flex',gap:16,alignItems:'center' }}>
                  {e.poster && <img src={e.poster} alt="poster" style={{ width:56,height:56,borderRadius:8,objectFit:'cover',flexShrink:0 }}/>}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                      <span style={{ fontWeight:700,fontSize:15 }}>{e.title}</span>
                      <span className={`badge ${SC[e.status]||'badge-pending'}`}>{e.status}</span>
                      <span className="badge badge-student">{e.category}</span>
                    </div>
                    <div style={{ fontSize:12,color:'var(--text-muted)',display:'flex',gap:14,flexWrap:'wrap' }}>
                      <span><CalendarDays size={11} style={{ marginRight:3 }}/>{fmtFull(e.eventDate)}</span>
                      <span><Users size={11} style={{ marginRight:3 }}/>{e.registrationCount||0}/{e.maxParticipants} registered</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-xs" style={{ color:'var(--purple-light)' }} onClick={()=>navigate(`/edit-event/${e._id}`)}>Edit</button>
                    <button className="btn btn-ghost btn-xs" style={{ color:'var(--red)' }} onClick={()=>handleDeleteEvent(e._id)}><Trash2 size={13}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab==='members' && (
        <div className="members-grid">
          {members.map(m=>(
            <div key={m._id} className="member-card">
              <div className="member-avatar" style={{ overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                {m.avatar ? (
                  <img src={m.avatar} alt={m.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                ) : (
                  m.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="member-info">
                <div className="member-name">{m.name}</div>
                <div className="member-id">{m.studentId}</div>
                <div style={{ fontSize:11,color:'var(--text-muted)' }}>{m.email}</div>
                {m.skills && <div style={{ fontSize:10,color:'var(--purple-light)',marginTop:4 }}>Skills: {m.skills}</div>}
              </div>
              <button className="btn btn-ghost btn-sm" style={{ color:'#f87171',marginTop:8 }} onClick={()=>handleRemove(m._id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {tab==='pending' && (
        pendingMembers.length===0
          ? <div className="empty-state"><Users size={48} style={{ margin:'0 auto 16px',opacity:.3 }}/><h3>No pending requests</h3></div>
          : (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              {pendingMembers.map(m=>(
                <div key={m._id} className="card" style={{ padding:20 }}>
                  <div style={{ display:'flex',gap:16,alignItems:'flex-start',flexWrap:'wrap' }}>
                    <div className="member-avatar" style={{ width:56,height:56,fontSize:18 }}>{m.name?.charAt(0).toUpperCase()}</div>
                    <div style={{ flex:1,minWidth:260 }}>
                      <h3 style={{ fontSize:16,fontWeight:700,marginBottom:4 }}>{m.name}</h3>
                      <div style={{ fontSize:12,color:'var(--text-muted)',marginBottom:10 }}>
                        Email: <strong>{m.email}</strong> · Student ID: <strong>{m.studentId||'—'}</strong>
                      </div>
                      <div style={{ background:'rgba(255,255,255,0.02)',padding:12,borderRadius:8,border:'1px solid var(--border)',marginBottom:12 }}>
                        {m.bio && <><div style={{ fontSize:11,color:'var(--purple-light)',fontWeight:700,textTransform:'uppercase',marginBottom:4 }}>Bio</div>
                        <div style={{ fontSize:13,color:'var(--text-secondary)',lineHeight:1.5,marginBottom:8 }}>{m.bio}</div></>}
                        {m.skills && <><div style={{ fontSize:11,color:'var(--purple-light)',fontWeight:700,textTransform:'uppercase',marginBottom:4 }}>Skills</div>
                        <div style={{ fontSize:13,color:'var(--text-secondary)' }}>{m.skills}</div></>}
                        {m.reasonToJoin && <><div style={{ fontSize:11,color:'var(--accent-light)',fontWeight:700,textTransform:'uppercase',marginTop:8,marginBottom:4 }}>Reason to Join</div>
                        <div style={{ fontSize:13,color:'var(--text-secondary)',lineHeight:1.5 }}>{m.reasonToJoin}</div></>}
                      </div>
                    </div>
                    <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                      <button className="btn btn-primary btn-sm" onClick={()=>handleApprove(m._id)}><CheckCircle size={12}/> Approve</button>
                      <button className="btn btn-danger btn-sm"  onClick={()=>handleReject(m._id)}><XCircle size={12}/> Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {tab==='posts' && (
        clubPosts.length===0 ? <div className="empty-state"><h3>No posts yet</h3></div> : (
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {clubPosts.map(p=>(
              <div key={p._id} className="card" style={{ padding:16 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                  <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                    <div className="user-avatar" style={{ width:32,height:32,fontSize:11,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {p.author.avatar ? (
                        <img src={p.author.avatar} alt={p.author.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                      ) : (
                        p.author.name?.charAt(0)
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600 }}>{p.author.name}</div>
                      <div style={{ fontSize:10,color:'var(--text-muted)' }}>{timeSince(p.createdAt)}</div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-xs" style={{ color:'var(--red)' }} onClick={()=>handleDeletePost(p._id)}><Trash2 size={12}/> Delete</button>
                </div>
                <div style={{ fontSize:13,color:'var(--text-secondary)',whiteSpace:'pre-wrap' }}>{p.content}</div>
              </div>
            ))}
          </div>
        )
      )}

      {tab==='profile' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Club Logo & Banner</h3></div>
          <div className="card-body">
            <form onSubmit={handleClubProfileSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Club Logo</label>
                  {clubForm.logoUrl && <img src={clubForm.logoUrl} alt="Club logo preview" style={{ width:84,height:84,objectFit:'cover',borderRadius:14,border:'1px solid var(--border)',marginBottom:10 }}/>}
                  <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                    <label className="btn btn-ghost btn-sm" style={{ cursor:'pointer' }}><Upload size={14}/> Upload
                      <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>readImage(e.target.files[0], logoUrl=>setClubForm(f=>({...f,logoUrl})))} />
                    </label>
                    {clubForm.logoUrl && <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setClubForm(f=>({...f,logoUrl:''}))}>Remove</button>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Club Banner</label>
                  {clubForm.bannerUrl ? <img src={clubForm.bannerUrl} alt="Club banner preview" style={{ width:'100%',height:120,objectFit:'cover',borderRadius:14,border:'1px solid var(--border)',marginBottom:10 }}/> : <div style={{ height:120,border:'1px dashed var(--border)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',marginBottom:10 }}><Image size={22}/></div>}
                  <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                    <label className="btn btn-ghost btn-sm" style={{ cursor:'pointer' }}><Upload size={14}/> Upload
                      <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>readImage(e.target.files[0], bannerUrl=>setClubForm(f=>({...f,bannerUrl})))} />
                    </label>
                    {clubForm.bannerUrl && <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setClubForm(f=>({...f,bannerUrl:''}))}>Remove</button>}
                  </div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop:8 }}>Save Club Profile</button>
            </form>
          </div>
        </div>
      )}

      {tab==='add-student' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Add New Student</h3></div>
          <div className="card-body">
            <form onSubmit={handleAddStudentSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required value={studentForm.name} onChange={e=>setStudentForm({...studentForm,name:e.target.value})} placeholder="e.g. Rachel Green"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Student ID *</label>
                  <input className="form-input" required value={studentForm.studentId} onChange={e=>setStudentForm({...studentForm,studentId:e.target.value})} placeholder="e.g. 2024CS105"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" required value={studentForm.email} onChange={e=>setStudentForm({...studentForm,email:e.target.value})} placeholder="e.g. rachel@campus.edu"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" required value={studentForm.password} onChange={e=>setStudentForm({...studentForm,password:e.target.value})}/>
                  <p style={{ fontSize:11,color:'var(--text-muted)',marginTop:6 }}>Minimum 6 characters with at least 2 alphabets and 2 numbers.</p>
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" value={studentForm.bio} onChange={e=>setStudentForm({...studentForm,bio:e.target.value})} rows={3}/>
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Skills</label>
                  <input className="form-input" value={studentForm.skills} onChange={e=>setStudentForm({...studentForm,skills:e.target.value})} placeholder="e.g. Python, Public Speaking"/>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop:8 }}><UserPlus size={15}/> Create Student Account</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
