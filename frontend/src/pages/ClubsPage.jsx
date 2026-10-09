import { confirmAction } from '../util/confirmToast';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchClubs, apiJoinClub, apiLeaveClub } from '../api';
import { Search, Users, BookOpen, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ClubDetailsModal from '../components/ClubDetailsModal';

const CATS = ['All','Technical','Cultural','Sports','Literary','Entrepreneurship','Social Service','Other'];
const CAT_COLORS = { Technical:'#7c3aed',Cultural:'#f59e0b',Sports:'#10b981',Literary:'#3b82f6',Entrepreneurship:'#ef4444','Social Service':'#ec4899',Other:'#6b7280' };
const initials = n => n?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

function JoinValidationModal({ club, user, onClose, onJoined }) {
  const [form, setForm] = useState({ bio: user.bio||'', skills: user.skills||'', whyJoin: '', studentId: user.studentId||'', phone: user.phone||'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Removed client-side required field validation; backend now handles optional fields.
    setLoading(true);
    try {
      await apiJoinClub(club._id, { studentId: form.studentId, bio: form.bio, skills: form.skills, whyJoin: form.whyJoin, phone: form.phone });
      toast.success('Join request sent! Awaiting coordinator approval.');
      onJoined();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to send join request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:1200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:28,maxWidth:500,width:'100%',maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
          <h2 style={{ fontSize:18,fontWeight:800,margin:0 }}>Join Club — {club.name}</h2>
          <button type="button" className="btn btn-ghost btn-xs" style={{ padding:'6px' }} onClick={onClose}><X size={14}/></button>
        </div>
        <p style={{ fontSize:12.5,color:'var(--text-secondary)',marginBottom:16,lineHeight:1.5 }}>
          Fill in your details before joining. The coordinator will review your request.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Student ID *</label>
            <input className="form-input" value={form.studentId} placeholder="e.g. 2024CS001" onChange={e=>setForm({...form,studentId:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Bio (About Yourself) *</label>
            <textarea className="form-textarea" value={form.bio} placeholder="Tell us about yourself..." rows={3} onChange={e=>setForm({...form,bio:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Skills / Interests *</label>
            <input className="form-input" value={form.skills} placeholder="e.g. JavaScript, Public Speaking" onChange={e=>setForm({...form,skills:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Reason to Join *</label>
            <textarea className="form-textarea" value={form.whyJoin} placeholder="Why do you want to join this club?" rows={3} onChange={e=>setForm({...form,whyJoin:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Contact Number (Phone) *</label>
            <input className="form-input" value={form.phone} placeholder="e.g. +91 9876543210" onChange={e=>setForm({...form,phone:e.target.value})}/>
          </div>
          <div style={{ display:'flex',gap:10,marginTop:18 }}>
            <button type="submit" className="btn btn-primary" style={{ flex:1 }} disabled={loading}>{loading ? 'Sending...' : 'Send Join Request'}</button>
            <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClubsPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [joiningClub, setJoiningClub] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const data = await fetchClubs(); setClubs(data); }
    catch { toast.error('Failed to load clubs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = clubs.filter(c => c.isActive);
  const filtered = active.filter(c => {
    const mc = cat==='All' || c.category===cat;
    const ms = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const isMember  = c => c.members.some(m=>m._id===user._id);
  const isPending = c => c.pendingMembers.some(m=>m._id===user._id);

  const handleLeave = async (e, club) => {
    e.stopPropagation();
    if (!await confirmAction(`Leave ${club.name}?`)) return;
    try { await apiLeaveClub(club._id); toast.success('Left the club.'); load(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed to leave club'); }
  };

  if (loading) return <div style={{ textAlign:'center',padding:60,color:'var(--text-muted)' }}>Loading clubs...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Discover Clubs</h1>
        <p className="page-subtitle">{active.length} active clubs on campus</p>
      </div>

      <div className="filters-row">
        <div style={{ position:'relative',flex:1 }}>
          <Search size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)' }}/>
          <input className="search-input" placeholder="Search clubs..." value={search}
            onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:36 }}/>
        </div>
        <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
          {CATS.map(c=>(
            <button key={c} className={`btn btn-sm${cat===c?' btn-primary':' btn-ghost'}`}
              onClick={()=>setCat(c)} style={{ fontSize:12 }}>{c}</button>
          ))}
        </div>
      </div>

      {filtered.length===0 ? (
        <div className="empty-state"><BookOpen size={48} style={{ margin:'0 auto 16px',opacity:.3 }}/><h3>No clubs found</h3></div>
      ) : (
        <div className="clubs-grid">
          {filtered.map(club => (
            <div key={club._id} className="club-card" onClick={() => setSelectedClubId(club._id)}>
              <div className="club-card-top" style={{ background: club.bannerUrl ? undefined : `linear-gradient(135deg,${CAT_COLORS[club.category]||'#7c3aed'}88,${CAT_COLORS[club.category]||'#7c3aed'}44)` }}>
                {club.bannerUrl && <img src={club.bannerUrl} alt="" className="club-card-banner" />}
                <div className="club-card-avatar">
                  {club.logoUrl ? <img src={club.logoUrl} alt={club.name} /> : initials(club.name)}
                </div>
              </div>
              <div className="club-card-body">
                <div className="club-card-name">{club.name}</div>
                <span className="badge" style={{ background:`${CAT_COLORS[club.category]||'#7c3aed'}22`,color:CAT_COLORS[club.category]||'#7c3aed',border:`1px solid ${CAT_COLORS[club.category]||'#7c3aed'}44`,marginBottom:8,display:'inline-flex' }}>{club.category}</span>
                <p className="club-card-desc">{club.description}</p>
                <div className="club-card-footer">
                  <span className="club-members"><Users size={13} style={{ display:'inline',verticalAlign:'middle',marginRight:4 }}/>{club.members.length} members</span>
                  {user?.role==='student' && (
                    isMember(club)  ? <button className="btn btn-ghost btn-sm" onClick={e=>handleLeave(e,club)}>Leave</button>
                    : isPending(club) ? <span className="badge badge-pending">Pending</span>
                    : <button className="btn btn-primary btn-sm" onClick={e=>{e.stopPropagation();setJoiningClub(club);}}>Join</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedClubId && (
        <ClubDetailsModal clubId={selectedClubId} currentUser={user} onClose={() => setSelectedClubId(null)} onRefresh={load} />
      )}
      {joiningClub && (
        <JoinValidationModal club={joiningClub} user={user} onClose={() => setJoiningClub(null)} onJoined={load} />
      )}
    </div>
  );
}
