import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authRegister, authSendVerification, authVerifyEmail } from '../api';
import toast from 'react-hot-toast';
import { Mail, CheckCircle, Loader2, ArrowRight } from 'lucide-react';

// Registration has 3 steps:
//   1. Fill form  →  2. Verify email (link sent)  →  3. Auto-login after verify

export default function RegisterPage() {
  const [step, setStep]   = useState('form');   // 'form' | 'verify' | 'done'
  const [form, setForm]   = useState({ name: '', email: '', studentId: '', password: '', confirm: '' });
  const [otp, setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }         = useAuth();
  const navigate          = useNavigate();

  // ── Step 1: Register → backend creates unverified account + sends email ──
  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6)       { toast.error('Password must be at least 6 characters'); return; }
    if ((form.password.match(/[A-Za-z]/g) || []).length < 2 || (form.password.match(/\d/g) || []).length < 2) {
      toast.error('Password must contain at least 2 alphabets and 2 numbers');
      return;
    }
    setLoading(true);
    try {
      // Register; backend sends a verification email automatically
      await authRegister({
        name:      form.name,
        email:     form.email,
        password:  form.password,
        studentId: form.studentId,
      });
      setStep('verify');
      toast.success('Account created! Check your email for the verification link.', { duration: 5000 });
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend verification link ───────────────────────────────────────────
  const handleResend = async () => {
    setLoading(true);
    try {
      await authSendVerification(form.email);
      toast.success('Verification link resent!');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not resend link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { toast.error('Enter the 6 digit OTP'); return; }
    setLoading(true);
    try {
      const data = await authVerifyEmail(form.email, otp);
      if (data?.accessToken) login(data.user, data.accessToken);
      toast.success('Email verified!');
      setStep('done');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 screen: Waiting for email click ─────────────────────────────
  if (step === 'verify') {
    return (
      <div className="auth-page">
        <div className="auth-left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="auth-form-container">
          <div className="auth-logo">CampusClubs</div>

          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,107,0,0.12)', border: '2px solid rgba(255,107,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Mail size={32} style={{ color: 'var(--purple-light)' }} />
            </div>

            <h1 className="auth-title" style={{ marginBottom: 8 }}>Verify Your Email</h1>
            <p className="auth-sub" style={{ marginBottom: 28 }}>
              We sent a 6 digit OTP to<br />
              <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong>
            </p>

            <div style={{ background: 'rgba(255,107,0,0.07)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 12, padding: '18px 20px', marginBottom: 28, textAlign: 'left' }}>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Open the email from CampusClubs',
                  'Enter the 6 digit OTP below',
                  'You\'ll be logged in automatically',
                ].map((step, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="form-input" inputMode="numeric" maxLength={6} placeholder="6 digit OTP"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
              <button className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 11, fontSize: 13 }}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button className="btn btn-ghost" onClick={handleResend} disabled={loading}
                type="button"
                style={{ width: '100%', padding: 11, fontSize: 13 }}>
                {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Resend verification OTP'}
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Already verified? <Link to="/login" style={{ color: 'var(--purple-light)', fontWeight: 600 }}>Sign in</Link>
              </p>
            </form>
          </div>
          </div>{/* end auth-form-container */}
        </div>

        <div className="auth-right">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="auth-tagline">Almost there! <span>Check your inbox.</span></h2>
            <p className="auth-desc">Email verification keeps your account secure and confirms you're a real campus member.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Form ──────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-form-container">
        <div className="auth-logo">CampusClubs</div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub">Join the campus community today.</p>

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Your name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Student ID</label>
              <input className="form-input" placeholder="e.g. 2024CS001" value={form.studentId}
                onChange={e => setForm({ ...form, studentId: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="name@university.edu" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Minimum 6 characters with at least 2 alphabets and 2 numbers.</p>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: 12, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={loading}>
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</>
              : <><ArrowRight size={16} /> Create Account</>
            }
          </button>
        </form>

        <p className="auth-link" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        </div>{/* end auth-form-container */}
      </div>

      <div className="auth-right">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="auth-tagline">Start your <span>club journey</span> today.</h2>
          <p className="auth-desc">Discover clubs, collaborate on projects, and make your mark on campus.</p>
          <div style={{ marginTop: 40, padding: 24, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
               <strong style={{ color: 'var(--text-primary)' }}>Students</strong> — join clubs, submit projects<br />
               <strong style={{ color: 'var(--text-primary)' }}>Coordinators</strong> — assigned by admin<br />
               <strong style={{ color: 'var(--text-primary)' }}>Advisors</strong> — faculty assigned per club
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
