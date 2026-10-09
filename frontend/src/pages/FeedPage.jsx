import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchFeedPosts, fetchApprovedEvents, fetchClubs,
  apiCreatePost, apiUpdatePost, apiLikePost, apiCommentPost, apiDeletePost, apiVotePoll,
  apiLikeEvent, apiRegisterForEvent, apiUnregisterFromEvent
} from '../api';
import {
  Heart, MessageCircle, Search, Send, Filter, Trophy, BarChart3,
  Image, Trash2, X, Award, CalendarDays, MapPin, Users, ChevronRight,
  Zap, Pencil, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import EventDetailsModal from '../components/EventDetailsModal';
import { useConfirm } from '../components/ConfirmDialog';

const timeSince = (d) => {
  if (!d) return 'Just now';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return 'Just now';
  const s = Math.floor((new Date() - parsed) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ─────────────────────────────────────────────────────────────
   Available Events Strip (unchanged logic)
───────────────────────────────────────────────────────────── */
function AvailableEventsStrip({ events, currentUser, onRefresh }) {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const now = new Date();
  const upcoming = events
    .filter(e => e.status === 'approved' && new Date(e.eventDate) >= now)
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
    .slice(0, 10);

  if (upcoming.length === 0) return null;
  const isReg    = (e) => e.registeredByMe || (e.registrations || []).some(r => r.userId === currentUser._id);
  const spotsLeft = (e) => e.maxParticipants - (e.registrationCount || (e.registrations || []).length);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, var(--purple), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Available Events</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{upcoming.length} upcoming event{upcoming.length !== 1 && 's'} · click to view details</div>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
          {upcoming.map(event => {
            const reg    = isReg(event);
            const spots  = spotsLeft(event);
            const urgent = (new Date(event.eventDate) - now) < 7 * 24 * 60 * 60 * 1000;
            return (
              <div key={event._id} onClick={() => setSelectedEventId(event._id)}
                style={{ minWidth: 220, maxWidth: 220, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0, overflow: 'hidden', transition: 'all 0.22s ease', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.boxShadow = 'var(--shadow-purple)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)'; }}>
                {event.poster
                  ? <img src={event.poster} alt={event.title} style={{ width: '100%', height: 90, objectFit: 'cover' }} />
                  : <div style={{ height: 70, background: 'linear-gradient(135deg, var(--purple) 0%, var(--accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CalendarDays size={24} color="rgba(255,255,255,0.7)" /></div>
                }
                <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {urgent && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: '#ef4444', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Soon</span>}
                  {reg    && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: '#10b981', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Registered</span>}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{event.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--purple-light)', fontWeight: 600, marginBottom: 6 }}>{event.club?.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}><CalendarDays size={10} />{fmtDate(event.eventDate)}</div>
                    {event.venue && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}><MapPin size={10} />{event.venue}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: spots <= 5 ? 'var(--red)' : 'var(--text-muted)' }}><Users size={10} />{spots > 0 ? `${spots} spots left` : 'Full'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Club Posts</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      {selectedEventId && <EventDetailsModal eventId={selectedEventId} currentUser={currentUser} onClose={() => setSelectedEventId(null)} onRefresh={onRefresh} />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Poll Voters Modal  (creator + admin can see who voted)
───────────────────────────────────────────────────────────── */
function PollVotersModal({ poll, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 className="modal-title">Poll Votes</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {poll.options.map((opt, idx) => (
            <div key={idx} style={{ background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-primary)' }}>
                {opt.text}
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
                  {(opt.votes || []).length} vote{(opt.votes || []).length !== 1 ? 's' : ''}
                </span>
              </div>
              {(opt.votes || []).length === 0
                ? <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No votes yet</span>
                : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(opt.voterNames || opt.votes || []).map((name, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--purple-dim)', color: 'var(--purple-light)', fontWeight: 600 }}>
                        {name}
                      </span>
                    ))}
                  </div>
                )
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Post Creator Modal
───────────────────────────────────────────────────────────── */
function PostCreatorModal({ user, clubs, onClose, onRefresh }) {
  const [type, setType]               = useState('text');
  const [content, setContent]         = useState('');
  const [clubId, setClubId]           = useState('');
  const [achTitle, setAchTitle]       = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [picUrl, setPicUrl]           = useState('');
  const [loading, setLoading]         = useState(false);

  const myClubs = clubs.filter(c =>
    c.coordinator?._id === user._id ||
    c.members.some(m => m._id === user._id) ||
    user.role === 'admin'
  );

  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPicUrl(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { toast.error('Please write something first!'); return; }
    setLoading(true);
    try {
      const postData = { type, content, clubId: clubId || '' };
      if (type === 'achievement') {
        if (!achTitle.trim()) { toast.error('Highlight title is required!'); setLoading(false); return; }
        postData.achievementTitle = achTitle;
      } else if (type === 'poll') {
        if (!pollQuestion.trim()) { toast.error('Poll question is required!'); setLoading(false); return; }
        const opts = pollOptions.filter(o => o.trim());
        if (opts.length < 2) { toast.error('A poll needs at least 2 options!'); setLoading(false); return; }
        postData.pollQuestion = pollQuestion;
        postData.pollOptions  = opts;
      } else if (type === 'picture') {
        if (!picUrl.trim()) { toast.error('Please select an image first!'); setLoading(false); return; }
        postData.imageUrls = [picUrl];
      }
      await apiCreatePost(postData);
      toast.success('Post created successfully!');
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2 className="modal-title">Create Post</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, background: 'var(--bg-secondary)', padding: 6, borderRadius: 8 }}>
            {[['text', <Send size={14} />, 'Update'], ['achievement', <Trophy size={14} />, 'Highlight'], ['poll', <BarChart3 size={14} />, 'Poll'], ['picture', <Image size={14} />, 'Picture']].map(([t, icon, label]) => (
              <button key={t} type="button" className={`btn btn-xs ${type === t ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setType(t)} style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {icon} {label}
              </button>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Post to Club (Optional)</label>
            <select className="form-select" value={clubId} onChange={e => setClubId(e.target.value)}>
              <option value="">General Feed</option>
              {myClubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">What do you want to share? *</label>
            <textarea className="form-textarea" placeholder="Share your thoughts..." value={content} onChange={e => setContent(e.target.value)} required rows={4} />
          </div>
          {type === 'achievement' && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Award size={14} /> Highlight Details</h4>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Highlight Title *</label>
                <input className="form-input" placeholder="e.g. Workshop recap, project milestone, competition win" value={achTitle} onChange={e => setAchTitle(e.target.value)} />
              </div>
            </div>
          )}
          {type === 'poll' && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple-light)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={14} /> Create a Poll</h4>
              <div className="form-group">
                <label className="form-label">Poll Question *</label>
                <input className="form-input" placeholder="e.g. What is your preferred framework?" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Options *</span>
                  {pollOptions.length < 5 && <button type="button" className="btn btn-ghost btn-xs" onClick={() => setPollOptions([...pollOptions, ''])} style={{ fontSize: 10 }}>+ Add Option</button>}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input className="form-input" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => setPollOptions(pollOptions.map((o, i) => i === idx ? e.target.value : o))} required />
                      {pollOptions.length > 2 && <button type="button" className="btn btn-ghost btn-xs" style={{ color: 'var(--red)', padding: '10px' }} onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}><X size={12} /></button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {type === 'picture' && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple-light)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Image size={14} /> Add Image</h4>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Image *</label>
                {picUrl ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img src={picUrl} alt="Selected" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                    <div>
                      <label style={{ cursor: 'pointer' }} className="btn btn-ghost btn-xs">
                        Change
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePicUpload} />
                      </label>
                      <button type="button" className="btn btn-ghost btn-xs" style={{ color: 'var(--red)', marginLeft: 8 }} onClick={() => setPicUrl('')}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 10, padding: 24, cursor: 'pointer', gap: 8, color: 'var(--text-muted)' }}>
                    <Image size={24} style={{ opacity: .5 }} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Select from device</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePicUpload} />
                  </label>
                )}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Posting...' : 'Post'}</button>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Post Card
───────────────────────────────────────────────────────────── */
function PostCard({ post, user, clubs = [], onRefresh }) {
  const [showComments, setShowComments]   = useState(false);
  const [commentText, setCommentText]     = useState('');
  const [isEditing, setIsEditing]         = useState(false);
  const [editContent, setEditContent]     = useState('');
  const [editAchTitle, setEditAchTitle]   = useState('');
  const [showVoters, setShowVoters]       = useState(false);
  const { confirm, ConfirmDialog }        = useConfirm();

  const isLiked    = (post.likes || []).includes(user._id);
  const likeNames  = (post.likedBy || []).map(l => l.name).filter(Boolean);
  const isAuthor   = post.author._id === user._id;
  const isAdmin    = user.role === 'admin';
  const isCoord    = user.role === 'coordinator';
  const canDelete  = isAuthor || isAdmin || isCoord;
  const canSeeWhoVoted = isAuthor || isAdmin;

  const totalVotes   = post.poll ? post.poll.options.reduce((s, o) => s + (o.votes || []).length, 0) : 0;
  const userHasVoted = post.poll ? post.poll.options.some(o => (o.votes || []).includes(user._id)) : false;
  const initials     = post.author.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const clubObj      = post.clubId ? clubs.find(c => String(c._id) === String(post.clubId)) : null;
  const clubLogo     = clubObj?.logoUrl;
  const clubInitials = post.clubName ? post.clubName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '';

  // Resolve author avatar from logged-in user or clubs list fail-safe
  let authorAvatar = String(post.author._id) === String(user._id) ? user.avatar : null;
  if (!authorAvatar && clubs) {
    for (const c of clubs) {
      if (c.coordinator && String(c.coordinator._id) === String(post.author._id)) {
        authorAvatar = c.coordinator.avatar;
        if (authorAvatar) break;
      }
      if (c.advisor && String(c.advisor._id) === String(post.author._id)) {
        authorAvatar = c.advisor.avatar;
        if (authorAvatar) break;
      }
      const member = c.members?.find(m => String(m._id) === String(post.author._id));
      if (member?.avatar) {
        authorAvatar = member.avatar;
        break;
      }
    }
  }
  if (!authorAvatar) {
    authorAvatar = post.author.avatar;
  }

  const handleLike    = async () => { try { await apiLikePost(post._id); onRefresh(); } catch {} };
  const handleVote    = async (idx) => {
    try { await apiVotePoll(post._id, idx); onRefresh(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to vote'); }
  };

  const handleDelete = async () => {
    const ok = await confirm({ title: 'Delete Post?', message: 'This action cannot be undone.' });
    if (!ok) return;
    try { await apiDeletePost(post._id); toast.success('Post deleted.'); onRefresh(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to delete post'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try { await apiCommentPost(post._id, commentText); setCommentText(''); onRefresh(); } catch {}
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) { toast.error('Content cannot be empty'); return; }
    try {
      await apiUpdatePost(post._id, { content: editContent, achievementTitle: post.type === 'achievement' ? editAchTitle : null });
      toast.success('Post updated!');
      setIsEditing(false);
      onRefresh();
    } catch { toast.error('Failed to update post'); }
  };

  return (
    <>
      {ConfirmDialog}
      {showVoters && post.poll && <PollVotersModal poll={post.poll} onClose={() => setShowVoters(false)} />}

      <div className="post-card">
        {/* Header */}
        <div className="post-header">
          <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 13, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {post.clubId && clubLogo ? (
              <img src={clubLogo} alt={post.clubName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : post.clubId ? (
              clubInitials
            ) : authorAvatar ? (
              <img src={authorAvatar} alt={post.author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div className="post-author-info">
            <div className="post-author-name">
              {post.clubId ? (
                <>
                  <span style={{ fontWeight: 800, color: 'var(--purple-light)' }}>{post.clubName}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
                    by {post.author.name || 'Unknown User'}
                  </span>
                </>
              ) : (
                post.author.name || 'Unknown User'
              )}
              <span className={`badge badge-${post.author.role}`} style={{ fontSize: 9, padding: '1px 6px', marginLeft: 6 }}>{post.author.role}</span>
            </div>
            <div className="post-meta-details">{timeSince(post.createdAt)}</div>
          </div>
          {isAuthor && !isEditing && (
            <button className="btn btn-ghost btn-xs" style={{ color: 'var(--purple-light)', marginLeft: 'auto', marginRight: 4 }}
              onClick={() => { setIsEditing(true); setEditContent(post.content); setEditAchTitle(post.achievement?.title || ''); }}>
              <Pencil size={12} />
            </button>
          )}
          {canDelete && !isEditing && (
            <button className="btn btn-ghost btn-xs" style={{ color: 'var(--red)', marginLeft: isAuthor ? 0 : 'auto' }} onClick={handleDelete}>
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="post-body">
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea className="form-textarea" value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} style={{ width: '100%', resize: 'vertical' }} />
              {post.type === 'achievement' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Highlight Title</label>
                  <input className="form-input" value={editAchTitle} onChange={e => setEditAchTitle(e.target.value)} style={{ fontSize: 13 }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-xs" onClick={handleUpdate}>Save</button>
                <button className="btn btn-ghost btn-xs" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="post-body-text">{post.content}</div>
              {post.type === 'achievement' && post.achievement && (
                <div className="post-achievement-banner">
                  <div className="post-achievement-badge"><Trophy size={20} /></div>
                  <div><div className="post-achievement-title">{post.achievement.title}</div></div>
                </div>
              )}
              {post.type === 'poll' && post.poll && (
                <div className="post-poll-container">
                  <div className="post-poll-question">{post.poll.question}</div>
                  <div className="post-poll-options">
                    {post.poll.options.map((opt, idx) => {
                      const votes = (opt.votes || []).length;
                      const pct   = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                      const myVote = (opt.votes || []).includes(user._id);
                      return (
                        <div key={idx} className="post-poll-option"
                          onClick={() => !userHasVoted && handleVote(idx)}
                          style={{ cursor: userHasVoted ? 'default' : 'pointer' }}>
                          {userHasVoted && <div className="post-poll-option-fill" style={{ width: `${pct}%` }} />}
                          <span className="post-poll-option-text">{opt.text} {myVote && '✓'}</span>
                          {userHasVoted && <span className="post-poll-option-percentage">{pct}% ({votes})</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{totalVotes} vote{totalVotes !== 1 && 's'}</span>
                    {/* ✅ FIX 2: poll creator + admin can see who voted */}
                    {canSeeWhoVoted && (
                      <button className="btn btn-ghost btn-xs" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setShowVoters(true)}>
                        <Eye size={11} /> See who voted
                      </button>
                    )}
                  </div>
                </div>
              )}
              {post.type === 'picture' && post.pictureUrl && (
                <div className="post-picture-container"><img src={post.pictureUrl} alt="Post Attachment" /></div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="post-actions-row">
          <button className={`post-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} /> Like ({(post.likes || []).length})
          </button>
          <button className="post-action-btn" onClick={() => setShowComments(!showComments)}>
            <MessageCircle size={15} /> Comment ({(post.comments || []).length})
          </button>
        </div>
        {likeNames.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 16px 10px' }}>
            Liked by {likeNames.join(', ')}
          </div>
        )}

        {/* Comments */}
        {showComments && (
          <div className="post-comments-container">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
              {(post.comments || []).length === 0
                ? <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No comments yet.</p>
                : (post.comments || []).map(c => (
                  <div key={c._id} className="post-comment-item">
                    <div className="post-comment-bubble">
                      <div className="post-comment-author">
                        {/* ✅ FIX 1 (comments): always show commenter's name */}
                        <span style={{ fontWeight: 600 }}>{c.user?.name || 'Unknown'}</span>
                        <span className="post-comment-date">{timeSince(c.createdAt)}</span>
                      </div>
                      <div className="post-comment-text">{c.text}</div>
                    </div>
                  </div>
                ))
              }
            </div>
            <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
              <input className="comment-input" placeholder="Add to the conversation..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ fontSize: 12.5 }} />
              <button className="btn btn-primary btn-sm" type="submit" style={{ padding: '8px 12px' }}><Send size={12} /></button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main FeedPage
───────────────────────────────────────────────────────────── */
export default function FeedPage() {
  const { user }          = useAuth();
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [postsResult, eventsResult, clubsResult] = await Promise.allSettled([
        fetchFeedPosts(),
        fetchApprovedEvents(),
        fetchClubs(),
      ]);

      if (postsResult.status === 'fulfilled') setPosts(postsResult.value);
      else console.error('Failed to load feed posts', postsResult.reason);

      if (eventsResult.status === 'fulfilled') setEvents(eventsResult.value);
      else console.error('Failed to load feed events', eventsResult.reason);

      if (clubsResult.status === 'fulfilled') setClubs(clubsResult.value);
      else console.error('Failed to load feed clubs', clubsResult.reason);
    } catch (err) {
      console.error('Failed to load feed', err);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = posts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter(p => {
      const ms = !search || p.content.toLowerCase().includes(search.toLowerCase()) || p.author.name.toLowerCase().includes(search.toLowerCase());
      const mt = filterType === 'All' || p.type === filterType.toLowerCase();
      return ms && mt;
    });

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading feed...</div>;

  return (
    <div style={{ maxWidth: 660, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Campus Feed</h1>
        <p className="page-subtitle">Upcoming events, updates, polls, and moments from campus</p>
      </div>

      <AvailableEventsStrip events={events} currentUser={user} onRefresh={load} />

      {(user.role === 'student' || user.role === 'coordinator' || user.role === 'admin') && (
        <div className="post-creator-card">
          <div className="post-creator-top">
            <div className="user-avatar" style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <button className="post-creator-input-trigger" onClick={() => setShowCreator(true)}>Share an update, poll, or picture...</button>
          </div>
          <div className="post-creator-actions">
            <button className="post-creator-action-btn" onClick={() => setShowCreator(true)}><Send size={15} style={{ color: 'var(--accent-light)' }} /><span>Update</span></button>
            <button className="post-creator-action-btn" onClick={() => setShowCreator(true)}><BarChart3 size={15} style={{ color: 'var(--purple-light)' }} /><span>Poll</span></button>
            <button className="post-creator-action-btn" onClick={() => setShowCreator(true)}><Image size={15} style={{ color: 'var(--green)' }} /><span>Picture</span></button>
          </div>
        </div>
      )}

      <div className="filters-row" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="search-input" placeholder="Search posts or authors..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-select" style={{ width: 150 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Types</option>
          <option value="Achievement">Highlights</option>
          <option value="Poll">Polls</option>
          <option value="Picture">Pictures</option>
        </select>
      </div>

      {filtered.length === 0
        ? <div className="empty-state"><Filter size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} /><h3>No posts found</h3><p>Be the first to share something!</p></div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{filtered.map(post => <PostCard key={post._id} post={post} user={user} clubs={clubs} onRefresh={load} />)}</div>
      }

      {showCreator && <PostCreatorModal user={user} clubs={clubs} onClose={() => setShowCreator(false)} onRefresh={load} />}
    </div>
  );
}
