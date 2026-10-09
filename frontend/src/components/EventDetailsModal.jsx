import { confirmAction } from '../util/confirmToast';
import { useState, useEffect, useCallback } from 'react';
import { fetchEvent, apiLikeEvent, apiCommentEvent, apiUnregisterFromEvent } from '../api';
import { CalendarDays, MapPin, Users, Clock, Heart, MessageCircle, Send, X, ExternalLink, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import RegistrationModal from './RegistrationModal';

const timeSince = (d) => {
  const s = Math.floor((new Date() - new Date(d)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.max(1,Math.floor(s/60))}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

export default function EventDetailsModal({ eventId, currentUser, onClose, onRefresh }) {
  const [event, setEvent]           = useState(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [commentText, setCommentText]   = useState('');
  const [loading, setLoading]           = useState(true);

  const loadEvent = useCallback(async () => {
    try { const data = await fetchEvent(eventId); setEvent(data); }
    catch { toast.error('Failed to load event details'); onClose(); }
    finally { setLoading(false); }
  }, [eventId, onClose]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  const refreshLocal = () => { loadEvent(); if (onRefresh) onRefresh(); };

  if (loading) return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-container" onClick={e=>e.stopPropagation()} style={{ display:'flex',alignItems:'center',justifyContent:'center' }}>
        <div style={{ color:'var(--text-muted)' }}>Loading...</div>
      </div>
    </div>
  );
  if (!event) return null;

  const isLiked      = (event.likes||[]).includes(currentUser._id);
  const likeNames    = (event.likedBy || []).map(l => l.name).filter(Boolean);
  const isRegistered = event.registeredByMe || (event.registrations||[]).some(r => r.userId === currentUser._id);
  const spotsLeft    = event.maxParticipants - (event.registrationCount || (event.registrations||[]).length);
  const deadlinePassed = event.registrationDeadline && new Date() > new Date(event.registrationDeadline);
  const initials = n => n?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  const handleLike = async () => { try { await apiLikeEvent(event._id); refreshLocal(); } catch {} };
  const handleUnregister = async () => {
    if (!await confirmAction('Cancel your registration?')) return;
    try { await apiUnregisterFromEvent(event._id); toast.success('Registration cancelled.'); refreshLocal(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try { await apiCommentEvent(event._id, commentText); setCommentText(''); refreshLocal(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-container" onClick={e=>e.stopPropagation()}>

        <div className="event-modal-header-image">
          {event.poster ? <img src={event.poster} alt="Event Poster" /> :
            <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg, var(--purple-dark), #1e1b4b)' }} />}
          <div className="event-modal-header-overlay" />
          <button className="event-modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="event-modal-content">
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div className="club-avatar">{initials(event.club?.name)}</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--purple-light)' }}>{event.club?.name}</div>
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Organized by <strong>{event.createdBy?.name}</strong></div>
            </div>
            <span className="badge badge-approved" style={{ marginLeft:'auto' }}>{event.category}</span>
          </div>

          <h2 style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', marginBottom:16, lineHeight:1.2 }}>{event.title}</h2>

          <div className="event-modal-grid">
            {/* Left — description & comments */}
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text-secondary)', marginBottom:8 }}>About the Event</h3>
              <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.7, whiteSpace:'pre-wrap', marginBottom:24 }}>{event.description}</p>

              {/* Updates */}
              {(event.updates||[]).length > 0 && (
                <div style={{ marginBottom:28, background:'rgba(255,255,255,0.01)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', margin:'0 0 16px', display:'flex', alignItems:'center', gap:6 }}>
                    <Award size={16} style={{ color:'var(--accent)' }}/> Event Updates ({event.updates.length})
                  </h3>
                  <div className="updates-timeline">
                    {[...event.updates].reverse().map((up, i) => (
                      <div key={i} className="update-timeline-node">
                        <div className="update-node-time">{fmtDate(up.createdAt)}</div>
                        <div className="update-node-text">{up.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="event-comment-section">
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <MessageCircle size={18} style={{ color:'var(--purple-light)' }} />
                  <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', margin:0 }}>Discussion ({(event.comments||[]).length})</h3>
                </div>
                <form onSubmit={handleComment} style={{ display:'flex', gap:8, marginBottom:20 }}>
                  <input className="comment-input" placeholder="Ask a question or share thoughts..." value={commentText} onChange={e=>setCommentText(e.target.value)} />
                  <button className="btn btn-primary btn-sm" type="submit"><Send size={14} /></button>
                </form>
                <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:260, overflowY:'auto', paddingRight:4 }}>
                  {(event.comments||[]).length === 0
                    ? <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', padding:'12px 0' }}>No comments yet. Start the conversation!</p>
                    : [...(event.comments||[])].reverse().map((c, i) => (
                      <div key={i} className="comment" style={{ background:'rgba(255,255,255,0.02)' }}>
                        <div className="user-avatar" style={{ width:28, height:28, fontSize:11, flexShrink:0 }}>{c.user?.name?.charAt(0).toUpperCase()}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                            <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{c.user?.name}</span>
                            <span style={{ fontSize:10, color:'var(--text-muted)' }}>{timeSince(c.createdAt)}</span>
                          </div>
                          <div className="comment-text" style={{ fontSize:12.5 }}>{c.text}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Right — details */}
            <div>
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(124,58,237,0.15)', borderRadius:16, padding:20, display:'flex', flexDirection:'column', gap:16, position:'sticky', top:20 }}>
                <div className="event-detail-item">
                  <CalendarDays size={18} className="event-detail-icon" />
                  <div><div className="event-detail-label">Date & Time</div><div className="event-detail-value">{fmtDate(event.eventDate)}</div></div>
                </div>
                <div className="event-detail-item">
                  <MapPin size={18} className="event-detail-icon" />
                  <div><div className="event-detail-label">Venue</div><div className="event-detail-value">{event.venue || 'TBD'}</div></div>
                </div>
                <div className="event-detail-item">
                  <Users size={18} className="event-detail-icon" />
                  <div><div className="event-detail-label">Attendance</div>
                  <div className="event-detail-value">{event.registrationCount||0} / {event.maxParticipants} Registered</div></div>
                </div>
                <div className="event-detail-item">
                  <Clock size={18} className="event-detail-icon" />
                  <div><div className="event-detail-label">Deadline</div>
                  <div className="event-detail-value" style={{ color: deadlinePassed ? '#f87171' : 'inherit' }}>{fmtDate(event.registrationDeadline)}</div></div>
                </div>

                {event.registrationUrl && (
                  <a href={event.registrationUrl.startsWith('http') ? event.registrationUrl : `https://${event.registrationUrl}`}
                    target="_blank" rel="noopener noreferrer" className="btn btn-secondary"
                    style={{ width:'100%', justifyContent:'center', gap:6, display:'inline-flex' }}>
                    <ExternalLink size={14}/> Registration Link
                  </a>
                )}

                <button className={`btn btn-ghost btn-sm ${isLiked ? 'liked' : ''}`} onClick={handleLike}
                  style={{ width:'100%', justifyContent:'center', border:'1px solid var(--border)', gap:8, color: isLiked ? 'var(--purple-light)' : 'inherit' }}>
                  <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
                  {isLiked ? 'Liked' : 'Like Event'} ({(event.likes||[]).length})
                </button>
                {likeNames.length > 0 && <div style={{ fontSize:11,color:'var(--text-muted)',lineHeight:1.5 }}>Liked by {likeNames.join(', ')}</div>}

                <div style={{ marginTop:8 }}>
                  {isRegistered ? (
                    <button className="btn btn-danger" onClick={handleUnregister} style={{ width:'100%' }}>Cancel Registration</button>
                  ) : deadlinePassed ? (
                    <button className="btn btn-ghost" disabled style={{ width:'100%', cursor:'not-allowed' }}>Registration Closed</button>
                  ) : spotsLeft <= 0 ? (
                    <button className="btn btn-ghost" disabled style={{ width:'100%', cursor:'not-allowed' }}>Fully Booked</button>
                  ) : (
                    <button className="btn btn-primary" onClick={()=>setShowRegModal(true)} style={{ width:'100%' }}>Register Now</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRegModal && (
        <RegistrationModal event={event} user={currentUser} onClose={()=>setShowRegModal(false)} onDone={refreshLocal} />
      )}
    </div>
  );
}
