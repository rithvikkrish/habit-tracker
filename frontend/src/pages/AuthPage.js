import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const CHARACTERS = [
  { name: "Monkey D. Luffy", img: "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/hpnw0se1_WhatsApp%20Image%202026-01-08%20at%2011.01.45%20AM%20%281%29.jpeg", color: "#f97316" },
  { name: "Roronoa Zoro", img: "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/c17vjizp_WhatsApp%20Image%202026-01-08%20at%2011.01.46%20AM%20%281%29.jpeg", color: "#10b981" },
  { name: "Levi Ackerman", img: "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/1l70xx0e_WhatsApp%20Image%202026-01-08%20at%2011.01.49%20AM.jpeg", color: "#6366f1" },
  { name: "Eren Yeager", img: "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/1l70xx0e_WhatsApp%20Image%202026-01-08%20at%2011.01.49%20AM.jpeg", color: "#ef4444" },
  { name: "Cristiano Ronaldo", img: "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/5a29zefk_WhatsApp%20Image%202026-01-08%20at%2011.01.30%20AM.jpeg", color: "#3b82f6" },
  { name: "Billy Butcher", img: "https://customer-assets.emergentagent.com/job_todomaster-271/artifacts/c6n1apo2_WhatsApp%20Image%202026-01-08%20at%2011.01.39%20AM%20%281%29.jpeg", color: "#8b5cf6" },
];

function AnimatedBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        this.opacity = Math.random() * 0.6 + 0.1;
        this.color = ['#6366f1','#8b5cf6','#06b6d4','#f97316','#10b981'][Math.floor(Math.random()*5)];
      }
      update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
      }
      draw() {
        ctx.save(); ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = 15; ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
      }
    }
    for (let i = 0; i < 120; i++) particles.push(new Particle());
    let t = 0;
    const animate = () => {
      t += 0.003;
      const r1 = Math.floor(15 + Math.sin(t) * 5);
      const r2 = Math.floor(48 + Math.sin(t + 1) * 10);
      const r3 = Math.floor(36 + Math.sin(t + 2) * 8);
      ctx.fillStyle = `rgb(${r1},${r2},${r3})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 100) {
            ctx.save(); ctx.globalAlpha = (1 - dist/100) * 0.15;
            ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); ctx.restore();
          }
        }
      }
      particles.forEach(p => { p.update(); p.draw(); });
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId); };
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
  const [currentChar, setCurrentChar] = useState(0);
  const [charVisible, setCharVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
    const interval = setInterval(() => {
      setCharVisible(false);
      setTimeout(() => { setCurrentChar(p => (p + 1) % CHARACTERS.length); setCharVisible(true); }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
    } catch { setError('Google login failed.'); }
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

  const char = CHARACTERS[currentChar];

  const inputStyle = {
    width: '100%', padding: '13px 14px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px', color: '#fff',
    fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box', transition: 'all 0.3s',
    fontFamily: "'Outfit', sans-serif"
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Outfit', sans-serif", position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <AnimatedBackground />

      {/* Character showcase - left side */}
      <div style={{
        position: 'fixed', left: '5%', top: '50%', transform: 'translateY(-50%)',
        display: window.innerWidth > 1100 ? 'flex' : 'none',
        flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 1
      }}>
        <div style={{
          width: '220px', height: '280px', borderRadius: '20px', overflow: 'hidden',
          border: `2px solid ${char.color}`,
          boxShadow: `0 0 40px ${char.color}60`,
          transition: 'all 0.5s ease',
          opacity: charVisible ? 1 : 0,
          transform: charVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
        }}>
          <img src={char.img} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{
          color: '#fff', fontWeight: '700', fontSize: '1rem', textAlign: 'center',
          opacity: charVisible ? 1 : 0, transition: 'opacity 0.5s',
          textShadow: `0 0 20px ${char.color}`
        }}>{char.name}</div>
        {/* Character dots */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {CHARACTERS.map((_, i) => (
            <div key={i} onClick={() => { setCurrentChar(i); setCharVisible(true); }}
              style={{ width: i === currentChar ? '20px' : '8px', height: '8px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.3s', background: i === currentChar ? char.color : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
      </div>

      {/* Right character */}
      <div style={{
        position: 'fixed', right: '5%', top: '50%', transform: 'translateY(-50%)',
        display: window.innerWidth > 1100 ? 'flex' : 'none',
        flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 1
      }}>
        <div style={{
          width: '220px', height: '280px', borderRadius: '20px', overflow: 'hidden',
          border: `2px solid ${CHARACTERS[(currentChar + 3) % CHARACTERS.length].color}`,
          boxShadow: `0 0 40px ${CHARACTERS[(currentChar + 3) % CHARACTERS.length].color}60`,
          opacity: charVisible ? 1 : 0,
          transition: 'all 0.5s ease',
          transform: charVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
        }}>
          <img src={CHARACTERS[(currentChar + 3) % CHARACTERS.length].img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ color: '#fff', fontWeight: '700', fontSize: '1rem', textAlign: 'center', opacity: charVisible ? 1 : 0, transition: 'opacity 0.5s', textShadow: `0 0 20px ${CHARACTERS[(currentChar + 3) % CHARACTERS.length].color}` }}>
          {CHARACTERS[(currentChar + 3) % CHARACTERS.length].name}
        </div>
      </div>

      {/* Main card */}
      <div style={{
        position: 'relative', zIndex: 2,
        background: 'rgba(15,12,41,0.85)', backdropFilter: 'blur(30px)',
        borderRadius: '28px', padding: '44px 40px', width: '100%', maxWidth: '460px',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.15)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s ease'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '4px' }}>⚡</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Task<span style={{ color: '#6366f1' }}>Master</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: '0.9rem' }}>Build habits. Dominate your day.</p>
        </div>

        {/* Tab switcher */}
        {!isForgot && (
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', marginBottom: '28px' }}>
            {['Login', 'Sign Up'].map((tab, i) => (
              <button key={tab} onClick={() => { setIsLogin(i === 0); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif", fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.3s',
                  background: (i === 0) === isLogin ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  color: (i === 0) === isLogin ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: (i === 0) === isLogin ? '0 4px 15px rgba(99,102,241,0.4)' : 'none'
                }}>{tab}</button>
            ))}
          </div>
        )}

        {isForgot && (
          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => setIsForgot(false)} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.9rem', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              ← Back to login
            </button>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '700', margin: '12px 0 4px' }}>Reset Password</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0 }}>Enter your email to receive a reset link</p>
          </div>
        )}

        {/* Profile photo */}
        {!isLogin && !isForgot && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <label style={{ cursor: 'pointer', display: 'inline-block' }}>
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: 'rgba(99,102,241,0.15)',
                border: profilePhoto ? `3px solid #6366f1` : '2px dashed rgba(99,102,241,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 8px', overflow: 'hidden', transition: 'all 0.3s',
                boxShadow: profilePhoto ? '0 0 20px rgba(99,102,241,0.4)' : 'none'
              }}>
                {profilePhoto ? <img src={profilePhoto} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>📷</span>}
              </div>
              <span style={{ color: 'rgba(99,102,241,0.8)', fontSize: '0.78rem' }}>Add profile photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', color: '#fca5a5', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', color: '#6ee7b7', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && !isForgot && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', display: 'block', marginBottom: '7px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Full Name</label>
              <input name="name" type="text" placeholder="Rithvik" value={formData.name} onChange={handleChange} required style={inputStyle} />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', display: 'block', marginBottom: '7px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Email</label>
            <input name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required style={inputStyle} />
          </div>

          {!isForgot && (
            <div style={{ marginBottom: '8px' }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', display: 'block', marginBottom: '7px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} required style={{ ...inputStyle, paddingRight: '48px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', padding: 0 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {isLogin && !isForgot && (
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <span onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }} style={{ color: '#818cf8', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600' }}>
                Forgot password?
              </span>
            </div>
          )}

          {!isLogin && <div style={{ marginBottom: '20px' }} />}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem',
            fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px',
            boxShadow: loading ? 'none' : '0 8px 25px rgba(99,102,241,0.45)',
            transition: 'all 0.3s', fontFamily: "'Outfit', sans-serif",
            letterSpacing: '0.3px'
          }}>
            {loading ? '⏳ Please wait...' : isForgot ? '📧 Send Reset Link' : isLogin ? '🚀 Login' : '✨ Create Account'}
          </button>
        </form>

        {!isForgot && (
          <>
            <div style={{ margin: '4px 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div id="google-btn" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }} />
          </>
        )}

        {!isForgot && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: 0 }}>
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
