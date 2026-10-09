import { useState } from 'react';
import { apiRegisterForEvent } from '../api';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegistrationModal({ event, user, onClose, onDone }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRegisterForEvent(event._id, answers);
      toast.success('Registered successfully!');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:1200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:28,maxWidth:500,width:'100%',maxHeight:'80vh',overflowY:'auto' }}
      >
        <h2 style={{ fontSize:19,fontWeight:800,marginBottom:4 }}>Register — {event.title}</h2>
        <p style={{ fontSize:13,color:'var(--text-muted)',marginBottom:20 }}>{event.club?.name}</p>
        <form onSubmit={handleSubmit}>
          {(event.registrationFields||[]).length === 0 && (
            <p style={{ fontSize:13,color:'var(--text-secondary)',marginBottom:16 }}>No extra details required. Just confirm your spot!</p>
          )}
          {(event.registrationFields||[]).map((field, i) => (
            <div key={i} className="form-group">
              <label className="form-label">{field.label}{field.required && ' *'}</label>
              {field.type === 'textarea' ? (
                <textarea className="form-textarea" required={field.required}
                  value={answers[field.label]||''} onChange={e=>setAnswers({...answers,[field.label]:e.target.value})}/>
              ) : field.type === 'select' ? (
                <select className="form-select" required={field.required}
                  value={answers[field.label]||''} onChange={e=>setAnswers({...answers,[field.label]:e.target.value})}>
                  <option value="">Select...</option>
                  {(field.options||[]).map(o=><option key={o}>{o}</option>)}
                </select>
              ) : (
                <input className="form-input" required={field.required}
                  value={answers[field.label]||''} onChange={e=>setAnswers({...answers,[field.label]:e.target.value})}/>
              )}
            </div>
          ))}
          <div style={{ display:'flex',gap:10,marginTop:8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <CheckCircle2 size={15}/> {loading ? 'Registering...' : 'Confirm Registration'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
