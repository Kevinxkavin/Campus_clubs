import { confirmAction } from '../util/confirmToast';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchClub, apiJoinClub, apiLeaveClub } from '../api';
import { ArrowLeft, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function ClubDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const data = await fetchClub(id); setClub(data); }
    catch { toast.error('Club not found'); navigate('/clubs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div style={{ textAlign:'center',padding:60,color:'var(--text-muted)' }}>Loading...</div>;
  if (!club) return <div className="empty-state"><h3>Club not found</h3></div>;

  const isMember  = club.members.some(m=>m._id===user._id);
  const isPending = club.pendingMembers.some(m=>m._id===user._id);
  const initials  = n=>n?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  const handleJoin = async () => {
    try { await apiJoinClub(id, {}); toast.success('Join request sent!'); load(); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };
  const handleLeave = async () => {
    if (!await confirmAction('Leave this club?')) return;
    try { await apiLeaveClub(id); toast.success('Left the club.'); navigate('/clubs'); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/clubs')} style={{ marginBottom:20 }}>
        <ArrowLeft size={16}/> Back to Clubs
      </button>

      <div className="card" style={{ marginBottom:24 }}>
        <div style={{ height:100,borderRadius:'12px 12px 0 0',background:'linear-gradient(135deg,var(--purple),#4f46e5)',position:'relative' }}>
          <div style={{ position:'absolute',bottom:-28,left:28,width:56,height:56,borderRadius:12,background:'var(--bg-card)',border:'3px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne',fontSize:18,fontWeight:700 }}>{initials(club.name)}</div>
        </div>
        <div className="card-body" style={{ paddingTop:40 }}>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
            <div>
              <h1 style={{ fontSize:24,fontWeight:800,marginBottom:6 }}>{club.name}</h1>
              <span className="badge badge-approved">{club.category}</span>
              <p style={{ marginTop:12,color:'var(--text-secondary)',lineHeight:1.7,maxWidth:600 }}>{club.description}</p>
            </div>
            {user?.role==='student' && (
              isMember  ? <button className="btn btn-ghost" onClick={handleLeave}>Leave Club</button>
              : isPending ? <button className="btn btn-ghost" disabled>Pending</button>
              : <button className="btn btn-primary" onClick={handleJoin}>Join Club</button>
            )}
          </div>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,marginTop:20 }}>
            {[
              club.coordinator && { label:'Coordinator', person: club.coordinator },
              club.advisor     && { label:'Faculty Advisor', person: club.advisor },
            ].filter(Boolean).map(({ label, person }) => (
              <div key={label} style={{ padding:14,background:'var(--bg-secondary)',borderRadius:10,border:'1px solid var(--border)' }}>
                <div style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',marginBottom:8 }}>{label}</div>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <div className="user-avatar" style={{ width:30,height:30,fontSize:11,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    {person.avatar ? (
                      <img src={person.avatar} alt={person.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                    ) : (
                      person.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600 }}>{person.name}</div>
                    <div style={{ fontSize:11,color:'var(--text-muted)' }}>{person.email}</div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding:14,background:'var(--bg-secondary)',borderRadius:10,border:'1px solid var(--border)' }}>
              <div style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',marginBottom:4 }}>Members</div>
              <div style={{ fontFamily:'Syne',fontSize:26,fontWeight:800 }}>{club.members.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize:17,fontWeight:700 }}><Users size={16} style={{ display:'inline',marginRight:8 }}/>Members ({club.members.length})</h2>
        </div>
        <div className="card-body">
          {club.members.length===0 ? <p style={{ color:'var(--text-muted)',fontSize:14 }}>No members yet.</p>
          : <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:10 }}>
              {club.members.map(m=>(
                <div key={m._id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--bg-secondary)',borderRadius:10,border:'1px solid var(--border)' }}>
                  <div className="user-avatar" style={{ width:30,height:30,fontSize:11,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                    ) : (
                      m.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600 }}>{m.name}</div>
                    {m.studentId && <div style={{ fontSize:11,color:'var(--text-muted)' }}>{m.studentId}</div>}
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}
