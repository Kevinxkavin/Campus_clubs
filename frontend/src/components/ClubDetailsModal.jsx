import { confirmAction } from '../util/confirmToast';
import { useState, useEffect, useCallback } from 'react';
import { fetchClub, fetchClubEvents, fetchClubPosts, apiLikePost, apiCommentPost, apiDeletePost, apiVotePoll } from '../api';
import { X, CalendarDays, Trophy, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import EventDetailsModal from './EventDetailsModal';

const timeSince = (d) => {
  if (!d) return 'Just now';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return 'Just now';
  const s = Math.floor((new Date() - parsed) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.max(1, Math.floor(s/60))}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

function ClubPostCard({ post, user, onRefresh }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isLiked = (post.likes || []).includes(user._id);
  const likeNames = (post.likedBy || []).map(l => l.name).filter(Boolean);
  const totalVotes = post.poll ? post.poll.options.reduce((sum, opt) => sum + (opt.votes || []).length, 0) : 0;
  const userHasVoted = post.poll ? post.poll.options.some(opt => (opt.votes || []).includes(user._id)) : false;
  const canDelete = post.author._id === user._id || user.role === 'admin' || user.role === 'coordinator';
  const initials = post.author.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleLike    = async () => { try { await apiLikePost(post._id); onRefresh(); } catch {} };
  const handleVote    = async (idx) => {
    try { await apiVotePoll(post._id, idx); onRefresh(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to vote'); }
  };
  const handleDelete  = async () => {
    if (!await confirmAction('Delete this post?')) return;
    try { await apiDeletePost(post._id); toast.success('Post deleted.'); onRefresh(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to delete post'); }
  };
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try { await apiCommentPost(post._id, commentText); setCommentText(''); onRefresh(); } catch {}
  };

  return (
    <div className="post-card" style={{ background: 'rgba(255,255,255,0.01)' }}>
      <div className="post-header" style={{ padding: '12px 16px' }}>
        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 11, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {post.author.avatar ? (
            <img src={post.author.avatar} alt={post.author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
        <div className="post-author-info">
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {post.author.name}
            <span className={`badge badge-${post.author.role}`} style={{ fontSize: 8, padding: '0px 4px', marginLeft: 6 }}>{post.author.role}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeSince(post.createdAt)}</div>
        </div>
        {canDelete && (
          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--red)', marginLeft: 'auto' }} onClick={handleDelete}><Trash2 size={11}/></button>
        )}
      </div>

      <div className="post-body" style={{ padding: '12px 16px', fontSize: 13.5 }}>
        <div style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>{post.content}</div>

        {post.type === 'achievement' && post.achievement && (
          <div className="post-achievement-banner" style={{ padding: 12, gap: 10 }}>
            <div className="post-achievement-badge" style={{ width: 34, height: 34 }}><Trophy size={16}/></div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--accent-light)' }}>{post.achievement.title}</div>
            </div>
          </div>
        )}

        {post.type === 'poll' && post.poll && (
          <div className="post-poll-container" style={{ padding: 12 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>{post.poll.question}</div>
            <div className="post-poll-options" style={{ gap: 6 }}>
              {post.poll.options.map((opt, idx) => {
                const optVotes = (opt.votes || []).length;
                const pct = totalVotes > 0 ? Math.round((optVotes/totalVotes)*100) : 0;
                return (
                  <div key={idx} className="post-poll-option" onClick={() => !userHasVoted && handleVote(idx)} style={{ padding: '8px 12px', fontSize: 12.5 }}>
                    {userHasVoted && <div className="post-poll-option-fill" style={{ width: `${pct}%` }} />}
                    <span className="post-poll-option-text">{opt.text}</span>
                    {userHasVoted && <span className="post-poll-option-percentage">{pct}%</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {post.type === 'picture' && post.pictureUrl && (
          <div className="post-picture-container" style={{ maxHeight: 300 }}>
            <img src={post.pictureUrl} alt="Post" />
          </div>
        )}
      </div>

      <div className="post-actions-row" style={{ padding: '8px 16px' }}>
        <button className={`post-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike} style={{ fontSize: 12 }}>
          <Heart size={13}/> Like ({(post.likes || []).length})
        </button>
        <button className="post-action-btn" onClick={() => setShowComments(!showComments)} style={{ fontSize: 12 }}>
          <MessageCircle size={13}/> Comment ({(post.comments || []).length})
        </button>
      </div>
      {likeNames.length > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 16px 10px' }}>Liked by {likeNames.join(', ')}</div>}

      {showComments && (
        <div className="post-comments-container" style={{ padding: '10px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto', marginBottom: 8 }}>
            {(post.comments || []).length === 0
              ? <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>No comments yet.</p>
              : (post.comments || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div className="post-comment-bubble" style={{ padding: '6px 10px' }}>
                    <div className="post-comment-author" style={{ fontSize: 11 }}>
                      <span>{c.user.name}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{timeSince(c.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{c.text}</div>
                  </div>
                </div>
              ))
            }
          </div>
          <form onSubmit={handleComment} style={{ display: 'flex', gap: 6 }}>
            <input className="comment-input" placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ fontSize: 11.5, padding: '6px 10px' }} />
            <button className="btn btn-primary btn-sm" type="submit" style={{ padding: '6px 10px' }}><Send size={11}/></button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ClubDetailsModal({ clubId, currentUser, onClose, onRefresh }) {
  const [activeTab, setActiveTab]         = useState('members');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [club, setClub]     = useState(null);
  const [events, setEvents] = useState([]);
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  const CAT_COLORS = { Technical:'#7c3aed',Cultural:'#f59e0b',Sports:'#10b981',Literary:'#3b82f6',Entrepreneurship:'#ef4444','Social Service':'#ec4899',Other:'#6b7280' };

  const load = useCallback(async () => {
    try {
      const [c, e, p] = await Promise.all([
        fetchClub(clubId),
        fetchClubEvents(clubId).catch(() => []),
        fetchClubPosts(clubId).catch(() => []),
      ]);
      setClub(c);
      setEvents(e.filter(ev => ev.status === 'approved'));
      setPosts(p);
    } catch { onClose(); }
    finally { setLoading(false); }
  }, [clubId]);

  useEffect(() => { load(); }, [load]);

  const refreshLocal = () => { load(); if (onRefresh) onRefresh(); };

  if (loading) return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal-container" onClick={e => e.stopPropagation()} style={{ display:'flex',alignItems:'center',justifyContent:'center' }}>
        <div style={{ color:'var(--text-muted)' }}>Loading...</div>
      </div>
    </div>
  );
  if (!club) return null;

  const initials = club.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <div className="event-modal-overlay" onClick={onClose}>
        <div className="event-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 780, minHeight: '60vh' }}>

          <div style={{ height: 120, background: club.bannerUrl ? undefined : `linear-gradient(135deg, ${CAT_COLORS[club.category]||'#7c3aed'}aa, ${CAT_COLORS[club.category]||'#7c3aed'}44)`, position: 'relative', overflow: 'hidden' }}>
            {club.bannerUrl && <img src={club.bannerUrl} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }} />}
            <div style={{ position:'absolute',bottom:-20,left:32,width:64,height:64,borderRadius:14,background:'var(--bg-card)',border:'3px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne',fontSize:20,fontWeight:700,overflow:'hidden' }}>
              {club.logoUrl ? <img src={club.logoUrl} alt={club.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : initials}
            </div>
            <button className="event-modal-close-btn" onClick={onClose}><X size={18} /></button>
          </div>

          <div className="event-modal-content" style={{ paddingTop: 32 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:22,fontWeight:800,color:'var(--text-primary)',marginBottom:6 }}>{club.name}</h2>
                <span className="badge" style={{ background:`${CAT_COLORS[club.category]||'#7c3aed'}22`,color:CAT_COLORS[club.category]||'#7c3aed',border:`1px solid ${CAT_COLORS[club.category]||'#7c3aed'}44` }}>{club.category}</span>
                <p style={{ marginTop:12,fontSize:13.5,color:'var(--text-secondary)',lineHeight:1.6,maxWidth:540 }}>{club.description}</p>
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:6,fontSize:12,color:'var(--text-muted)',background:'rgba(255,255,255,0.01)',border:'1px solid var(--border)',padding:'10px 14px',borderRadius:8 }}>
                <div>Est. Year: <strong>{club.foundedYear}</strong></div>
                <div>Members: <strong>{club.members?.length||0}</strong></div>
              </div>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:12,marginBottom:24 }}>
              {club.coordinator && (
                <div style={{ padding:12,background:'var(--bg-secondary)',borderRadius:10,border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',marginBottom:6 }}>Coordinator</div>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div className="user-avatar" style={{ width:28,height:28,fontSize:11,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {club.coordinator.avatar ? (
                        <img src={club.coordinator.avatar} alt={club.coordinator.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                      ) : (
                        club.coordinator.name?.charAt(0)
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:12.5,fontWeight:600 }}>{club.coordinator.name}</div>
                      <div style={{ fontSize:10.5,color:'var(--text-muted)' }}>{club.coordinator.email}</div>
                      {club.coordinator.phone && <div style={{ fontSize:10,color:'var(--text-muted)' }}>Phone: {club.coordinator.phone}</div>}
                    </div>
                  </div>
                </div>
              )}
              {club.advisor && (
                <div style={{ padding:12,background:'var(--bg-secondary)',borderRadius:10,border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',marginBottom:6 }}>Advisor</div>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div className="user-avatar" style={{ width:28,height:28,fontSize:11,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {club.advisor.avatar ? (
                        <img src={club.advisor.avatar} alt={club.advisor.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                      ) : (
                        club.advisor.name?.charAt(0)
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:12.5,fontWeight:600 }}>{club.advisor.name}</div>
                      <div style={{ fontSize:10.5,color:'var(--text-muted)' }}>{club.advisor.email}</div>
                      {club.advisor.phone && <div style={{ fontSize:10,color:'var(--text-muted)' }}>Phone: {club.advisor.phone}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="tabs" style={{ marginBottom: 16 }}>
              <button className={`tab-btn ${activeTab==='members'?'active':''}`} onClick={()=>setActiveTab('members')}>Members ({club.members?.length||0})</button>
              <button className={`tab-btn ${activeTab==='events'?'active':''}`} onClick={()=>setActiveTab('events')}>Events ({events.length})</button>
              <button className={`tab-btn ${activeTab==='posts'?'active':''}`} onClick={()=>setActiveTab('posts')}>Posts ({posts.length})</button>
            </div>

            <div style={{ maxHeight:300,overflowY:'auto',paddingRight:6 }}>
              {activeTab==='members' && (
                club.members?.length===0
                  ? <p style={{ color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'20px 0' }}>No members yet.</p>
                  : <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',gap:10 }}>
                      {club.members?.map(m=>(
                        <div key={m._id} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--bg-secondary)',borderRadius:8,border:'1px solid var(--border)' }}>
                          <div className="user-avatar" style={{ width:28,height:28,fontSize:11,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                            ) : (
                              m.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{m.name}</div>
                            {m.studentId && <div style={{ fontSize:10.5,color:'var(--text-muted)' }}>{m.studentId}</div>}
                            {m.phone && <div style={{ fontSize:10,color:'var(--text-muted)' }}>Phone: {m.phone}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
              )}

              {activeTab==='events' && (
                events.length===0
                  ? <p style={{ color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'20px 0' }}>No events yet.</p>
                  : <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                      {events.map(e=>(
                        <div key={e._id} className="modal-clickable-card" onClick={()=>setSelectedEventId(e._id)}
                          style={{ display:'flex',gap:12,padding:12,background:'var(--bg-secondary)',borderRadius:8,border:'1px solid var(--border)',alignItems:'center',cursor:'pointer' }}>
                          {e.poster
                            ? <img src={e.poster} alt={e.title} style={{ width:44,height:44,borderRadius:6,objectFit:'cover' }}/>
                            : <div style={{ width:44,height:44,borderRadius:6,background:'var(--purple-dim)',display:'flex',alignItems:'center',justifyContent:'center' }}><CalendarDays size={18} style={{ color:'var(--purple-light)' }}/></div>
                          }
                          <div>
                            <div style={{ fontSize:13.5,fontWeight:700,color:'var(--text-primary)' }}>{e.title}</div>
                            <div style={{ fontSize:11,color:'var(--text-muted)' }}>{new Date(e.eventDate).toLocaleDateString()} · {e.venue}</div>
                          </div>
                          <span className="badge badge-approved" style={{ marginLeft:'auto',fontSize:10 }}>{e.category}</span>
                        </div>
                      ))}
                    </div>
              )}

              {activeTab==='posts' && (
                posts.length===0
                  ? <p style={{ color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'20px 0' }}>No posts yet.</p>
                  : <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                      {posts.map(p=><ClubPostCard key={p._id} post={p} user={currentUser} onRefresh={refreshLocal}/>)}
                    </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedEventId && (
        <EventDetailsModal eventId={selectedEventId} currentUser={currentUser} onClose={()=>setSelectedEventId(null)} onRefresh={refreshLocal}/>
      )}
    </>
  );
}
