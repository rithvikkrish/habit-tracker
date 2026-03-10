import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-btn'),
          { theme: 'filled_black', size: 'large', width: 360, text: 'continue_with' }
        );
      } else {
        setTimeout(initGoogle, 500);
      }
    };
    initGoogle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/google`, { token: response.credential });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/';
    } catch (err) {
      setError('Google login failed. Please try email login.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name };
      const res = await axios.post(`${BACKEND_URL}${endpoint}`, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif", padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
        borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '440px',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff', margin: '0 0 8px 0' }}>TaskMaster</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.95rem' }}>Build habits. Get things done.</p>
        </div>

        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700', marginBottom: '6px' }}>
          {isLogin ? 'Welcome back' : 'Create account'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '24px' }}>
          {isLogin ? 'Login to your account' : 'Start tracking your habits today'}
        </p>

        {!isLogin && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <label style={{ cursor: 'pointer' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: '2px dashed rgba(99,102,241,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 8px', overflow: 'hidden'
              }}>
                {profilePhoto
                  ? <img src={profilePhoto} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '1.8rem' }}>📷</span>}
              </div>
              <span style={{ color: 'rgba(99,102,241,0.8)', fontSize: '0.8rem' }}>Click to add profile photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', padding: '12px', marginBottom: '16px',
            color: '#fca5a5', fontSize: '0.875rem'
          }}>⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <input name="name" type="text" placeholder="Rithvik" value={formData.name} onChange={handleChange} required
                style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', display: 'block', marginBottom: '6px' }}>Email</label>
            <input name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', display: 'block', marginBottom: '6px' }}>Password</label>
            <input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px',
            background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '10px', color: '#fff', fontSize: '1rem',
            fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px'
          }}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div style={{ margin: '8px 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <div id="google-btn" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}></div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: 0 }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ color: '#818cf8', cursor: 'pointer', fontWeight: '600' }}>
            {isLogin ? 'Sign up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}
