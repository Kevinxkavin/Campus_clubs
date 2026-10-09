import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authForgotPassword, authLogin, authResetPassword } from '../api';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [resetForm, setResetForm] = useState({ email: '', otp: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authLogin(form.email, form.password);
      // data = { accessToken, refreshToken, user }
      login(data.user, data.accessToken);
      toast.success(`Welcome back, ${data.user?.name ?? ''}!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Invalid email or password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordOk = (value) =>
    value.length >= 6 && (value.match(/[A-Za-z]/g) || []).length >= 2 && (value.match(/\d/g) || []).length >= 2;

  const handleSendResetOtp = async () => {
    const email = resetForm.email || form.email;
    if (!email) { toast.error('Enter your email first'); return; }
    setLoading(true);
    try {
      await authForgotPassword(email);
      setResetForm(f => ({ ...f, email }));
      toast.success('Password reset OTP sent');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(resetForm.otp)) { toast.error('Enter the 6 digit OTP'); return; }
    if (resetForm.password !== resetForm.confirm) { toast.error('Passwords do not match'); return; }
    if (!passwordOk(resetForm.password)) { toast.error('Password must contain at least 2 alphabets and 2 numbers'); return; }
    setLoading(true);
    try {
      await authResetPassword(resetForm.email, resetForm.otp, resetForm.password);
      toast.success('Password reset successful. Please sign in.');
      setShowReset(false);
      setForm(f => ({ ...f, email: resetForm.email, password: '' }));
      setResetForm({ email: '', otp: '', password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-form-container">
        <div className="auth-logo">CampusClubs</div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-sub">Sign in to your portal.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="e.g. name@university.edu"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Password <button type="button" onClick={() => { setResetForm(f => ({ ...f, email: form.email })); setShowReset(true); }} style={{ color: 'var(--purple-light)', fontSize: 12, cursor: 'pointer', background:'none', border:0, padding:0 }}>Forgot password?</button>
            </label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ paddingRight: 44 }} required />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-link" style={{ marginTop: 16 }}>
          Not a member yet? <Link to="/register">Create a student account</Link>
        </p>

        <div style={{ display: 'flex', gap: 16, marginTop: 32, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }}>Help Center</span>
          <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer' }}>Terms of Service</span>
        </div>
        </div>{/* end auth-form-container */}
      </div>

      <div className="auth-right">
        <div style={{ position: 'relative', zIndex: 1 }}>
        </div>
      </div>
      {showReset && (
        <div className="modal-overlay" onClick={() => setShowReset(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Reset Password</h2>
              <button className="modal-close" onClick={() => setShowReset(false)}>×</button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={resetForm.email} onChange={e=>setResetForm({...resetForm,email:e.target.value})} required />
              </div>
              <button type="button" className="btn btn-ghost" onClick={handleSendResetOtp} disabled={loading} style={{ width:'100%',marginBottom:14 }}>Send OTP</button>
              <div className="form-group">
                <label className="form-label">OTP</label>
                <input className="form-input" inputMode="numeric" maxLength={6} value={resetForm.otp} onChange={e=>setResetForm({...resetForm,otp:e.target.value.replace(/\D/g,'').slice(0,6)})} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={resetForm.password} onChange={e=>setResetForm({...resetForm,password:e.target.value})} required />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Minimum 6 characters with at least 2 alphabets and 2 numbers.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" value={resetForm.confirm} onChange={e=>setResetForm({...resetForm,confirm:e.target.value})} required />
              </div>
              <button className="btn btn-primary" disabled={loading} style={{ width:'100%' }}>{loading ? 'Saving...' : 'Reset Password'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
