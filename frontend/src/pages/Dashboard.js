import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({ baseURL: BACKEND_URL });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

function AnimatedBG() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    let animId;
    function resize() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * cv.width, y: Math.random() * cv.height,
      r: Math.random() * 1.5 + 0.2, tw: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.006 + 0.002,
      color: ['#ffffff', '#c4b5fd', '#93c5fd', '#e0e7ff'][Math.floor(Math.random() * 4)]
    }));

    const nebulas = [
      { x: 0.2, y: 0.3, r: 350, c: 'rgba(99,102,241,0.045)' },
      { x: 0.8, y: 0.7, r: 400, c: 'rgba(139,92,246,0.035)' },
      { x: 0.5, y: 0.1, r: 250, c: 'rgba(6,182,212,0.025)' },
    ];

    let gridOff = 0, frame = 0;

    function animate() {
      frame++;
      ctx.fillStyle = 'rgba(5,3,16,0.18)';
      ctx.fillRect(0, 0, cv.width, cv.height);

      // Nebula clouds
      nebulas.forEach(n => {
        const g = ctx.createRadialGradient(n.x * cv.width, n.y * cv.height, 0, n.x * cv.width, n.y * cv.height, n.r);
        g.addColorStop(0, n.c); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
      });

      // Stars
      stars.forEach(s => {
        s.tw += s.sp;
        const op = 0.15 + 0.7 * (0.5 + 0.5 * Math.sin(s.tw));
        ctx.save(); ctx.globalAlpha = op; ctx.shadowBlur = 4; ctx.shadowColor = s.color;
        ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
      });

      // Cyberpunk grid
      gridOff = (gridOff + 0.4) % 80;
      const gi = 0.06 + 0.03 * Math.sin(frame * 0.01);
      ctx.save();
      for (let y = -80 + gridOff % 80; y < cv.height + 80; y += 80) {
        const dc = Math.abs(y - cv.height / 2) / (cv.height / 2);
        ctx.strokeStyle = `rgba(99,102,241,${gi * (1 - dc * 0.5)})`;
        ctx.lineWidth = 1; ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(99,102,241,0.4)';
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cv.width, y); ctx.stroke();
      }
      for (let x = 0; x < cv.width + 80; x += 80) {
        const dc = Math.abs(x - cv.width / 2) / (cv.width / 2);
        ctx.strokeStyle = `rgba(139,92,246,${gi * (1 - dc * 0.4)})`;
        ctx.lineWidth = 1; ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(139,92,246,0.4)';
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke();
      }
      ctx.restore();

      // Shooting star
      if (frame % 300 === 0) {
        let ss = { x: Math.random() * cv.width * 0.6, y: Math.random() * cv.height * 0.3, len: 130, op: 1, spd: 6, a: Math.PI / 4 };
        const dss = () => {
          if (ss.op <= 0) return;
          ctx.save(); ctx.globalAlpha = ss.op;
          ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 2;
          ctx.shadowBlur = 15; ctx.shadowColor = '#8b5cf6';
          ctx.beginPath(); ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(ss.x - Math.cos(ss.a) * ss.len, ss.y - Math.sin(ss.a) * ss.len);
          ctx.stroke(); ctx.restore();
          ss.x += ss.spd; ss.y += ss.spd; ss.op -= 0.015;
          requestAnimationFrame(dss);
        };
        dss();
      }

      animId = requestAnimationFrame(animate);
    }
    animate();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

function TubesCursorCanvas() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";
      const el = document.getElementById('tubes-canvas');
      if(el && !el.dataset.init) {
        el.dataset.init = '1';
        const app = TubesCursor(el, {
          tubes: {
            colors: ["#6366f1","#8b5cf6","#06b6d4"],
            lights: { intensity: 160, colors: ["#a78bfa","#6366f1","#06b6d4","#8b5cf6"] }
          }
        });
        document.body.addEventListener('click', () => {
          const rc = () => "#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
          app.tubes.setColors([rc(),rc(),rc()]);
          app.tubes.setLightsColors([rc(),rc(),rc(),rc()]);
        });
      }
    `;
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);
  return <div id="tubes-canvas" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none' }} />;
}

function Clock() {
  const [time, setTime] = useState('');
  const [ampm, setAmpm] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      let h = n.getHours();
      const ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      setTime(`${h}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}`);
      setAmpm(ap);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setDate(`${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ padding: '20px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '220px', background: 'rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,rgba(99,102,241,0.07) 0%,transparent 70%)' }} />
      {[{ w: 170, d: 20, c: 'rgba(99,102,241,0.1)' }, { w: 130, d: 12, c: 'rgba(139,92,246,0.08)', rev: true }].map((r, i) => (
        <div key={i} style={{ position: 'absolute', width: r.w, height: r.w, borderRadius: '50%', border: `1px solid ${r.c}`, animation: `spin ${r.d}s linear infinite ${r.rev ? 'reverse' : ''}` }} />
      ))}
      <div style={{ display: 'flex', alignItems: 'baseline', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: 2, background: 'linear-gradient(135deg,#e0e7ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontVariantNumeric: 'tabular-nums' }}>{time}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, background: 'linear-gradient(135deg,#e0e7ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 6 }}>{ampm}</div>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(99,102,241,0.6)', marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>{date}</div>
    </div>
  );
}

export default function Dashboard() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dailyQuote, setDailyQuote] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'Work', priority: 'medium', status: 'todo' });
  const [habits, setHabits] = useState(() => JSON.parse(localStorage.getItem('habits') || '[]'));
  const [newHabit, setNewHabit] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('⭐');

  const fetchTasks = async () => { try { const r = await api.get('/api/tasks'); setTasks(r.data); } catch {} };
  const fetchCategories = async () => { try { const r = await api.get('/api/categories'); setCategories(r.data); } catch {} };
  const fetchDailyQuote = async () => { try { const r = await api.get('/api/daily-quote'); setDailyQuote(r.data); } catch {} };

  useEffect(() => {
    fetchTasks(); fetchCategories(); fetchDailyQuote();
    const interval = setInterval(fetchDailyQuote, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  const logout = () => { localStorage.clear(); window.location.href = '/auth'; };

  const addTask = async (e) => {
    e.preventDefault();
    try { await api.post('/api/tasks', newTask); setNewTask({ title: '', description: '', category: 'Work', priority: 'medium', status: 'todo' }); setShowAddTask(false); fetchTasks(); } catch {}
  };

  const updateTaskStatus = async (taskId, status) => { try { await api.put(`/api/tasks/${taskId}`, { status }); fetchTasks(); } catch {} };
  const deleteTask = async (taskId) => { try { await api.delete(`/api/tasks/${taskId}`); fetchTasks(); } catch {} };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const h = { id: Date.now(), name: newHabit, emoji: habitEmoji, streak: 0, history: [] };
    const updated = [...habits, h];
    setHabits(updated); localStorage.setItem('habits', JSON.stringify(updated)); setNewHabit('');
  };

  const toggleHabitToday = (id) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const done = h.history.includes(today);
      const history = done ? h.history.filter(d => d !== today) : [...h.history, today];
      let s = 0; const now = new Date();
      for (let i = 0; i < 30; i++) { const d = new Date(now); d.setDate(now.getDate() - i); if (history.includes(d.toISOString().split('T')[0])) s++; else break; }
      return { ...h, history, streak: s };
    });
    setHabits(updated); localStorage.setItem('habits', JSON.stringify(updated));
  };

  const deleteHabit = (id) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated); localStorage.setItem('habits', JSON.stringify(updated));
  };

  const getLast7Days = () => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0];
  });

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const emojis = ['⭐', '💪', '📚', '🏃', '💧', '🧘', '🎯', '🍎', '😴', '✍️'];
  const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
  const statusColor = { todo: '#6366f1', 'in-progress': '#f59e0b', done: '#10b981' };
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  const s = {
    input: { width: '100%', padding: '11px 14px', background: 'rgba(5,3,16,0.8)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'Outfit',sans-serif" },
    select: { padding: '10px 14px', background: 'rgba(5,3,16,0.9)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: "'Outfit',sans-serif" },
    btn: { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', padding: '10px 20px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', fontFamily: "'Outfit',sans-serif", transition: 'all 0.3s', boxShadow: '0 0 15px rgba(99,102,241,0.3)' },
    card: { background: 'rgba(5,3,16,0.75)', backdropFilter: 'blur(12px)', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.15)', padding: '18px 20px' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050310', fontFamily: "'Outfit',sans-serif", color: '#fff', position: 'relative' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glowPulse { 0%,100%{opacity:0.15} 50%{opacity:0.4} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        * { scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.2) transparent; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        button:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      <AnimatedBG />
      <TubesCursorCanvas />

      {/* Navbar */}
      <nav style={{ position: 'relative', zIndex: 10, background: 'rgba(5,3,16,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.15)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '62px' }}>
        <span style={{ fontWeight: 800, fontSize: '1.3rem', background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡ TaskMaster</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', fontFamily: EMOJI_FONT }}>Hey, {user.name || 'User'} 👋</span>
          <button onClick={logout} style={{ ...s.btn, background: 'rgba(255,255,255,0.06)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', fontSize: '0.8rem' }}>Logout</button>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 5, maxWidth: 1150, margin: '0 auto', padding: '28px 20px' }}>

        {/* Quote + Clock */}
        {dailyQuote && (
          <div style={{ background: 'rgba(5,3,16,0.8)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(99,102,241,0.2)', marginBottom: 24, display: 'flex', overflow: 'hidden', minHeight: 155, boxShadow: '0 0 40px rgba(99,102,241,0.08)', animation: 'fadeInUp 0.6s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 28px', flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', right: 0, top: '15%', bottom: '15%', width: 1, background: 'linear-gradient(to bottom,transparent,rgba(99,102,241,0.3),transparent)' }} />
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: -3, borderRadius: 19, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', zIndex: -1, opacity: 0.3, filter: 'blur(10px)', animation: 'glowPulse 3s ease-in-out infinite' }} />
                <img src={dailyQuote.image_url} alt={dailyQuote.character} onError={e => e.target.style.display = 'none'}
                  style={{ width: 105, height: 125, borderRadius: 16, objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)', boxShadow: '0 0 25px rgba(99,102,241,0.25)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'rgba(99,102,241,0.8)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '2.5px', margin: '0 0 8px' }}>{dailyQuote.character}</p>
                <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1rem', fontStyle: 'italic', margin: 0, lineHeight: 1.75 }}>"{dailyQuote.quote}"</p>
              </div>
            </div>
            <Clock />
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Tasks', value: totalTasks, icon: '🗒️' },
            { label: 'Completed', value: completedTasks, icon: '✅' },
            { label: 'Habits', value: habits.length, icon: '🔥' },
            { label: 'Categories', value: categories.length, icon: '🗂️' }
          ].map((stat, i) => (
            <div key={stat.label} style={{ ...s.card, textAlign: 'center', transition: 'all 0.3s', cursor: 'default', animation: `fadeInUp ${0.4 + i * 0.1}s ease` }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(99,102,241,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ fontSize: '2rem', marginBottom: 8, fontFamily: EMOJI_FONT }}>{stat.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg,#a78bfa,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'rgba(5,3,16,0.7)', padding: 5, borderRadius: 14, border: '1px solid rgba(99,102,241,0.12)', width: 'fit-content' }}>
          {[{ id: 'tasks', label: '📋 Tasks' }, { id: 'habits', label: '💪 Habits' }, { id: 'analytics', label: '📊 Analytics' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: `${EMOJI_FONT},'Outfit',sans-serif`, fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.3s', background: activeTab === tab.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent', color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.35)', boxShadow: activeTab === tab.id ? '0 0 20px rgba(99,102,241,0.4)' : 'none' }}>{tab.label}</button>
          ))}
        </div>

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: EMOJI_FONT }}>🗒️ My Tasks</h2>
              <button onClick={() => setShowAddTask(!showAddTask)} style={s.btn}>＋ Add Task</button>
            </div>

            {showAddTask && (
              <form onSubmit={addTask} style={{ ...s.card, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input style={s.input} placeholder="Task title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required />
                <input style={s.input} placeholder="Description (optional)" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <select style={s.select} value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <select style={s.select} value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" style={s.btn}>Add Task</button>
                  <button type="button" onClick={() => setShowAddTask(false)} style={{ ...s.btn, background: 'rgba(255,255,255,0.06)', boxShadow: 'none' }}>Cancel</button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasks.length === 0 && <div style={{ ...s.card, textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>No tasks yet! Add your first task above.</div>}
              {tasks.map(task => (
                <div key={task.id} style={{ background: 'rgba(5,3,16,0.75)', borderRadius: 14, border: '1px solid rgba(99,102,241,0.12)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <p style={{ margin: '0 0 6px', fontWeight: 600, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'rgba(255,255,255,0.25)' : '#fff' }}>{task.title}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: 6, background: `${priorityColor[task.priority]}18`, color: priorityColor[task.priority], fontWeight: 600, fontFamily: EMOJI_FONT }}>{priorityEmoji[task.priority]} {task.priority}</span>
                      <span style={{ fontSize: '0.68rem', padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', fontWeight: 600, fontFamily: EMOJI_FONT }}>💼 {task.category}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)}
                      style={{ ...s.select, padding: '6px 10px', fontSize: '0.8rem', color: statusColor[task.status] }}>
                      <option value="todo">📌 Todo</option>
                      <option value="in-progress">⏳ In Progress</option>
                      <option value="done">✅ Done</option>
                    </select>
                    <button onClick={() => deleteTask(task.id)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', padding: '6px 10px', cursor: 'pointer', fontFamily: EMOJI_FONT }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HABITS TAB */}
        {activeTab === 'habits' && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <h2 style={{ marginBottom: 16, fontSize: '1.2rem', fontFamily: EMOJI_FONT }}>💪 My Habits</h2>
            <div style={{ ...s.card, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {emojis.map(e => (
                  <button key={e} onClick={() => setHabitEmoji(e)} style={{ background: habitEmoji === e ? 'rgba(99,102,241,0.2)' : 'transparent', border: habitEmoji === e ? '1px solid rgba(99,102,241,0.5)' : '1px solid transparent', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: '1.3rem', transition: 'all 0.2s', fontFamily: EMOJI_FONT }}>{e}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input style={{ ...s.input }} placeholder="New habit name..." value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyPress={e => e.key === 'Enter' && addHabit()} />
                <button onClick={addHabit} style={s.btn}>Add</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {habits.length === 0 && <div style={{ ...s.card, textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>No habits yet! Add your first habit above.</div>}
              {habits.map(habit => {
                const today = new Date().toISOString().split('T')[0];
                const doneToday = habit.history?.includes(today);
                return (
                  <div key={habit.id} style={s.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.8rem', fontFamily: EMOJI_FONT }}>{habit.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{habit.name}</p>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {getLast7Days().map(day => (
                            <div key={day} style={{ width: 26, height: 26, borderRadius: 6, background: habit.history?.includes(day) ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: habit.history?.includes(day) ? '#fff' : 'rgba(255,255,255,0.4)', boxShadow: habit.history?.includes(day) ? '0 0 8px rgba(99,102,241,0.4)' : 'none' }}>
                              {new Date(day).getDate()}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: EMOJI_FONT }}>🔥 {habit.streak || 0}</span>
                        <button onClick={() => toggleHabitToday(habit.id)} style={{ ...s.btn, background: doneToday ? 'rgba(16,185,129,0.2)' : undefined, boxShadow: doneToday ? '0 0 15px rgba(16,185,129,0.3)' : undefined, padding: '8px 14px', fontFamily: EMOJI_FONT }}>
                          {doneToday ? '✅ Done' : 'Mark Done'}
                        </button>
                        <button onClick={() => deleteHabit(habit.id)} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', padding: '8px 10px', cursor: 'pointer', fontFamily: EMOJI_FONT }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <h2 style={{ marginBottom: 16, fontSize: '1.2rem', fontFamily: EMOJI_FONT }}>📊 Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
              <div style={s.card}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'rgba(167,139,250,0.8)', fontFamily: EMOJI_FONT }}>✅ Task Completion</h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative', width: 120, height: 120 }}>
                    <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="url(#purpleGrad)" strokeWidth="12"
                        strokeDasharray={`${totalTasks > 0 ? (completedTasks / totalTasks) * 314 : 0} 314`} strokeLinecap="round" />
                      <defs><linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a78bfa" /></linearGradient></defs>
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                    </div>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', margin: 0 }}>{completedTasks} of {totalTasks} tasks done</p>
                </div>
              </div>

              <div style={s.card}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'rgba(167,139,250,0.8)', fontFamily: EMOJI_FONT }}>🔥 Habit Streaks</h3>
                {habits.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>No habits tracked yet</p>}
                {habits.map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontFamily: EMOJI_FONT }}>{h.emoji}</span>
                    <span style={{ flex: 1, fontSize: '0.875rem' }}>{h.name}</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: EMOJI_FONT }}>🔥 {h.streak || 0}</span>
                  </div>
                ))}
              </div>

              <div style={s.card}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'rgba(167,139,250,0.8)', fontFamily: EMOJI_FONT }}>📌 Tasks by Priority</h3>
                {['high', 'medium', 'low'].map(p => {
                  const count = tasks.filter(t => t.priority === p).length;
                  return (
                    <div key={p} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: '0.875rem', color: priorityColor[p], fontFamily: EMOJI_FONT }}>{priorityEmoji[p]} {p}</span>
                        <span style={{ fontSize: '0.875rem' }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${totalTasks > 0 ? (count / totalTasks) * 100 : 0}%`, background: `linear-gradient(90deg,${priorityColor[p]},rgba(99,102,241,0.5))`, borderRadius: 3, transition: 'width 0.5s', boxShadow: `0 0 8px ${priorityColor[p]}` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
