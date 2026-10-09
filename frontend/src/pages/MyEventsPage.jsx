import { confirmAction } from '../util/confirmToast';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyEvents, fetchMyRegistrations, apiDeleteEvent, apiUnregisterFromEvent } from '../api';
import { PlusCircle, Trash2, CalendarDays, MapPin, Users, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = d => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
const fmtFull = d => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const SC = {
  pending:   { label:'Pending Review', cls:'badge-pending' },
  approved:  { label:'Approved',       cls:'badge-approved' },
  rejected:  { label:'Rejected',       cls:'badge-rejected' },
  completed: { label:'Completed',      cls:'badge-completed' },
};

export default function MyEventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('submitted');
  const [submitted, setSubmitted] = useState([]);
  const [registered, setRegistered] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([fetchMyEvents(), fetchMyRegistrations()]);
      setSubmitted(s);
      setRegistered(r);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!await confirmAction('Delete this event?')) return;
    try { await apiDeleteEvent(id); toast.success('Event deleted.'); load(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to delete'); }
  };

  const handleUnregister = async (id) => {
    if (!await confirmAction('Cancel your registration for this event?')) return;
    try { await apiUnregisterFromEvent(id); toast.success('Registration cancelled.'); load(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to cancel'); }
  };

  if (loading) return <div style={{ textAlign:'center',padding:60,color:'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header" style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">My Events</h1>
          <p className="page-subtitle">Events you created and events you've registered for</p>
        </div>
        <button className="btn btn-primary" onClick={()=>navigate('/create-event')}>
          <PlusCircle size={16}/> Create Event
        </button>
      </div>

      <div className="tabs">
        {[
          ['submitted',  `Created (${submitted.length})`],
          ['registered', `Registered (${registered.length})`],
        ].map(([id,lbl])=>(
          <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab==='submitted' && (
        submitted.length===0 ? (
          <div className="empty-state">
            <CalendarDays size={48} style={{ margin:'0 auto 16px',opacity:.3 }}/>
            <h3>No events created yet</h3>
            <p>Create your first event for your club.</p>
            <button className="btn btn-primary" style={{ marginTop:16 }} onClick={()=>navigate('/create-event')}>Create Event</button>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            {submitted.map(e => {
              const sc = SC[e.status] || SC.pending;
              return (
                <div key={e._id} className="card">
                  <div className="card-body" style={{ display:'flex',gap:20,alignItems:'flex-start' }}>
                    {e.poster && <img src={e.poster} alt="poster" style={{ width:90,height:90,borderRadius:10,objectFit:'cover',flexShrink:0 }}/>}
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8,flexWrap:'wrap' }}>
                        <h3 style={{ fontSize:17,fontWeight:700 }}>{e.title}</h3>
                        <span className={`badge ${sc.cls}`}>{sc.label}</span>
                        <span className="badge badge-student">{e.category}</span>
                      </div>
                      <p style={{ fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:10 }}>{e.description}</p>
                      <div style={{ display:'flex',gap:14,flexWrap:'wrap',fontSize:12,color:'var(--text-muted)',marginBottom:8 }}>
                        <span style={{ display:'flex',alignItems:'center',gap:4 }}><CalendarDays size={12}/> {e.eventDate ? fmtFull(e.eventDate) : '—'}</span>
                        <span style={{ display:'flex',alignItems:'center',gap:4 }}><MapPin size={12}/> {e.venue||'TBD'}</span>
                        <span style={{ display:'flex',alignItems:'center',gap:4 }}><Users size={12}/> {e.registrationCount||0}/{e.maxParticipants} registered</span>
                        <span style={{ display:'flex',alignItems:'center',gap:4 }}><Clock size={12}/> Submitted {fmt(e.createdAt)}</span>
                      </div>
                      {e.coordinatorComment && e.status!=='pending' && (
                        <div style={{ marginTop:12,padding:'10px 14px',background:e.status==='approved'?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)',border:`1px solid ${e.status==='approved'?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}`,borderRadius:8 }}>
                          <div style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:e.status==='approved'?'#34d399':'#f87171',marginBottom:4 }}>Coordinator Feedback</div>
                          <p style={{ fontSize:13,color:'var(--text-secondary)' }}>{e.coordinatorComment}</p>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/edit-event/${e._id}`)} style={{ color: 'var(--purple-light)' }}>Edit</button>
                      {e.status==='pending' && (
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(e._id)}><Trash2 size={14}/></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab==='registered' && (
        registered.length===0 ? (
          <div className="empty-state">
            <CheckCircle2 size={48} style={{ margin:'0 auto 16px',opacity:.3 }}/>
            <h3>No registrations yet</h3>
            <p>Browse the feed and register for events.</p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            {registered.map(e => {
              const deadlinePassed = e.registrationDeadline && new Date() > new Date(e.registrationDeadline);
              return (
                <div key={e._id} className="card">
                  <div className="card-body" style={{ display:'flex',gap:20,alignItems:'flex-start' }}>
                    {e.poster && <img src={e.poster} alt="poster" style={{ width:90,height:90,borderRadius:10,objectFit:'cover',flexShrink:0 }}/>}
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8,flexWrap:'wrap' }}>
                        <h3 style={{ fontSize:17,fontWeight:700 }}>{e.title}</h3>
                        <span className="badge badge-approved"><CheckCircle2 size={11} style={{ marginRight:3 }}/>Registered</span>
                        <span className="badge badge-student">{e.category}</span>
                      </div>
                      <p style={{ fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:10 }}>{e.description}</p>
                      <div style={{ display:'flex',gap:14,flexWrap:'wrap',fontSize:12,color:'var(--text-muted)' }}>
                        <span style={{ display:'flex',alignItems:'center',gap:4 }}><CalendarDays size={12}/> {e.eventDate ? fmtFull(e.eventDate) : '—'}</span>
                        <span style={{ display:'flex',alignItems:'center',gap:4 }}><MapPin size={12}/> {e.venue||'TBD'}</span>
                      </div>
                    </div>
                    {!deadlinePassed && (
                      <button className="btn btn-ghost btn-sm" onClick={()=>handleUnregister(e._id)}>Cancel</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
