import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchClubs, apiCreateEvent, fetchEvent, apiUpdateEvent } from '../api';
import { PlusCircle, Trash2, Upload, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Hackathon','Workshop','Exhibition','Competition','Seminar','Cultural','Sports','Other'];
const FIELD_TYPES = ['text','textarea','select'];

export default function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    clubId:'', title:'', description:'', category:'Workshop',
    eventDate:'', venue:'', maxParticipants:50, registrationDeadline:'', poster:'',
    registrationUrl:'', eventChairId:''
  });
  const [fields, setFields] = useState([]);
  const [posterPreview, setPosterPreview] = useState('');

  useEffect(() => {
    fetchClubs().then(all => {
      const mine = all.filter(c => c.isActive && (
        c.members.some(m => m._id === user._id) ||
        c.coordinator?._id === user._id ||
        user.role === 'admin'
      ));
      setClubs(mine);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!id) return;
    fetchEvent(id).then(e => {
      const formatDateForInput = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };

      setForm({
        clubId: e.club?.clubId || e.club?._id || '',
        title: e.title || '',
        description: e.description || '',
        category: e.category || 'Workshop',
        eventDate: formatDateForInput(e.eventDate),
        venue: e.venue || '',
        maxParticipants: e.maxParticipants || 50,
        registrationDeadline: formatDateForInput(e.registrationDeadline),
        poster: e.poster || '',
        registrationUrl: e.registrationUrl || '',
        eventChairId: e.eventChairId || ''
      });
      setFields((e.registrationFields || []).map(f => ({
        label: f.label || '',
        type: f.type || 'text',
        required: !!f.required,
        options: (f.options || []).join(', '),
      })));
      setPosterPreview(e.poster || '');
    }).catch(() => toast.error("Failed to load event details"));
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePosterUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3*1024*1024) { toast.error('Poster must be under 3 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { set('poster', ev.target.result); setPosterPreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const addField    = () => setFields(f => [...f, { label:'', type:'text', required:false, options:'' }]);
  const updateField = (i, k, v) => setFields(f => f.map((fi, idx) => idx===i ? {...fi,[k]:v} : fi));
  const removeField = (i) => setFields(f => f.filter((_, idx) => idx!==i));

  const selectedClub  = clubs.find(c => c._id === form.clubId);
  const clubMembers   = selectedClub ? selectedClub.members : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clubId)     { toast.error('Select a club'); return; }
    if (!form.eventDate)  { toast.error('Event date is required'); return; }
    setLoading(true);
    const { poster, ...restForm } = form;
    try {
      const registrationFields = fields
        .map(f => ({
          label: f.label.trim(),
          type: f.type || 'text',
          required: !!f.required,
          options: f.type === 'select'
            ? f.options.split(',').map(o => o.trim()).filter(Boolean)
            : [],
        }))
        .filter(f => f.label);

      const payload = {
        ...restForm,
        posterUrl: poster,
        eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : null,
        registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : null,
        maxParticipants: Number(form.maxParticipants),
        registrationFields,
        eventChairId: form.eventChairId ? Number(form.eventChairId) : null,
      };

      if (id) {
        await apiUpdateEvent(id, payload);
        toast.success('Event updated successfully!');
      } else {
        await apiCreateEvent(payload);
        const isCoordinatorOrAdmin = user.role === 'admin' || user.role === 'coordinator' || selectedClub?.coordinator?._id === user._id;
        toast.success(isCoordinatorOrAdmin ? 'Event created successfully!' : 'Event submitted for approval!');
      }
      navigate('/my-events');
    } catch (err) {
      toast.error(err.response?.data?.message ?? (id ? 'Failed to update event' : 'Failed to submit event'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth:760, margin:'0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">{id ? 'Edit Event' : 'Create Event'}</h1>
        <p className="page-subtitle">
          {id
            ? 'Update the details for your event.'
            : (user.role === 'admin' || user.role === 'coordinator' || selectedClub?.coordinator?._id === user._id
              ? 'Publish a new event directly for your club.'
              : 'Submit a new event for your club — it will go for coordinator approval.')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-header"><h3 className="card-title">Event Details</h3></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Club *</label>
                <select className="form-select" required value={form.clubId} onChange={e=>set('clubId',e.target.value)} disabled={!!id}>
                  <option value="">Select your club...</option>
                  {clubs.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                {clubs.length===0 && <p style={{ fontSize:12,color:'#f87171',marginTop:4 }}>You must be a member of a club to create events.</p>}
              </div>

              {form.clubId && (
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Event Chair / Student Coordinator</label>
                  <select className="form-select" value={form.eventChairId} onChange={e=>set('eventChairId',e.target.value)}>
                    <option value="">Select Event Chair (optional)...</option>
                    {clubMembers.map(m=><option key={m._id} value={m._id}>{m.name} ({m.studentId})</option>)}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Event Title *</label>
                <input className="form-input" required value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Annual Hackathon 2025"/>
              </div>

              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" required value={form.description} onChange={e=>set('description',e.target.value)} rows={4} placeholder="Describe the event..."/>
              </div>

              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Registration URL</label>
                <input className="form-input" value={form.registrationUrl} onChange={e=>set('registrationUrl',e.target.value)} placeholder="e.g. https://forms.gle/..."/>
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category} onChange={e=>set('category',e.target.value)}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Venue *</label>
                <input className="form-input" required value={form.venue} onChange={e=>set('venue',e.target.value)} placeholder="e.g. Main Auditorium"/>
              </div>

              <div className="form-group">
                <label className="form-label">Event Date & Time *</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  required
                  min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  value={form.eventDate}
                  onChange={e => {
                    const chosen = new Date(e.target.value);
                    if (chosen < new Date()) {
                      toast.error("Warning: You selected a past date!");
                    }
                    set('eventDate', e.target.value);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration Deadline</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  value={form.registrationDeadline}
                  onChange={e => {
                    const chosen = new Date(e.target.value);
                    if (chosen < new Date()) {
                      toast.error("Warning: Registration deadline cannot be in the past!");
                    }
                    set('registrationDeadline', e.target.value);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Participants</label>
                <input className="form-input" type="number" min={1} value={form.maxParticipants} onChange={e=>set('maxParticipants',e.target.value)}/>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-header"><h3 className="card-title">Event Poster</h3></div>
          <div className="card-body">
            {posterPreview ? (
              <div style={{ display:'flex',gap:20,alignItems:'flex-start' }}>
                <img src={posterPreview} alt="Poster preview" style={{ width:160,height:160,objectFit:'cover',borderRadius:10,border:'2px solid var(--purple)'}}/>
                <div>
                  <p style={{ fontSize:13,color:'var(--text-secondary)',marginBottom:12 }}>Poster uploaded.</p>
                  <label style={{ cursor:'pointer' }} className="btn btn-ghost btn-sm">
                    <Upload size={14}/> Change
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={handlePosterUpload}/>
                  </label>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft:8 }} onClick={()=>{set('poster','');setPosterPreview('');}}>Remove</button>
                </div>
              </div>
            ) : (
              <label style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:'2px dashed var(--border)',borderRadius:12,padding:40,cursor:'pointer',gap:12,color:'var(--text-muted)' }}>
                <Image size={36} style={{ opacity:.4 }}/>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:600,marginBottom:4 }}>Upload Event Poster</div>
                  <div style={{ fontSize:12 }}>PNG, JPG up to 3 MB</div>
                </div>
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={handlePosterUpload}/>
              </label>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-header" style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12 }}>
            <h3 className="card-title">Registration Form</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addField}>Add Field</button>
          </div>
          <div className="card-body">
            {fields.length === 0 ? (
              <p style={{ fontSize:13,color:'var(--text-muted)' }}>No extra details required from participants.</p>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                {fields.map((field, i) => (
                  <div key={i} style={{ display:'grid',gridTemplateColumns:'1.5fr 130px 110px auto',gap:10,alignItems:'end' }}>
                    <div className="form-group" style={{ margin:0 }}>
                      <label className="form-label">Question Label</label>
                      <input className="form-input" value={field.label} onChange={e=>updateField(i,'label',e.target.value)} placeholder="e.g. Team name" />
                    </div>
                    <div className="form-group" style={{ margin:0 }}>
                      <label className="form-label">Type</label>
                      <select className="form-select" value={field.type} onChange={e=>updateField(i,'type',e.target.value)}>
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <label style={{ display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-secondary)',paddingBottom:11 }}>
                      <input type="checkbox" checked={field.required} onChange={e=>updateField(i,'required',e.target.checked)} />
                      Required
                    </label>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }} onClick={()=>removeField(i)}><Trash2 size={14}/></button>
                    {field.type === 'select' && (
                      <div className="form-group" style={{ gridColumn:'1/-1',margin:0 }}>
                        <label className="form-label">Options</label>
                        <input className="form-input" value={field.options} onChange={e=>updateField(i,'options',e.target.value)} placeholder="Comma-separated options, e.g. Beginner, Intermediate, Advanced" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display:'flex',gap:12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <PlusCircle size={16}/> {loading ? (id ? 'Saving...' : 'Submitting...') : (id ? 'Save Changes' : 'Submit Event')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={()=>navigate('/my-events')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
