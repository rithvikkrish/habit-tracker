import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const api = axios.create({ baseURL: BACKEND_URL });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const FONT = `'Outfit',${EMOJI}`;

function TubesCursor() {
  useEffect(() => {
    const s = document.createElement('script');
    s.type = 'module';
    s.textContent = `
      import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";
      const el = document.getElementById('tubes-canvas');
      if(el && !el.dataset.init){
        el.dataset.init='1';
        const app = TubesCursor(el,{tubes:{colors:["#00d4ff","#7c3aed","#06b6d4"],lights:{intensity:150,colors:["#00d4ff","#a78bfa","#06b6d4","#8b5cf6"]}}});
        document.body.addEventListener('click',()=>{
          const rc=()=>"#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
          app.tubes.setColors([rc(),rc(),rc()]);
          app.tubes.setLightsColors([rc(),rc(),rc(),rc()]);
        });
      }`;
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);
  return <div id="tubes-canvas" style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }} />;
}

function Clock() {
  const [t, setT] = useState({ time:'', ampm:'', date:'' });
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      let h = n.getHours(), ap = h >= 12 ? 'AM' : 'AM';
      ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      setT({
        time: `${h}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`,
        ampm: ap,
        date: `${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}`
      });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return (
    <div style={{ minWidth:240, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 40px', borderLeft:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:6 }}>
        <span style={{ fontSize:'2.8rem', fontWeight:800, letterSpacing:1, fontVariantNumeric:'tabular-nums', background:'linear-gradient(135deg,#00d4ff,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 }}>{t.time}</span>
        <span style={{ fontSize:'1rem', fontWeight:700, color:'#00d4ff', marginTop:6 }}>{t.ampm}</span>
      </div>
      <div style={{ fontSize:'0.75rem', color:'rgba(0,212,255,0.6)', letterSpacing:'2px', marginTop:6, fontWeight:600 }}>{t.date}</div>
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
  const [newTask, setNewTask] = useState({ title:'', description:'', category:'Work', priority:'medium', status:'todo' });
  const [habits, setHabits] = useState(() => JSON.parse(localStorage.getItem('habits') || '[]'));
  const [newHabit, setNewHabit] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('⭐');

  const fetchTasks = async () => { try { const r = await api.get('/api/tasks'); setTasks(r.data); } catch {} };
  const fetchCategories = async () => { try { const r = await api.get('/api/categories'); setCategories(r.data); } catch {} };
  const fetchQuote = async () => { try { const r = await api.get('/api/daily-quote'); setDailyQuote(r.data); } catch {} };

  useEffect(() => {
    fetchTasks(); fetchCategories(); fetchQuote();
    const id = setInterval(fetchQuote, 3600000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  const logout = () => { localStorage.clear(); window.location.href = '/auth'; };

  const addTask = async (e) => {
    e.preventDefault();
    try { await api.post('/api/tasks', newTask); setNewTask({ title:'', description:'', category:'Work', priority:'medium', status:'todo' }); setShowAddTask(false); fetchTasks(); } catch {}
  };
  const updateTaskStatus = async (id, status) => { try { await api.put(`/api/tasks/${id}`, { status }); fetchTasks(); } catch {} };
  const deleteTask = async (id) => { try { await api.delete(`/api/tasks/${id}`); fetchTasks(); } catch {} };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const h = { id: Date.now(), name: newHabit, emoji: habitEmoji, streak: 0, history: [] };
    const u = [...habits, h]; setHabits(u); localStorage.setItem('habits', JSON.stringify(u)); setNewHabit('');
  };
  const toggleHabit = (id) => {
    const today = new Date().toISOString().split('T')[0];
    const u = habits.map(h => {
      if (h.id !== id) return h;
      const done = h.history.includes(today);
      const history = done ? h.history.filter(d => d !== today) : [...h.history, today];
      let s = 0; const now = new Date();
      for (let i = 0; i < 30; i++) { const d = new Date(now); d.setDate(now.getDate()-i); if (history.includes(d.toISOString().split('T')[0])) s++; else break; }
      return { ...h, history, streak: s };
    });
    setHabits(u); localStorage.setItem('habits', JSON.stringify(u));
  };
  const deleteHabit = (id) => { const u = habits.filter(h => h.id !== id); setHabits(u); localStorage.setItem('habits', JSON.stringify(u)); };
  const getLast7 = () => Array.from({length:7}, (_,i) => { const d = new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().split('T')[0]; });

  const done = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const emojis = ['⭐','💪','📚','🏃','💧','🧘','🎯','🍎','😴','✍️'];
  const pColor = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' };
  const pEmoji = { high:'🔴', medium:'🟡', low:'🟢' };
  const sColor = { todo:'#a78bfa', 'in-progress':'#f59e0b', done:'#10b981' };

  const card = { background:'rgba(255,255,255,0.04)', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', padding:'18px 20px', backdropFilter:'blur(10px)' };
  const inp = { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', fontFamily:FONT };
  const sel = { padding:'10px 14px', background:'#0d1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#fff', fontSize:'0.9rem', outline:'none', fontFamily:FONT };
  const btn = { background:'linear-gradient(135deg,#1e1b4b,#312e81)', border:'1px solid rgba(99,102,241,0.4)', borderRadius:10, color:'#fff', padding:'10px 22px', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', fontFamily:FONT, transition:'all 0.2s', boxShadow:'0 0 20px rgba(99,102,241,0.2)' };

  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', fontFamily:FONT, color:'#fff', position:'relative', overflowX:'hidden' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{opacity:0.2} 50%{opacity:0.45} }
        * { scrollbar-width:thin; scrollbar-color:rgba(99,102,241,0.2) transparent; }
        input::placeholder { color:rgba(255,255,255,0.2); }
        select option { background:#0d1117; }
      `}</style>

      <TubesCursor />

      {/* Navbar */}
      <nav style={{ position:'relative', zIndex:10, background:'rgba(13,17,23,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <span style={{ fontWeight:800, fontSize:'1.4rem', background:'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>⚡ TaskMaster</span>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.9rem' }}>Hey, {user.name || 'User'} 👋</span>
          <button onClick={logout} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'rgba(255,255,255,0.6)', padding:'8px 18px', cursor:'pointer', fontFamily:FONT, fontSize:'0.85rem', transition:'all 0.2s' }}>Logout</button>
        </div>
      </nav>

      <div style={{ position:'relative', zIndex:5, maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>

        {/* Quote + Clock */}
        {dailyQuote && (
          <div style={{ ...card, marginBottom:24, display:'flex', alignItems:'stretch', minHeight:160, animation:'fadeUp 0.5s ease', padding:0, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:22, padding:'24px 28px', flex:1 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ position:'absolute', inset:-3, borderRadius:18, background:'linear-gradient(135deg,#00d4ff,#7c3aed)', opacity:0.3, filter:'blur(8px)', animation:'glowPulse 3s ease-in-out infinite', zIndex:-1 }} />
                <img src={dailyQuote.image_url} alt="" onError={e => e.target.style.display='none'}
                  style={{ width:105, height:125, borderRadius:14, objectFit:'cover', border:'2px solid rgba(0,212,255,0.25)', display:'block' }} />
              </div>
              <div>
                <p style={{ color:'#00d4ff', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'3px', margin:'0 0 10px', fontWeight:700 }}>{dailyQuote.character}</p>
                <p style={{ color:'rgba(255,255,255,0.82)', fontSize:'1rem', fontStyle:'italic', margin:0, lineHeight:1.8, maxWidth:560 }}>"{dailyQuote.quote}"</p>
              </div>
            </div>
            <Clock />
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
          {[
            { label:'TOTAL TASKS', value:total, icon:'🗒️' },
            { label:'COMPLETED', value:done, icon:'✅' },
            { label:'HABITS', value:habits.length, icon:'🔥' },
            { label:'CATEGORIES', value:categories.length, icon:'🗂️' }
          ].map((s, i) => (
            <div key={s.label} style={{ ...card, textAlign:'center', padding:'28px 20px', transition:'all 0.25s', cursor:'default', animation:`fadeUp ${0.3+i*0.08}s ease` }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='rgba(0,212,255,0.2)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,212,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor=''; e.currentTarget.style.boxShadow=''; }}>
              <div style={{ fontSize:'2.2rem', marginBottom:12, fontFamily:EMOJI }}>{s.icon}</div>
              <div style={{ fontSize:'2.2rem', fontWeight:800, background:'linear-gradient(135deg,#00d4ff,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1, marginBottom:8 }}>{s.value}</div>
              <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', letterSpacing:'2px', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:24, background:'rgba(255,255,255,0.03)', padding:5, borderRadius:12, border:'1px solid rgba(255,255,255,0.07)', width:'fit-content' }}>
          {[{id:'tasks',label:'📋 Tasks'},{id:'habits',label:'🧡 Habits'},{id:'analytics',label:'📊 Analytics'}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding:'9px 24px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:FONT, fontWeight:600, fontSize:'0.875rem', transition:'all 0.2s', background: activeTab===tab.id ? 'rgba(99,102,241,0.25)' : 'transparent', color: activeTab===tab.id ? '#fff' : 'rgba(255,255,255,0.35)', outline: activeTab===tab.id ? '1px solid rgba(99,102,241,0.35)' : 'none' }}>{tab.label}</button>
          ))}
        </div>

        {/* TASKS */}
        {activeTab === 'tasks' && (
          <div style={{ animation:'fadeUp 0.35s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
              <h2 style={{ margin:0, fontSize:'1.2rem', fontWeight:700, display:'flex', alignItems:'center', gap:8 }}><span style={{fontFamily:EMOJI}}>🗒️</span> My Tasks</h2>
              <button onClick={() => setShowAddTask(!showAddTask)} style={{ ...btn, background:'linear-gradient(135deg,#312e81,#4c1d95)', padding:'11px 24px' }}>+ Add Task</button>
            </div>

            {showAddTask && (
              <form onSubmit={addTask} style={{ ...card, marginBottom:16, display:'flex', flexDirection:'column', gap:12 }}>
                <input style={inp} placeholder="Task title" value={newTask.title} onChange={e => setNewTask({...newTask, title:e.target.value})} required />
                <input style={inp} placeholder="Description (optional)" value={newTask.description} onChange={e => setNewTask({...newTask, description:e.target.value})} />
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <select style={sel} value={newTask.category} onChange={e => setNewTask({...newTask, category:e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <select style={sel} value={newTask.priority} onChange={e => setNewTask({...newTask, priority:e.target.value})}>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" style={btn}>Add Task</button>
                  <button type="button" onClick={() => setShowAddTask(false)} style={{ ...btn, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'none' }}>Cancel</button>
                </div>
              </form>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {tasks.length === 0 && <div style={{ ...card, textAlign:'center', color:'rgba(255,255,255,0.25)', padding:32 }}>No tasks yet! Hit + Add Task to get started.</div>}
              {tasks.map(task => (
                <div key={task.id} style={{ ...card, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', transition:'all 0.25s', padding:'18px 22px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,212,255,0.15)'; e.currentTarget.style.transform='translateX(3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.transform=''; }}>
                  <div style={{ flex:1, minWidth:150 }}>
                    <p style={{ margin:'0 0 8px', fontWeight:700, fontSize:'1rem', textDecoration:task.status==='done'?'line-through':'none', color:task.status==='done'?'rgba(255,255,255,0.2)':'#fff' }}>{task.title}</p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.72rem', padding:'3px 12px', borderRadius:20, background:`${pColor[task.priority]}15`, color:pColor[task.priority], fontWeight:700, border:`1px solid ${pColor[task.priority]}30`, fontFamily:EMOJI }}>{pEmoji[task.priority]} {task.priority.charAt(0).toUpperCase()+task.priority.slice(1)}</span>
                      <span style={{ fontSize:'0.72rem', padding:'3px 12px', borderRadius:20, background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.4)', fontWeight:600, border:'1px solid rgba(255,255,255,0.08)', fontFamily:EMOJI }}>💼 {task.category}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)}
                      style={{ ...sel, padding:'7px 12px', fontSize:'0.8rem', color:sColor[task.status], fontFamily:EMOJI }}>
                      <option value="todo">📌 Todo</option>
                      <option value="in-progress">⏳ In Progress</option>
                      <option value="done">✅ Done</option>
                    </select>
                    <button onClick={() => deleteTask(task.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#ef4444', padding:'7px 11px', cursor:'pointer', fontFamily:EMOJI, fontSize:'1rem' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HABITS */}
        {activeTab === 'habits' && (
          <div style={{ animation:'fadeUp 0.35s ease' }}>
            <h2 style={{ marginBottom:18, fontSize:'1.2rem', fontWeight:700 }}><span style={{fontFamily:EMOJI}}>💪</span> My Habits</h2>
            <div style={{ ...card, marginBottom:16, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {emojis.map(e => (
                  <button key={e} onClick={() => setHabitEmoji(e)} style={{ background:habitEmoji===e?'rgba(99,102,241,0.2)':'transparent', border:habitEmoji===e?'1px solid rgba(99,102,241,0.5)':'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'5px 9px', cursor:'pointer', fontSize:'1.4rem', transition:'all 0.2s', fontFamily:EMOJI }}>{e}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <input style={inp} placeholder="New habit name..." value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyPress={e => e.key==='Enter' && addHabit()} />
                <button onClick={addHabit} style={btn}>Add</button>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {habits.length === 0 && <div style={{ ...card, textAlign:'center', color:'rgba(255,255,255,0.25)', padding:32 }}>No habits yet! Add one above.</div>}
              {habits.map(habit => {
                const today = new Date().toISOString().split('T')[0];
                const doneToday = habit.history?.includes(today);
                return (
                  <div key={habit.id} style={card}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                      <span style={{ fontSize:'2rem', fontFamily:EMOJI }}>{habit.emoji}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:'0 0 8px', fontWeight:700 }}>{habit.name}</p>
                        <div style={{ display:'flex', gap:4 }}>
                          {getLast7().map(day => (
                            <div key={day} style={{ width:28, height:28, borderRadius:7, background:habit.history?.includes(day)?'linear-gradient(135deg,#00d4ff,#7c3aed)':'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', color:habit.history?.includes(day)?'#fff':'rgba(255,255,255,0.3)', fontWeight:700, boxShadow:habit.history?.includes(day)?'0 0 10px rgba(0,212,255,0.3)':'none' }}>
                              {new Date(day).getDate()}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ color:'#f59e0b', fontWeight:700, fontFamily:EMOJI }}>🔥 {habit.streak||0}</span>
                        <button onClick={() => toggleHabit(habit.id)} style={{ ...btn, padding:'8px 16px', background:doneToday?'rgba(16,185,129,0.15)':'linear-gradient(135deg,#312e81,#4c1d95)', border:doneToday?'1px solid rgba(16,185,129,0.35)':undefined, fontFamily:EMOJI }}>
                          {doneToday ? '✅ Done' : 'Mark Done'}
                        </button>
                        <button onClick={() => deleteHabit(habit.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#ef4444', padding:'8px 11px', cursor:'pointer', fontFamily:EMOJI }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <div style={{ animation:'fadeUp 0.35s ease' }}>
            <h2 style={{ marginBottom:18, fontSize:'1.2rem', fontWeight:700 }}><span style={{fontFamily:EMOJI}}>📊</span> Analytics</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>

              <div style={card}>
                <h3 style={{ margin:'0 0 18px', fontSize:'0.95rem', color:'rgba(0,212,255,0.7)', fontFamily:EMOJI }}>✅ Task Completion</h3>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
                  <div style={{ position:'relative', width:130, height:130 }}>
                    <svg viewBox="0 0 120 120" width="130" height="130" style={{ transform:'rotate(-90deg)' }}>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"/>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="url(#cg)" strokeWidth="12"
                        strokeDasharray={`${total>0?(done/total)*314:0} 314`} strokeLinecap="round"/>
                      <defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%"><stop offset="0%" stopColor="#00d4ff"/><stop offset="100%" stopColor="#a78bfa"/></linearGradient></defs>
                    </svg>
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'1.4rem', fontWeight:800, background:'linear-gradient(135deg,#00d4ff,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                      {total>0?Math.round((done/total)*100):0}%
                    </div>
                  </div>
                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.875rem', margin:0 }}>{done} of {total} tasks done</p>
                </div>
              </div>

              <div style={card}>
                <h3 style={{ margin:'0 0 18px', fontSize:'0.95rem', color:'rgba(0,212,255,0.7)', fontFamily:EMOJI }}>🔥 Habit Streaks</h3>
                {habits.length===0 && <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.875rem' }}>No habits tracked yet</p>}
                {habits.map(h => (
                  <div key={h.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <span style={{ fontFamily:EMOJI, fontSize:'1.2rem' }}>{h.emoji}</span>
                    <span style={{ flex:1, fontSize:'0.9rem' }}>{h.name}</span>
                    <span style={{ color:'#f59e0b', fontWeight:700, fontFamily:EMOJI }}>🔥 {h.streak||0}</span>
                  </div>
                ))}
              </div>

              <div style={card}>
                <h3 style={{ margin:'0 0 18px', fontSize:'0.95rem', color:'rgba(0,212,255,0.7)', fontFamily:EMOJI }}>📌 Tasks by Priority</h3>
                {['high','medium','low'].map(p => {
                  const count = tasks.filter(t => t.priority===p).length;
                  return (
                    <div key={p} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:'0.875rem', color:pColor[p], fontFamily:EMOJI }}>{pEmoji[p]} {p.charAt(0).toUpperCase()+p.slice(1)}</span>
                        <span style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.5)' }}>{count}</span>
                      </div>
                      <div style={{ height:6, background:'rgba(255,255,255,0.05)', borderRadius:3 }}>
                        <div style={{ height:'100%', width:`${total>0?(count/total)*100:0}%`, background:`linear-gradient(90deg,${pColor[p]},rgba(0,212,255,0.4))`, borderRadius:3, transition:'width 0.6s', boxShadow:`0 0 8px ${pColor[p]}60` }} />
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
