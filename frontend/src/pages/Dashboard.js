import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const api = axios.create({ baseURL: BACKEND_URL });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const FONT  = `'Outfit',${EMOJI}`;
const CYAN  = '#00e5ff';
const PURP  = '#bf5fff';
const GRAD  = `linear-gradient(90deg,${CYAN},${PURP})`;

function TubesCursor() {
  useEffect(() => {
    const s = document.createElement('script');
    s.type = 'module';
    s.textContent = `
      import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";
      const el = document.getElementById('tubes-canvas');
      if(el && !el.dataset.init){
        el.dataset.init='1';
        const app = TubesCursor(el,{tubes:{
          colors:["#00e5ff","#bf5fff","#06b6d4"],
          lights:{intensity:150,colors:["#00e5ff","#bf5fff","#06b6d4","#a855f7"]}
        }});
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
      let h = n.getHours();
      const ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const days   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      setT({
        time: `${h}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`,
        ampm: ap,
        date: `${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}`
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ minWidth:260, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 44px', borderLeft:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.25)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', border:`1px solid rgba(0,229,255,0.07)`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
      <div style={{ position:'absolute', width:150, height:150, borderRadius:'50%', border:`1px solid rgba(191,95,255,0.06)`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
      <div style={{ display:'flex', alignItems:'flex-start', gap:6, position:'relative', zIndex:1 }}>
        <span style={{ fontSize:'3rem', fontWeight:800, fontVariantNumeric:'tabular-nums', lineHeight:1, letterSpacing:1, background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{t.time}</span>
        <span style={{ fontSize:'1rem', fontWeight:800, color:CYAN, marginTop:8, letterSpacing:1 }}>{t.ampm}</span>
      </div>
      <div style={{ fontSize:'0.72rem', fontWeight:700, color:`rgba(0,200,230,0.55)`, letterSpacing:'2.5px', marginTop:8, position:'relative', zIndex:1 }}>{t.date}</div>
    </div>
  );
}

/* ── Bar chart helper ── */
function BarChart({ data, maxVal, colorFn }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:90, marginTop:12 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:'0.6rem', color:CYAN, fontWeight:700 }}>{d.value || ''}</span>
          <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background: colorFn ? colorFn(i) : GRAD, height:`${Math.max((d.value/max)*70, d.value>0?4:0)}px`, transition:'height 0.5s', boxShadow:d.value>0?`0 0 8px rgba(0,229,255,0.3)`:'none', minHeight:d.value>0?4:0 }} />
          <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.3)', fontWeight:600, textAlign:'center', lineHeight:1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [user]        = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [tasks,       setTasks]      = useState([]);
  const [categories,  setCategories] = useState([]);
  const [dailyQuote,  setDailyQuote] = useState(null);
  const [activeTab,   setActiveTab]  = useState('tasks');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('weekly');
  const [showAdd,     setShowAdd]    = useState(false);
  const [newTask,     setNewTask]    = useState({ title:'', description:'', category:'Work', priority:'medium', status:'todo' });
  const [habits,      setHabits]     = useState(() => JSON.parse(localStorage.getItem('habits') || '[]'));
  const [newHabit,    setNewHabit]   = useState('');
  const [habitEmoji,  setHabitEmoji] = useState('⭐');

  const fetchTasks      = async () => { try { const r = await api.get('/api/tasks');       setTasks(r.data);      } catch {} };
  const fetchCategories = async () => { try { const r = await api.get('/api/categories');  setCategories(r.data); } catch {} };
  const fetchQuote      = async () => { try { const r = await api.get('/api/daily-quote'); setDailyQuote(r.data); } catch {} };

  useEffect(() => {
    fetchTasks(); fetchCategories(); fetchQuote();
    const id = setInterval(fetchQuote, 3600000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  const logout = () => { localStorage.clear(); window.location.href = '/auth'; };

  const addTask = async (e) => {
    e.preventDefault();
    try { await api.post('/api/tasks', newTask); setNewTask({ title:'', description:'', category:'Work', priority:'medium', status:'todo' }); setShowAdd(false); fetchTasks(); } catch {}
  };
  const updateStatus = async (id, status) => { try { await api.put(`/api/tasks/${id}`, { status }); fetchTasks(); } catch {} };
  const deleteTask   = async (id)         => { try { await api.delete(`/api/tasks/${id}`);           fetchTasks(); } catch {} };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const h = { id:Date.now(), name:newHabit, emoji:habitEmoji, streak:0, history:[] };
    const u = [...habits, h]; setHabits(u); localStorage.setItem('habits', JSON.stringify(u)); setNewHabit('');
  };
  const toggleHabit = (id) => {
    const today = new Date().toISOString().split('T')[0];
    const u = habits.map(h => {
      if (h.id !== id) return h;
      const done    = h.history.includes(today);
      const history = done ? h.history.filter(d => d !== today) : [...h.history, today];
      let s = 0; const now = new Date();
      for (let i = 0; i < 30; i++) { const d = new Date(now); d.setDate(now.getDate()-i); if (history.includes(d.toISOString().split('T')[0])) s++; else break; }
      return { ...h, history, streak:s };
    });
    setHabits(u); localStorage.setItem('habits', JSON.stringify(u));
  };
  const deleteHabit = (id) => { const u = habits.filter(h => h.id !== id); setHabits(u); localStorage.setItem('habits', JSON.stringify(u)); };

  const getLast7 = () => Array.from({length:7}, (_,i) => { const d = new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().split('T')[0]; });

  /* ── Analytics helpers ── */
  const getWeeklyTaskData = () => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return Array.from({length:7}, (_,i) => {
      const d = new Date(); d.setDate(d.getDate()-(6-i));
      const ds = d.toISOString().split('T')[0];
      return { label: days[d.getDay()], value: tasks.filter(t => t.created_at && t.created_at.startsWith(ds)).length };
    });
  };
  const getMonthlyTaskData = () => {
    return Array.from({length:4}, (_,i) => {
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - (3-i)*7);
      const weekEnd   = new Date(); weekEnd.setDate(weekEnd.getDate() - (2-i)*7);
      const label = `W${i+1}`;
      const value = tasks.filter(t => {
        if (!t.created_at) return false;
        const cd = new Date(t.created_at);
        return cd >= weekStart && cd < weekEnd;
      }).length;
      return { label, value };
    });
  };
  const getWeeklyHabitData = () => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return Array.from({length:7}, (_,i) => {
      const d = new Date(); d.setDate(d.getDate()-(6-i));
      const ds = d.toISOString().split('T')[0];
      return { label: days[d.getDay()], value: habits.filter(h => h.history?.includes(ds)).length };
    });
  };
  const getMonthlyHabitData = () => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return Array.from({length:6}, (_,i) => {
      const d = new Date(); d.setMonth(d.getMonth()-(5-i));
      const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      return { label: months[d.getMonth()], value: habits.reduce((acc,h) => acc + (h.history?.filter(dt => dt.startsWith(ym)).length || 0), 0) };
    });
  };
  const getCategoryData = () => categories.map(c => ({ label: c.name.length>6?c.name.slice(0,5)+'…':c.name, value: tasks.filter(t => t.category===c.name).length }));

  const taskBarData   = analyticsPeriod==='weekly' ? getWeeklyTaskData()  : getMonthlyTaskData();
  const habitBarData  = analyticsPeriod==='weekly' ? getWeeklyHabitData() : getMonthlyHabitData();

  const done  = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const inProg = tasks.filter(t => t.status === 'in-progress').length;
  const emojis   = ['⭐','💪','📚','🏃','💧','🧘','🎯','🍎','😴','✍️'];
  const pColor   = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' };
  const pEmoji   = { high:'🔴', medium:'🟡', low:'🟢' };
  const sColor   = { todo:CYAN, 'in-progress':'#f59e0b', done:'#10b981' };
  const sEmoji   = { todo:'📌', 'in-progress':'⏳', done:'✅' };

  const card = { background:'rgba(255,255,255,0.035)', borderRadius:16, border:'1px solid rgba(255,255,255,0.07)', padding:'20px 22px', backdropFilter:'blur(10px)' };
  const inp  = { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.04)', border:`1px solid rgba(0,229,255,0.15)`, borderRadius:10, color:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', fontFamily:FONT };
  const sel  = { padding:'10px 14px', background:'#0d1117', border:`1px solid rgba(0,229,255,0.15)`, borderRadius:10, color:'#fff', fontSize:'0.9rem', outline:'none', fontFamily:FONT };
  const btn  = { background:`linear-gradient(135deg,rgba(0,229,255,0.15),rgba(191,95,255,0.25))`, border:`1px solid rgba(0,229,255,0.3)`, borderRadius:10, color:'#fff', padding:'11px 24px', cursor:'pointer', fontWeight:700, fontSize:'0.875rem', fontFamily:FONT, transition:'all 0.2s', boxShadow:`0 0 18px rgba(0,229,255,0.12)` };
  const periodBtn = (p) => ({ padding:'7px 20px', borderRadius:8, border: analyticsPeriod===p?`1px solid rgba(0,229,255,0.4)`:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', fontFamily:FONT, fontWeight:700, fontSize:'0.8rem', background: analyticsPeriod===p?`linear-gradient(135deg,rgba(0,229,255,0.15),rgba(191,95,255,0.2))`:'transparent', color: analyticsPeriod===p?CYAN:'rgba(255,255,255,0.35)', transition:'all 0.2s' });

  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', fontFamily:FONT, color:'#fff', position:'relative', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
        @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{opacity:0.2} 50%{opacity:0.5} }
        * { scrollbar-width:thin; scrollbar-color:rgba(0,229,255,0.15) transparent; box-sizing:border-box; }
        input::placeholder { color:rgba(255,255,255,0.2); }
        select option { background:#0d1117; color:#fff; }
      `}</style>

      <TubesCursor />

      {/* Navbar */}
      <nav style={{ position:'relative', zIndex:10, background:'#0d1117', borderBottom:`1px solid rgba(0,229,255,0.1)`, padding:'0 36px', display:'flex', alignItems:'center', justifyContent:'space-between', height:66, boxShadow:'0 2px 24px rgba(0,0,0,0.5)' }}>
        <span style={{ fontWeight:800, fontSize:'1.45rem', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>⚡ TaskMaster</span>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.9rem', fontFamily:EMOJI }}>Hey, {user.name || 'User'} 👋</span>
          <button onClick={logout} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.5)', padding:'8px 20px', cursor:'pointer', fontFamily:FONT, fontSize:'0.85rem' }}>Logout</button>
        </div>
      </nav>

      <div style={{ position:'relative', zIndex:5, maxWidth:1200, margin:'0 auto', padding:'32px 28px' }}>

        {/* Quote + Clock */}
        {dailyQuote && (
          <div style={{ ...card, marginBottom:28, display:'flex', alignItems:'stretch', minHeight:165, animation:'fadeUp 0.5s ease', padding:0, overflow:'hidden', border:`1px solid rgba(0,229,255,0.1)`, boxShadow:'0 4px 40px rgba(0,0,0,0.35)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:24, padding:'24px 32px', flex:1 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ position:'absolute', inset:-4, borderRadius:20, background:GRAD, opacity:0.3, filter:'blur(10px)', animation:'glowPulse 3s ease-in-out infinite', zIndex:-1 }} />
                <img src={dailyQuote.image_url} alt="" onError={e => e.target.style.display='none'}
                  style={{ width:110, height:130, borderRadius:16, objectFit:'cover', border:`2px solid rgba(0,229,255,0.2)`, display:'block' }} />
              </div>
              <div>
                <p style={{ color:CYAN, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'3px', margin:'0 0 12px', fontWeight:700 }}>{dailyQuote.character}</p>
                <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'1.02rem', fontStyle:'italic', margin:0, lineHeight:1.8, maxWidth:580 }}>"{dailyQuote.quote}"</p>
              </div>
            </div>
            <Clock />
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:30 }}>
          {[
            { label:'TOTAL TASKS', value:total,           icon:'🗒️' },
            { label:'COMPLETED',   value:done,            icon:'✅' },
            { label:'HABITS',      value:habits.length,   icon:'🔥' },
            { label:'CATEGORIES',  value:categories.length, icon:'🗂️' }
          ].map((st, i) => (
            <div key={st.label} style={{ ...card, textAlign:'center', padding:'30px 16px', transition:'all 0.25s', cursor:'default', animation:`fadeUp ${0.25+i*0.07}s ease` }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor=`rgba(0,229,255,0.2)`; e.currentTarget.style.boxShadow=`0 8px 32px rgba(0,229,255,0.07)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.borderColor=''; e.currentTarget.style.boxShadow=''; }}>
              <div style={{ fontSize:'2.4rem', marginBottom:12, fontFamily:EMOJI }}>{st.icon}</div>
              <div style={{ fontSize:'2.3rem', fontWeight:800, lineHeight:1, marginBottom:8, background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{st.value}</div>
              <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.28)', letterSpacing:'2px', fontWeight:700 }}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:26, background:'rgba(255,255,255,0.03)', padding:5, borderRadius:12, border:'1px solid rgba(255,255,255,0.06)', width:'fit-content' }}>
          {[{id:'tasks',label:'📋 Tasks'},{id:'habits',label:'🧡 Habits'},{id:'analytics',label:'📊 Analytics'}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding:'9px 26px', borderRadius:9, border:activeTab===tab.id?`1px solid rgba(0,229,255,0.35)`:'1px solid transparent', cursor:'pointer', fontFamily:FONT, fontWeight:700, fontSize:'0.875rem', transition:'all 0.2s', background:activeTab===tab.id?`linear-gradient(135deg,rgba(0,229,255,0.12),rgba(191,95,255,0.18))`:'transparent', color:activeTab===tab.id?'#fff':'rgba(255,255,255,0.35)', boxShadow:activeTab===tab.id?`0 0 20px rgba(0,229,255,0.1)`:'none' }}>{tab.label}</button>
          ))}
        </div>

        {/* ── TASKS ── */}
        {activeTab === 'tasks' && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
              <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:700 }}><span style={{fontFamily:EMOJI}}>🗒️</span> My Tasks</h2>
              <button onClick={() => setShowAdd(!showAdd)} style={btn}>+ Add Task</button>
            </div>
            {showAdd && (
              <form onSubmit={addTask} style={{ ...card, marginBottom:16, display:'flex', flexDirection:'column', gap:12, border:`1px solid rgba(0,229,255,0.12)` }}>
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
                  <button type="button" onClick={() => setShowAdd(false)} style={{ ...btn, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'none' }}>Cancel</button>
                </div>
              </form>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {tasks.length === 0 && <div style={{ ...card, textAlign:'center', color:'rgba(255,255,255,0.22)', padding:36 }}>No tasks yet — hit + Add Task!</div>}
              {tasks.map(task => (
                <div key={task.id} style={{ ...card, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', transition:'all 0.22s', padding:'18px 22px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=`rgba(0,229,255,0.18)`; e.currentTarget.style.transform='translateX(3px)'; e.currentTarget.style.boxShadow=`0 0 20px rgba(0,229,255,0.05)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
                  <div style={{ flex:1, minWidth:150 }}>
                    <p style={{ margin:'0 0 8px', fontWeight:700, fontSize:'1rem', textDecoration:task.status==='done'?'line-through':'none', color:task.status==='done'?'rgba(255,255,255,0.2)':'#fff' }}>{task.title}</p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.72rem', padding:'3px 12px', borderRadius:20, background:`${pColor[task.priority]}15`, color:pColor[task.priority], fontWeight:700, border:`1px solid ${pColor[task.priority]}35`, fontFamily:EMOJI }}>{pEmoji[task.priority]} {task.priority.charAt(0).toUpperCase()+task.priority.slice(1)}</span>
                      <span style={{ fontSize:'0.72rem', padding:'3px 12px', borderRadius:20, background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.38)', fontWeight:600, border:'1px solid rgba(255,255,255,0.08)', fontFamily:EMOJI }}>💼 {task.category}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:'0.82rem', fontWeight:700, color:sColor[task.status], fontFamily:EMOJI, minWidth:100, textAlign:'right' }}>
                      {sEmoji[task.status]} {task.status==='in-progress'?'In Progress':task.status.charAt(0).toUpperCase()+task.status.slice(1)}
                    </span>
                    <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)} style={{ ...sel, padding:'7px 10px', fontSize:'0.8rem', color:sColor[task.status] }}>
                      <option value="todo">Todo</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    <button onClick={() => deleteTask(task.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#ef4444', padding:'7px 11px', cursor:'pointer', fontFamily:EMOJI, fontSize:'1rem' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HABITS ── */}
        {activeTab === 'habits' && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>
            <h2 style={{ marginBottom:18, fontSize:'1.25rem', fontWeight:700 }}><span style={{fontFamily:EMOJI}}>💪</span> My Habits</h2>
            <div style={{ ...card, marginBottom:16, display:'flex', flexDirection:'column', gap:12, border:`1px solid rgba(0,229,255,0.1)` }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {emojis.map(e => (
                  <button key={e} onClick={() => setHabitEmoji(e)} style={{ background:habitEmoji===e?`rgba(0,229,255,0.12)`:'transparent', border:habitEmoji===e?`1px solid rgba(0,229,255,0.4)`:'1px solid rgba(255,255,255,0.07)', borderRadius:9, padding:'5px 9px', cursor:'pointer', fontSize:'1.45rem', transition:'all 0.2s', fontFamily:EMOJI }}>{e}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <input style={inp} placeholder="New habit name..." value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyPress={e => e.key==='Enter' && addHabit()} />
                <button onClick={addHabit} style={btn}>Add</button>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {habits.length === 0 && <div style={{ ...card, textAlign:'center', color:'rgba(255,255,255,0.22)', padding:36 }}>No habits yet — add one above!</div>}
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
                            <div key={day} style={{ width:28, height:28, borderRadius:7, background:habit.history?.includes(day)?GRAD:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:700, color:habit.history?.includes(day)?'#fff':'rgba(255,255,255,0.28)', boxShadow:habit.history?.includes(day)?`0 0 10px rgba(0,229,255,0.3)`:'none' }}>
                              {new Date(day).getDate()}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ color:'#f59e0b', fontWeight:700, fontFamily:EMOJI }}>🔥 {habit.streak||0}</span>
                        <button onClick={() => toggleHabit(habit.id)} style={{ ...btn, padding:'8px 18px', background:doneToday?'rgba(16,185,129,0.15)':btn.background, border:doneToday?'1px solid rgba(16,185,129,0.35)':btn.border, boxShadow:doneToday?'0 0 15px rgba(16,185,129,0.2)':btn.boxShadow, fontFamily:EMOJI }}>
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

        {/* ── ANALYTICS ── */}
        {activeTab === 'analytics' && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>

            {/* Header + Period Toggle */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22, flexWrap:'wrap', gap:12 }}>
              <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:700 }}><span style={{fontFamily:EMOJI}}>📊</span> Analytics</h2>
              <div style={{ display:'flex', gap:6, background:'rgba(255,255,255,0.03)', padding:4, borderRadius:10, border:'1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={() => setAnalyticsPeriod('weekly')}  style={periodBtn('weekly')}>📅 Weekly</button>
                <button onClick={() => setAnalyticsPeriod('monthly')} style={periodBtn('monthly')}>🗓️ Monthly</button>
              </div>
            </div>

            {/* Summary row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
              {[
                { label:'Tasks Done', value:done, icon:'✅', color:'#10b981' },
                { label:'In Progress', value:inProg, icon:'⏳', color:'#f59e0b' },
                { label:'Habit Check-ins', value:habits.reduce((a,h)=>a+(h.history?.length||0),0), icon:'💪', color:CYAN }
              ].map(s => (
                <div key={s.label} style={{ ...card, display:'flex', alignItems:'center', gap:14, padding:'16px 20px' }}>
                  <span style={{ fontSize:'1.8rem', fontFamily:EMOJI }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize:'1.6rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', letterSpacing:'1px', marginTop:4, fontWeight:600 }}>{s.label.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar charts row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              {/* Tasks bar chart */}
              <div style={{ ...card, border:`1px solid rgba(0,229,255,0.1)` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <h3 style={{ margin:0, fontSize:'0.95rem', color:CYAN, fontFamily:EMOJI }}>📋 Tasks Created</h3>
                  <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.25)', fontWeight:600 }}>{analyticsPeriod==='weekly'?'Last 7 days':'Last 4 weeks'}</span>
                </div>
                <BarChart data={taskBarData} />
              </div>
              {/* Habits bar chart */}
              <div style={{ ...card, border:`1px solid rgba(191,95,255,0.1)` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <h3 style={{ margin:0, fontSize:'0.95rem', color:PURP, fontFamily:EMOJI }}>💪 Habit Check-ins</h3>
                  <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.25)', fontWeight:600 }}>{analyticsPeriod==='weekly'?'Last 7 days':'Last 6 months'}</span>
                </div>
                <BarChart data={analyticsPeriod==='weekly'?habitBarData:getMonthlyHabitData()} colorFn={() => `linear-gradient(180deg,${PURP},rgba(191,95,255,0.4))`} />
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>

              {/* Donut */}
              <div style={card}>
                <h3 style={{ margin:'0 0 14px', fontSize:'0.95rem', color:CYAN, fontFamily:EMOJI }}>✅ Completion Rate</h3>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                  <div style={{ position:'relative', width:120, height:120 }}>
                    <svg viewBox="0 0 120 120" width="120" height="120" style={{ transform:'rotate(-90deg)' }}>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"/>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="url(#cg)" strokeWidth="12"
                        strokeDasharray={`${total>0?(done/total)*314:0} 314`} strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={CYAN}/><stop offset="100%" stopColor={PURP}/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'1.3rem', fontWeight:800, background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                      {total>0?Math.round((done/total)*100):0}%
                    </div>
                  </div>
                  <p style={{ color:'rgba(255,255,255,0.28)', fontSize:'0.8rem', margin:0 }}>{done} of {total} done</p>
                </div>
              </div>

              {/* Priority bars */}
              <div style={card}>
                <h3 style={{ margin:'0 0 14px', fontSize:'0.95rem', color:CYAN, fontFamily:EMOJI }}>📌 By Priority</h3>
                {['high','medium','low'].map(p => {
                  const count = tasks.filter(t => t.priority===p).length;
                  return (
                    <div key={p} style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:'0.82rem', color:pColor[p], fontFamily:EMOJI }}>{pEmoji[p]} {p.charAt(0).toUpperCase()+p.slice(1)}</span>
                        <span style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.4)', fontWeight:700 }}>{count}</span>
                      </div>
                      <div style={{ height:7, background:'rgba(255,255,255,0.05)', borderRadius:4 }}>
                        <div style={{ height:'100%', width:`${total>0?(count/total)*100:0}%`, background:`linear-gradient(90deg,${pColor[p]},${CYAN})`, borderRadius:4, transition:'width 0.6s', boxShadow:`0 0 8px ${pColor[p]}55` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Habit streaks */}
              <div style={card}>
                <h3 style={{ margin:'0 0 14px', fontSize:'0.95rem', color:CYAN, fontFamily:EMOJI }}>🔥 Habit Streaks</h3>
                {habits.length===0 && <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.875rem' }}>No habits yet</p>}
                {habits.slice(0,5).map(h => (
                  <div key={h.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <span style={{ fontFamily:EMOJI, fontSize:'1.1rem' }}>{h.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ fontSize:'0.82rem' }}>{h.name}</span>
                        <span style={{ color:'#f59e0b', fontWeight:700, fontFamily:EMOJI, fontSize:'0.82rem' }}>🔥{h.streak||0}</span>
                      </div>
                      <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:2 }}>
                        <div style={{ height:'100%', width:`${Math.min((h.streak||0)/30*100,100)}%`, background:GRAD, borderRadius:2, boxShadow:`0 0 6px rgba(0,229,255,0.3)` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Category breakdown bar chart */}
            {categories.length > 0 && (
              <div style={{ ...card, marginTop:16, border:`1px solid rgba(0,229,255,0.08)` }}>
                <h3 style={{ margin:'0 0 4px', fontSize:'0.95rem', color:CYAN, fontFamily:EMOJI }}>🗂️ Tasks by Category</h3>
                <BarChart
                  data={getCategoryData()}
                  colorFn={i => `linear-gradient(180deg,hsl(${180+i*30},100%,60%),hsl(${180+i*30},80%,30%))`}
                />
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
