import { confirmAction } from '../util/confirmToast';
import { useState, useEffect, useCallback } from 'react';
import {
  adminGetUsers, adminGetStats, adminCreateUser, adminUpdateRole, adminToggleStatus,
  fetchClubs, fetchApprovedEvents, fetchFeedPosts,
  apiCreateClub, apiUpdateClub, apiDeactivateClub,
  apiAssignCoordinator, apiAssignAdvisor,
  apiDeleteEvent, apiDeletePost
} from '../api';
import { Users, BookOpen, CalendarDays, Shield, Plus, Edit, Trash2, Check, X, Search, UserPlus, Upload, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const readImage = (file, done) => {
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB'); return; }
  const reader = new FileReader();
  reader.onload = e => done(e.target.result);
  reader.readAsDataURL(file);
};

const CATS  = ['Technical','Cultural','Sports','Literary','Entrepreneurship','Social Service','Other'];
const ROLES = ['student','coordinator','advisor','admin'];
const fmt   = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
const fmtFull = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={16}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab]               = useState('overview');
  const [users, setUsers]           = useState([]);
  const [clubs, setClubs]           = useState([]);
  const [events, setEvents]         = useState([]);
  const [posts, setPosts]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [postSearch, setPostSearch] = useState('');

  const [showClubModal, setShowClubModal]   = useState(false);
  const [showUserModal, setShowUserModal]   = useState(false);
  const [editClub, setEditClub]             = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(null);

  const [clubForm, setClubForm] = useState({ name:'',description:'',category:'Technical',foundedYear:new Date().getFullYear(),logoUrl:'',bannerUrl:'' });
  const [userForm, setUserForm] = useState({ name:'',email:'',password:'default123',studentId:'',role:'student',bio:'',skills:'',phone:'' });

  const load = useCallback(async () => {
    try {
      const [usersResult, clubsResult, eventsResult, postsResult, statsResult] = await Promise.allSettled([
        adminGetUsers(),
        fetchClubs(),
        fetchApprovedEvents(),
        fetchFeedPosts(),
        adminGetStats(),
      ]);

      if (usersResult.status === 'fulfilled') setUsers(usersResult.value);
      else console.error('Failed to load admin users', usersResult.reason);

      if (clubsResult.status === 'fulfilled') setClubs(clubsResult.value);
      else console.error('Failed to load admin clubs', clubsResult.reason);

      if (eventsResult.status === 'fulfilled') setEvents(eventsResult.value);
      else console.error('Failed to load admin events', eventsResult.reason);

      if (postsResult.status === 'fulfilled') setPosts(postsResult.value);
      else console.error('Failed to load admin posts', postsResult.reason);

      setStats(statsResult.status === 'fulfilled' ? statsResult.value : null);

      const requiredFailed = [usersResult, clubsResult, eventsResult, postsResult]
        .every(result => result.status === 'rejected');
      if (requiredFailed) toast.error('Failed to load admin data');
    } catch (err) {
      console.error('Failed to load admin data', err);
      toast.error('Failed to load admin data');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClubSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editClub) { await apiUpdateClub(editClub._id, clubForm); toast.success('Club updated!'); }
      else { await apiCreateClub({ ...clubForm, foundedYear: Number(clubForm.foundedYear) }); toast.success('Club created!'); }
      setShowClubModal(false); setEditClub(null);
      setClubForm({ name:'',description:'',category:'Technical',foundedYear:new Date().getFullYear(),logoUrl:'',bannerUrl:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminCreateUser(userForm);
      toast.success('User account created!');
      setShowUserModal(false);
      setUserForm({ name:'',email:'',password:'default123',studentId:'',role:'student',bio:'',skills:'',phone:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message ?? 'Email already exists or failed'); }
  };

  const handleDeleteClub = async (id) => {
    if (!await confirmAction('Deactivate this club?')) return;
    try { await apiDeactivateClub(id); toast.success('Club deactivated.'); load(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const openEditClub = (club) => {
    setEditClub(club);
    setClubForm({ name:club.name, description:club.description, category:club.category, foundedYear:club.foundedYear, logoUrl:club.logoUrl || '', bannerUrl:club.bannerUrl || '' });
    setShowClubModal(true);
  };

  const handleAssign = async (userId) => {
    const { club, type } = showAssignModal;
    try {
      if (type==='coordinator') await apiAssignCoordinator(club._id, userId);
      else if (type==='advisor') await apiAssignAdvisor(club._id, userId);
      toast.success(`${type==='coordinator'?'Coordinator':'Advisor'} assigned!`);
      setShowAssignModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const handleRoleChange = async (userId, role) => {
    try { await adminUpdateRole(userId, role); toast.success('Role updated!'); load(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const handleToggle = async (userId) => {
    try { await adminToggleStatus(userId); toast.success('Status toggled!'); load(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const handleDeleteEvent = async (id) => {
    if (!await confirmAction('Delete this event?')) return;
    try { await apiDeleteEvent(id); toast.success('Event deleted.'); load(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const handleDeletePost = async (id) => {
    if (!await confirmAction('Delete this post?')) return;
    try { await apiDeletePost(id); toast.success('Post deleted.'); load(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  const filteredUsers = users.filter(u => {
    const ms = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const mr = !userRoleFilter || u.role===userRoleFilter;
    return ms && mr;
  });
  const filteredPosts = posts.filter(p => !postSearch || p.content.toLowerCase().includes(postSearch.toLowerCase()) || p.author.name.toLowerCase().includes(postSearch.toLowerCase()));

  const totalUsers  = stats?.totalUsers  ?? users.length;
  const activeClubs = stats?.activeClubs ?? clubs.filter(c=>c.isActive).length;
  const totalEvents = stats?.totalEvents ?? events.length;
  const totalPosts  = stats?.totalPosts  ?? posts.length;
  const roleBreakdown = ROLES.map(r => ({ _id:r, count:users.filter(u=>u.role===r).length })).filter(r=>r.count>0);

  if (loading) return <div style={{ textAlign:'center',padding:60,color:'var(--text-muted)' }}>Loading admin panel...</div>;

  return (
    <div>
      <div className="page-header" style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage clubs, users, coordinators, events, and posts</p>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { label:'Total Users',  value:totalUsers,  icon:<Users/>,       color:'#7c3aed', bg:'rgba(124,58,237,0.1)' },
          { label:'Active Clubs', value:activeClubs, icon:<BookOpen/>,    color:'#10b981', bg:'rgba(16,185,129,0.1)' },
          { label:'Total Events', value:totalEvents, icon:<CalendarDays/>,color:'#3b82f6', bg:'rgba(59,130,246,0.1)' },
          { label:'Total Posts',  value:totalPosts,  icon:<Shield/>,      color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background:s.bg,color:s.color }}>{s.icon}</div>
            <div><div className="stat-number">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[['overview','Overview'],['clubs','Clubs'],['users','Users'],['events','Events'],['posts','Posts']].map(([id,lbl])=>(
          <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* CLUBS */}
      {tab==='clubs' && (
        <div>
          <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:16 }}>
            <button className="btn btn-primary" onClick={()=>{setEditClub(null);setClubForm({name:'',description:'',category:'Technical',foundedYear:new Date().getFullYear(),logoUrl:'',bannerUrl:''});setShowClubModal(true);}}>
              <Plus size={16}/> Create Club
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Club</th><th>Category</th><th>Coordinator</th><th>Advisor</th><th>Members</th><th>Actions</th></tr></thead>
              <tbody>
                {clubs.map(club=>(
                  <tr key={club._id}>
                    <td><div style={{ fontWeight:600,color:'var(--text-primary)' }}>{club.name}</div><div style={{ fontSize:11,color:'var(--text-muted)' }}>Est. {club.foundedYear}</div></td>
                    <td><span className="badge badge-student">{club.category}</span></td>
                    <td>
                      {club.coordinator ? <div style={{ fontSize:13 }}>{club.coordinator.name}</div> : null}
                      <button className="btn btn-ghost btn-xs" style={{ marginTop:club.coordinator?4:0 }} onClick={()=>setShowAssignModal({club,type:'coordinator'})}>
                        {club.coordinator?'Change':'+ Assign'}
                      </button>
                    </td>
                    <td>
                      {club.advisor ? <div style={{ fontSize:13 }}>{club.advisor.name}</div> : null}
                      <button className="btn btn-ghost btn-xs" style={{ marginTop:club.advisor?4:0 }} onClick={()=>setShowAssignModal({club,type:'advisor'})}>
                        {club.advisor?'Change':'+ Assign'}
                      </button>
                    </td>
                    <td><span>{club.members?.length||0}</span></td>
                    <td>
                      <div style={{ display:'flex',gap:6 }}>
                        <button className="btn btn-ghost btn-xs" onClick={()=>openEditClub(club)}><Edit size={12}/></button>
                        <button className="btn btn-danger btn-xs" onClick={()=>handleDeleteClub(club._id)}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab==='users' && (
        <div>
          <div className="filters-row" style={{ marginBottom:16,display:'flex',justifyContent:'space-between' }}>
            <div style={{ display:'flex',gap:10,flex:1 }}>
              <div style={{ position:'relative',flex:1 }}>
                <Search size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)' }}/>
                <input className="search-input" placeholder="Search users..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} style={{ paddingLeft:36 }}/>
              </div>
              <select className="form-select" style={{ width:160 }} value={userRoleFilter} onChange={e=>setUserRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                {ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={()=>setShowUserModal(true)}><Plus size={16}/> Create User / Staff</button>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>User</th><th>Email</th><th>Student ID</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.map(u=>(
                  <tr key={u._id}>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <div className="user-avatar" style={{ width:28,height:28,fontSize:11,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                          ) : (
                            u.name?.charAt(0)
                          )}
                        </div>
                        <span style={{ fontWeight:600,color:'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.studentId||'—'}</td>
                    <td>
                      <select className="form-select" style={{ width:130,padding:'4px 10px',fontSize:12 }} value={u.role} onChange={e=>handleRoleChange(u._id,e.target.value)}>
                        {ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge ${u.isActive?'badge-approved':'badge-rejected'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                    <td style={{ fontSize:12 }}>{fmt(u.createdAt)}</td>
                    <td><button className={`btn btn-xs ${u.isActive?'btn-danger':'btn-success'}`} onClick={()=>handleToggle(u._id)}>{u.isActive?'Deactivate':'Activate'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EVENTS */}
      {tab==='events' && (
        <div className="table-container">
          <table>
            <thead><tr><th>Event</th><th>Club</th><th>Category</th><th>Date</th><th>Registered</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {events.map(e=>(
                <tr key={e._id}>
                  <td style={{ fontWeight:600,color:'var(--text-primary)' }}>{e.title}</td>
                  <td>{e.club?.name}</td>
                  <td><span className="badge badge-student">{e.category}</span></td>
                  <td style={{ fontSize:12 }}>{fmtFull(e.eventDate)}</td>
                  <td>{e.registrationCount||0}/{e.maxParticipants}</td>
                  <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                  <td><button className="btn btn-danger btn-xs" onClick={()=>handleDeleteEvent(e._id)}><Trash2 size={12}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* POSTS */}
      {tab==='posts' && (
        <div>
          <div className="filters-row" style={{ marginBottom:16 }}>
            <div style={{ position:'relative',flex:1 }}>
              <Search size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)' }}/>
              <input className="search-input" placeholder="Search posts..." value={postSearch} onChange={e=>setPostSearch(e.target.value)} style={{ paddingLeft:36 }}/>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Post Content</th><th>Author</th><th>Type</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredPosts.map(p=>(
                  <tr key={p._id}>
                    <td style={{ maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.content}</td>
                    <td>
                      <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                        <div className="user-avatar" style={{ width:20,height:20,fontSize:8,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                          {p.author.avatar ? (
                            <img src={p.author.avatar} alt={p.author.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                          ) : (
                            p.author.name?.charAt(0)
                          )}
                        </div>
                        <span>{p.author.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-student" style={{ fontSize:10 }}>{p.type}</span></td>
                    <td style={{ fontSize:12 }}>{fmt(p.createdAt)}</td>
                    <td><button className="btn btn-danger btn-xs" onClick={()=>handleDeletePost(p._id)}><Trash2 size={12}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OVERVIEW */}
      {tab==='overview' && (
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize:16,fontWeight:700 }}>Clubs Overview</h3></div>
            <div className="card-body" style={{ padding:'12px 0' }}>
              {clubs.slice(0,6).map(c=>(
                <div key={c._id} style={{ display:'flex',alignItems:'center',gap:12,padding:'8px 20px',borderBottom:'1px solid rgba(124,58,237,0.06)' }}>
                  <div style={{ width:34,height:34,borderRadius:8,background:'var(--purple-dim)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne',fontWeight:700,fontSize:12 }}>{c.name?.charAt(0)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize:11,color:'var(--text-muted)' }}>{c.members?.length||0} members · {c.category}</div>
                  </div>
                  <span className={`badge ${c.coordinator?'badge-approved':'badge-pending'}`} style={{ fontSize:10 }}>
                    {c.coordinator?'Has Coordinator':'No Coordinator'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize:16,fontWeight:700 }}>User Roles</h3></div>
            <div className="card-body">
              {roleBreakdown.map(r=>(
                <div key={r._id} style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
                  <span className={`badge badge-${r._id}`} style={{ minWidth:90,justifyContent:'center' }}>{r._id}</span>
                  <div style={{ flex:1,height:8,background:'var(--bg-secondary)',borderRadius:4,overflow:'hidden' }}>
                    <div style={{ height:'100%',background:'var(--purple)',borderRadius:4,width:`${Math.min(100,(r.count/Math.max(1,totalUsers))*100)}%` }}/>
                  </div>
                  <span style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)',minWidth:24,textAlign:'right' }}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Club Modal */}
      {showClubModal && (
        <Modal title={editClub?'Edit Club':'Create New Club'} onClose={()=>setShowClubModal(false)}>
          <form onSubmit={handleClubSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Club Name *</label>
                <input className="form-input" placeholder="e.g. Coding Club" value={clubForm.name} onChange={e=>setClubForm({...clubForm,name:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={clubForm.category} onChange={e=>setClubForm({...clubForm,category:e.target.value})}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" value={clubForm.description} onChange={e=>setClubForm({...clubForm,description:e.target.value})} required/>
            </div>
            <div className="form-group">
              <label className="form-label">Founded Year</label>
              <input className="form-input" type="number" value={clubForm.foundedYear} onChange={e=>setClubForm({...clubForm,foundedYear:e.target.value})}/>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Club Logo</label>
                {clubForm.logoUrl && <img src={clubForm.logoUrl} alt="Club logo preview" style={{ width:72,height:72,objectFit:'cover',borderRadius:12,border:'1px solid var(--border)',marginBottom:10 }}/>}
                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  <label className="btn btn-ghost btn-sm" style={{ cursor:'pointer' }}><Upload size={14}/> Upload
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>readImage(e.target.files[0], logoUrl=>setClubForm(f=>({...f,logoUrl})))} />
                  </label>
                  {clubForm.logoUrl && <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setClubForm(f=>({...f,logoUrl:''}))}>Remove</button>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Club Banner</label>
                {clubForm.bannerUrl ? <img src={clubForm.bannerUrl} alt="Club banner preview" style={{ width:'100%',height:72,objectFit:'cover',borderRadius:12,border:'1px solid var(--border)',marginBottom:10 }}/> : <div style={{ height:72,border:'1px dashed var(--border)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',marginBottom:10 }}><Image size={18}/></div>}
                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  <label className="btn btn-ghost btn-sm" style={{ cursor:'pointer' }}><Upload size={14}/> Upload
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>readImage(e.target.files[0], bannerUrl=>setClubForm(f=>({...f,bannerUrl})))} />
                  </label>
                  {clubForm.bannerUrl && <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setClubForm(f=>({...f,bannerUrl:''}))}>Remove</button>}
                </div>
              </div>
            </div>
            <div style={{ display:'flex',gap:10 }}>
              <button type="submit" className="btn btn-primary">{editClub?'Update Club':'Create Club'}</button>
              <button type="button" className="btn btn-ghost" onClick={()=>setShowClubModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* User Modal */}
      {showUserModal && (
        <Modal title="Create New Student or Staff" onClose={()=>setShowUserModal(false)}>
          <form onSubmit={handleUserSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="e.g. Peter Parker" value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-select" value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}>
                  <option value="student">Student</option>
                  <option value="coordinator">Club Coordinator</option>
                  <option value="advisor">Faculty Advisor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" placeholder="e.g. peter@campus.edu" value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})} required/>
                <p style={{ fontSize:11,color:'var(--text-muted)',marginTop:6 }}>Minimum 6 characters with at least 2 alphabets and 2 numbers.</p>
              </div>
            </div>
            {userForm.role==='student' && (
              <div className="form-group">
                <label className="form-label">Student ID *</label>
                <input className="form-input" placeholder="e.g. 2024CS101" value={userForm.studentId} onChange={e=>setUserForm({...userForm,studentId:e.target.value})} required/>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Contact Number (Phone)</label>
              <input className="form-input" placeholder="e.g. +91 9876543210" value={userForm.phone} onChange={e=>setUserForm({...userForm,phone:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">Skills (Optional)</label>
              <input className="form-input" placeholder="e.g. Python, Public Speaking" value={userForm.skills} onChange={e=>setUserForm({...userForm,skills:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">Bio (Optional)</label>
              <textarea className="form-textarea" value={userForm.bio} onChange={e=>setUserForm({...userForm,bio:e.target.value})} rows={2}/>
            </div>
            <div style={{ display:'flex',gap:10,marginTop:12 }}>
              <button type="submit" className="btn btn-primary" style={{ flex:1 }}><UserPlus size={15}/> Create Account</button>
              <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setShowUserModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <Modal title={`Assign ${showAssignModal.type==='coordinator'?'Coordinator':'Advisor'} — ${showAssignModal.club.name}`} onClose={()=>setShowAssignModal(null)}>
          <p style={{ fontSize:13,color:'var(--text-secondary)',marginBottom:16 }}>Select a user to assign as {showAssignModal.type}.</p>
          <div style={{ maxHeight:400,overflowY:'auto',display:'flex',flexDirection:'column',gap:8 }}>
            {users.map(u=>(
              <div key={u._id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'var(--bg-secondary)',borderRadius:10,border:'1px solid var(--border)' }}>
                <div className="user-avatar" style={{ width:32,height:32,fontSize:12,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                  ) : (
                    u.name?.charAt(0)
                  )}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{u.name}</div>
                  <div style={{ fontSize:11,color:'var(--text-muted)' }}>{u.email} · <span className={`badge badge-${u.role}`} style={{ fontSize:10,padding:'1px 6px' }}>{u.role}</span></div>
                </div>
                <button className="btn btn-primary btn-xs" onClick={()=>handleAssign(u._id)}><Check size={12}/> Select</button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
