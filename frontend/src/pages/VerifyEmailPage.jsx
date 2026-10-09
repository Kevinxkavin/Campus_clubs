import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authSendVerification, authVerifyEmail } from '../api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('form');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { toast.error('Enter the 6 digit OTP'); return; }
    setLoading(true);
    try {
      const data = await authVerifyEmail(email, otp);
      if (data?.accessToken) login(data.user, data.accessToken);
      setStatus('success');
      toast.success('Email verified!');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setStatus('error');
      toast.error(err.response?.data?.message ?? 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { toast.error('Enter your email first'); return; }
    setLoading(true);
    try {
      await authSendVerification(email);
      toast.success('Verification OTP sent');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-primary)',padding:24 }}>
      <div style={{ maxWidth:400,width:'100%',textAlign:'center' }}>
        <div className="auth-logo" style={{ marginBottom:32 }}>CampusClubs</div>
        {status === 'success' ? (
          <>
            <CheckCircle size={56} style={{ color:'#10b981',margin:'0 auto 20px' }} />
            <h2 style={{ fontSize:22,fontWeight:800,marginBottom:10 }}>Email Verified</h2>
          </>
        ) : (
          <>
            {status === 'error' && <XCircle size={42} style={{ color:'#ef4444',margin:'0 auto 16px' }} />}
            <h2 style={{ fontSize:22,fontWeight:800,marginBottom:10 }}>Verify Email</h2>
            <p style={{ color:'var(--text-secondary)',fontSize:14,marginBottom:22 }}>Enter the 6 digit OTP sent to your email.</p>
            <form onSubmit={handleVerify} style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <input className="form-input" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required />
              <input className="form-input" inputMode="numeric" maxLength={6} placeholder="6 digit OTP" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required />
              <button className="btn btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
              <button type="button" className="btn btn-ghost" disabled={loading} onClick={handleResend}>Resend OTP</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
