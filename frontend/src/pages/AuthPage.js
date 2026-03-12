import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function AnimatedBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.2,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.002,
      color: ['#ffffff', '#c4b5fd', '#93c5fd', '#6ee7b7', '#fde68a'][Math.floor(Math.random() * 5)]
    }));

    const shootingStars = [];
    const addShootingStar = () => {
      shootingStars.push({ x: Math.random() * canvas.width * 0.7, y: Math.random() * canvas.height * 0.4, len: Math.random() * 120 + 60, speed: Math.random() * 4 + 3, opacity: 1, angle: Math.PI / 4 });
    };
    const shootInterval = setInterval(addShootingStar, 4000);

    const cols = Math.floor(canvas.width / 26);
    const drops = Array.from({ length: cols }, () => Math.random() * -80);
    const chars = 'アイウエオカキクケコ0123456789ABCDEF∑∞∫√'.split('');
    const matrixColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'];

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.fillStyle = 'rgba(10, 8, 30, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      stars.forEach(s => {
        s.twinkle += s.speed;
        const op = s.opacity * (0.6 + 0.4 * Math.sin(s.twinkle));
        ctx.save(); ctx.globalAlpha = op;
        ctx.shadowBlur = 6; ctx.shadowColor = s.color;
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
      });

      // Shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ctx.save(); ctx.globalAlpha = ss.opacity;
        ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 2;
        ctx.shadowBlur = 10; ctx.shadowColor = '#8b5cf6';
        ctx.beginPath(); ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - Math.cos(ss.angle) * ss.len, ss.y - Math.sin(ss.angle) * ss.len);
        ctx.stroke(); ctx.restore();
        ss.x += ss.speed * Math.cos(ss.angle);
        ss.y += ss.speed * Math.sin(ss.angle);
        ss.opacity -= 0.012;
        if (ss.opacity <= 0) shootingStars.splice(i, 1);
      }

      // Matrix rain — every 6 frames for slowness
      if (frame % 6 === 0) {
        ctx.font = '14px monospace';
        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const color = matrixColors[Math.floor(Math.random() * matrixColors.length)];
          ctx.save(); ctx.globalAlpha = 0.25;
          ctx.shadowBlur = 8; ctx.shadowColor = color;
          ctx.fillStyle = color;
          ctx.fillText(char, i * 26, drops[i] * 26);
          ctx.restore();
          ctx.save(); ctx.globalAlpha = 0.7;
          ctx.fillStyle = '#e0e7ff';
          ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
          ctx.fillText(char, i * 26, drops[i] * 26);
          ctx.restore();
          if (drops[i] * 26 > canvas.height && Math.random() > 0.985) drops[i] = 0;
          drops[i] += 0.3;
        }
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => { clearInterval(shootInterval); cancelAnimationFrame(animationId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  useEffect(() => {
    const initGoogle = () => {
      if (window.google && document.getElementById('google-btn')) {
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleResponse });
        window.google.accounts.id.renderButton(document.getElementById('google-btn'), { theme: 'filled_black', size: 'large', width: 340, text: 'continue_with' });
      } else { setTimeout(initGoogle, 500); }
    };
    initGoogle();
  }, []); // eslint-disable-line

  const handleGoogleResponse = async (response) => {
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/google`, { token: response.credential });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/';
    } catch { setError('Google login failed. Try email login.'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onloadend = () => setProfilePhoto(r.result); r.readAsDataURL(file); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (isForgot) {
        setSuccess('If that email exists, a reset link has been sent!');
        setIsForgot(false); setLoading(false); return;
      }
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name };
      const res = await axios.post(`${BACKEND_URL}${endpoint}`, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/';
    } catch (err) { setError(err.response?.data?.detail || 'Authentication failed'); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '13px 14px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px', color: '#fff',
    fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box', transition: 'border 0.3s',
    fontFamily: "'Outfit', sans-serif"
  };

  const labelStyle = {
    color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem',
    display: 'block', marginBottom: '7px',
    fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase'
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Outfit', sans-serif", position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <AnimatedBackground />

      <div style={{
        position: 'relative', zIndex: 2,
        background: 'rgba(10,8,30,0.82)', backdropFilter: 'blur(30px)',
        borderRadius: '28px', padding: '44px 40px', width: '100%', maxWidth: '460px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.12)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s ease'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '4px' }}>⚡</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Task<span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Master</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '0.88rem' }}>Build habits. Dominate your day.</p>
        </div>

        {/* Tab switcher */}
        {!isForgot && (
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.07)' }}>
            {['Login', 'Sign Up'].map((tab, i) => (
              <button key={tab} onClick={() => { setIsLogin(i === 0); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '11px', border: 'none', borderRadius: '11px', cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif", fontWeight: '700', fontSize: '0.95rem', transition: 'all 0.3s',
                  background: (i === 0) === isLogin ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  color: (i === 0) === isLogin ? '#fff' : 'rgba(255,255,255,0.35)',
                  boxShadow: (i === 0) === isLogin ? '0 4px 15px rgba(99,102,241,0.5)' : 'none'
                }}>{tab}</button>
            ))}
          </div>
        )}

        {isForgot && (
          <div style={{ marginBottom: '24px' }}>
            <button onClick={() => setIsForgot(false)} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.9rem', padding: 0, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Outfit', sans-serif" }}>
              ← Back to login
            </button>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '700', margin: '12px 0 4px' }}>Reset Password</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0 }}>Enter your email to receive a reset link</p>
          </div>
        )}

        {/* Profile photo (signup only) */}
        {!isLogin && !isForgot && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <label style={{ cursor: 'pointer', display: 'inline-block' }}>
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: 'rgba(99,102,241,0.12)',
                border: profilePhoto ? '3px solid #6366f1' : '2px dashed rgba(99,102,241,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 8px', overflow: 'hidden', transition: 'all 0.3s',
                boxShadow: profilePhoto ? '0 0 20px rgba(99,102,241,0.4)' : 'none'
              }}>
                {profilePhoto ? <img src={profilePhoto} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>📷</span>}
              </div>
              <span style={{ color: 'rgba(99,102,241,0.7)', fontSize: '0.78rem' }}>Add profile photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', color: '#fca5a5', fontSize: '0.875rem' }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', color: '#6ee7b7', fontSize: '0.875rem' }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && !isForgot && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Full Name</label>
              <input name="name" type="text" placeholder="Rithvik" value={formData.name} onChange={handleChange} required style={inputStyle} />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required style={inputStyle} />
          </div>

          {!isForgot && (
            <div style={{ marginBottom: '8px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} required style={{ ...inputStyle, paddingRight: '48px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)', padding: 0 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {isLogin && !isForgot && (
            <div style={{ textAlign: 'right', marginBottom: '22px' }}>
              <span onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }}
                style={{ color: '#818cf8', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600' }}>
                Forgot password?
              </span>
            </div>
          )}

          {!isLogin && <div style={{ marginBottom: '22px' }} />}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: loading ? 'rgba(99,102,241,0.35)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem',
            fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px',
            boxShadow: loading ? 'none' : '0 8px 25px rgba(99,102,241,0.4)',
            transition: 'all 0.3s', fontFamily: "'Outfit', sans-serif"
          }}>
            {loading ? '⏳ Please wait...' : isForgot ? '📧 Send Reset Link' : isLogin ? '🚀 Login' : '✨ Create Account'}
          </button>
        </form>

        {!isForgot && (
          <>
            <div style={{ margin: '4px 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <div id="google-btn" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }} />
          </>
        )}

        {!isForgot && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: 0 }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              style={{ color: '#818cf8', cursor: 'pointer', fontWeight: '700' }}>
              {isLogin ? 'Sign up free' : 'Login'}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
