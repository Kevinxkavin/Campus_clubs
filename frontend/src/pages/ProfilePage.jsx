import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, fetchClubs, fetchMyRegistrations } from '../api';
import { Camera, Save, CalendarDays, BookOpen, Mail, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]     = useState({ name: user.name||'', bio: user.bio||'', studentId: user.studentId||'' });
  const [avatar, setAvatar] = useState(user.avatar||'');
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs]   = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchClubs().then(all => setClubs(all.filter(c => c.members.some(m => m._id === user._id)))).catch(()=>{});
    fetchMyRegistrations().then(setEvents).catch(()=>{});
  }, [user._id]);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { toast.error('Photo must be under 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile({ ...form, avatarUrl: avatar });
      setUser(prev => ({ ...prev, name: updated.name ?? form.name, bio: updated.bio ?? form.bio, studentId: updated.studentId ?? form.studentId, avatar: updated.avatarUrl ?? avatar }));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = { student:'Student', coordinator:'Club Coordinator', advisor:'Faculty Advisor', admin:'Administrator' };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your profile, bio, and personal details</p>
      </div>

      {/* ── Hero Card (LinkedIn-style) ─────────────────────────────── */}
      <div className="profile-hero">
        <div className="profile-hero-banner" />
        <div className="profile-hero-body">
          <div className="profile-avatar-wrap">
            {avatar
              ? <img src={avatar} alt="Avatar" className="profile-avatar-img" />
              : <div className="profile-avatar-placeholder">{user.name?.charAt(0).toUpperCase()}</div>
            }
            <label className="profile-avatar-edit" title="Change photo">
              <Camera size={12} color="#fff" />
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarUpload} />
            </label>
          </div>
          <div className="profile-name">{user.name}</div>
          <div className="profile-role-tag">{roleLabel[user.role]}</div>
          <div className="profile-email">{user.email}</div>
          {user.bio && (
            <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 540 }}>
              {user.bio}
            </p>
          )}
          {avatar && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => setAvatar('')}
            >
              Remove Photo
            </button>
          )}
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Left — Edit Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Edit Information</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input className="form-input" value={form.studentId} onChange={e=>setForm(f=>({...f,studentId:e.target.value}))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Bio</label>
                  <textarea
                    className="form-textarea" rows={3}
                    placeholder="Tell us about yourself, your interests and skills..."
                    value={form.bio}
                    onChange={e=>setForm(f=>({...f,bio:e.target.value}))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div style={{ position:'relative' }}>
                    <Mail size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                    <input className="form-input" disabled value={user.email} style={{ opacity:.6, paddingLeft:34 }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <div style={{ position:'relative' }}>
                    <CreditCard size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                    <input className="form-input" disabled value={roleLabel[user.role]} style={{ opacity:.6, paddingLeft:34 }} />
                  </div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 4 }}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right — Activity Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* My Clubs */}
          <div className="card">
            <div className="card-header" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <BookOpen size={15} style={{ color:'var(--purple-light)' }} />
              <h3 className="card-title">My Clubs</h3>
              <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:'var(--text-muted)', background:'var(--bg-hover)', padding:'2px 8px', borderRadius:20 }}>
                {clubs.length}
              </span>
            </div>
            <div className="card-body" style={{ padding:'12px 20px' }}>
              {clubs.length === 0 ? (
                <div style={{ textAlign:'center', padding:'16px 0', color:'var(--text-muted)', fontSize:13 }}>
                  Not a member of any club yet.
                  <br />
                  <button className="btn btn-ghost btn-sm" style={{ marginTop:8 }} onClick={()=>navigate('/clubs')}>
                    Browse Clubs
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {clubs.map(c => (
                    <div key={c._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ width:34, height:34, borderRadius:8, background:'var(--purple)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>
                        {c.name.charAt(0)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{c.category} · {c.members.length} members</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Registered Events */}
          <div className="card">
            <div className="card-header" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <CalendarDays size={15} style={{ color:'var(--purple-light)' }} />
              <h3 className="card-title">Registered Events</h3>
              <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:'var(--text-muted)', background:'var(--bg-hover)', padding:'2px 8px', borderRadius:20 }}>
                {events.length}
              </span>
            </div>
            <div className="card-body" style={{ padding:'12px 20px' }}>
              {events.length === 0 ? (
                <div style={{ textAlign:'center', padding:'16px 0', color:'var(--text-muted)', fontSize:13 }}>
                  No event registrations yet.
                  <br />
                  <button className="btn btn-ghost btn-sm" style={{ marginTop:8 }} onClick={()=>navigate('/')}>
                    Browse Events
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {events.map(e => (
                    <div key={e._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                      {e.poster ? (
                        <img src={e.poster} alt="poster" style={{ width:34, height:34, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
                      ) : (
                        <div style={{ width:34, height:34, borderRadius:8, background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <CalendarDays size={14} style={{ color:'var(--purple-light)' }} />
                        </div>
                      )}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.title}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{e.club?.name} · {e.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
