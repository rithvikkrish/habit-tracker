import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({ baseURL: BACKEND_URL });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

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

  const fetchTasks = async () => {
    try { const r = await api.get('/api/tasks'); setTasks(r.data); } catch {}
  };
  const fetchCategories = async () => {
    try { const r = await api.get('/api/categories'); setCategories(r.data); } catch {}
  };
  const fetchDailyQuote = async () => {
    try { const r = await api.get('/api/daily-quote'); setDailyQuote(r.data); } catch {}
  };

  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchDailyQuote();
    const interval = setInterval(fetchDailyQuote, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = () => { localStorage.clear(); window.location.href = '/auth'; };

  const addTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/tasks', newTask);
      setNewTask({ title: '', description: '', category: 'Work', priority: 'medium', status: 'todo' });
      setShowAddTask(false);
      fetchTasks();
    } catch {}
  };

  const updateTaskStatus = async (taskId, status) => {
    try { await api.put(`/api/tasks/${taskId}`, { status }); fetchTasks(); } catch {}
  };

  const deleteTask = async (taskId) => {
    try { await api.delete(`/api/tasks/${taskId}`); fetchTasks(); } catch {}
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const habit = { id: Date.now(), name: newHabit, emoji: habitEmoji, streak: 0, history: [] };
    const updated = [...habits, habit];
    setHabits(updated);
    localStorage.setItem('habits', JSON.stringify(updated));
    setNewHabit('');
  };

  const toggleHabitToday = (id) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const done = h.history.includes(today);
      const history = done ? h.history.filter(d => d !== today) : [...h.history, today];
      const streak = calculateStreak(history);
      return { ...h, history, streak };
    });
    setHabits(updated);
    localStorage.setItem('habits', JSON.stringify(updated));
  };

  const calculateStreak = (history) => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (history.includes(d.toISOString().split('T')[0])) streak++;
      else break;
    }
    return streak;
  };

  const deleteHabit = (id) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    localStorage.setItem('habits', JSON.stringify(updated));
  };

  const getLast7Days = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
  };

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;

  const s = {
    app: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', fontFamily: "'Outfit', sans-serif", color: '#fff' },
    navbar: { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' },
    main: { maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' },
    card: { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '20px' },
    btn: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', padding: '10px 20px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
    input: { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
    select: { padding: '10px 14px', background: 'rgba(30,27,75,0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', outline: 'none' },
  };

  const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  const statusColor = { todo: '#6366f1', 'in-progress': '#f59e0b', done: '#10b981' };
  const emojis = ['⭐', '💪', '📚', '🏃', '💧', '🧘', '🎯', '🍎', '😴', '✍️'];

  return (
    <div style={s.app}>
      {/* Navbar */}
      <nav style={s.navbar}>
        <span style={{ fontWeight: '800', fontSize: '1.2rem', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          TaskMaster
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Hey, {user.name || 'User'} 👋</span>
          <button onClick={logout} style={{ ...s.btn, background: 'rgba(255,255,255,0.08)', padding: '8px 16px', fontSize: '0.8rem' }}>Logout</button>
        </div>
      </nav>

      <div style={s.main}>
        {/* Quote Card */}
        {dailyQuote && (
          <div style={{ ...s.card, marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <img
              src={dailyQuote.image_url}
              alt={dailyQuote.character}
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(99,102,241,0.5)', flexShrink: 0 }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>{dailyQuote.character}</p>
              <p style={{ color: '#fff', fontSize: '1rem', fontStyle: 'italic', margin: 0, lineHeight: '1.6' }}>"{dailyQuote.quote}"</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Tasks', value: totalTasks, icon: '📋' },
            { label: 'Completed', value: completedTasks, icon: '✅' },
            { label: 'Habits', value: habits.length, icon: '🔥' },
            { label: 'Categories', value: categories.length, icon: '🗂️' },
          ].map(stat => (
            <div key={stat.label} style={{ ...s.card, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#a78bfa' }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['tasks', 'habits', 'analytics'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', textTransform: 'capitalize',
              background: activeTab === tab ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
              color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)',
            }}>{tab}</button>
          ))}
        </div>

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>My Tasks</h2>
              <button onClick={() => setShowAddTask(!showAddTask)} style={s.btn}>+ Add Task</button>
            </div>

            {showAddTask && (
              <form onSubmit={addTask} style={{ ...s.card, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input style={s.input} placeholder="Task title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required />
                <input style={s.input} placeholder="Description (optional)" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <select style={s.select} value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <select style={s.select} value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={s.btn}>Add Task</button>
                  <button type="button" onClick={() => setShowAddTask(false)} style={{ ...s.btn, background: 'rgba(255,255,255,0.08)' }}>Cancel</button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.length === 0 && <div style={{ ...s.card, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No tasks yet! Add your first task above.</div>}
              {tasks.map(task => (
                <div key={task.id} style={{ ...s.card, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <p style={{ margin: '0 0 4px', fontWeight: '600', textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'rgba(255,255,255,0.3)' : '#fff' }}>{task.title}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: `${priorityColor[task.priority]}22`, color: priorityColor[task.priority] }}>{task.priority}</span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{task.category}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={task.status}
                      onChange={e => updateTaskStatus(task.id, e.target.value)}
                      style={{ ...s.select, padding: '6px 10px', fontSize: '0.8rem', color: statusColor[task.status] }}
                    >
                      <option value="todo">Todo</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    <button onClick={() => deleteTask(task.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '8px', color: '#ef4444', padding: '6px 10px', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HABITS TAB */}
        {activeTab === 'habits' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>My Habits</h2>
            <div style={{ ...s.card, marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {emojis.map(e => (
                  <button key={e} onClick={() => setHabitEmoji(e)} style={{ background: habitEmoji === e ? 'rgba(99,102,241,0.3)' : 'transparent', border: habitEmoji === e ? '1px solid #6366f1' : '1px solid transparent', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '1.2rem' }}>{e}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '200px' }}>
                <input style={{ ...s.input }} placeholder="New habit name..." value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyPress={e => e.key === 'Enter' && addHabit()} />
                <button onClick={addHabit} style={s.btn}>Add</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {habits.length === 0 && <div style={{ ...s.card, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No habits yet! Add your first habit above.</div>}
              {habits.map(habit => {
                const today = new Date().toISOString().split('T')[0];
                const doneToday = habit.history?.includes(today);
                const last7 = getLast7Days();
                return (
                  <div key={habit.id} style={s.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.8rem' }}>{habit.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 6px', fontWeight: '600' }}>{habit.name}</p>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {last7.map(day => (
                            <div key={day} style={{ width: '24px', height: '24px', borderRadius: '6px', background: habit.history?.includes(day) ? '#6366f1' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
                              {new Date(day).getDate()}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#f59e0b', fontWeight: '700' }}>🔥 {habit.streak || 0}</span>
                        <button onClick={() => toggleHabitToday(habit.id)} style={{ ...s.btn, background: doneToday ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '8px 14px' }}>
                          {doneToday ? '✓ Done' : 'Mark Done'}
                        </button>
                        <button onClick={() => deleteHabit(habit.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '8px', color: '#ef4444', padding: '8px 10px', cursor: 'pointer' }}>🗑️</button>
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
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={s.card}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>Task Completion</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#6366f1" strokeWidth="12"
                        strokeDasharray={`${totalTasks > 0 ? (completedTasks / totalTasks) * 314 : 0} 314`} strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</div>
                    </div>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: 0 }}>{completedTasks} of {totalTasks} tasks done</p>
                </div>
              </div>

              <div style={s.card}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>Habit Streaks</h3>
                {habits.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>No habits tracked yet</p>}
                {habits.map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span>{h.emoji}</span>
                    <span style={{ flex: 1, fontSize: '0.875rem' }}>{h.name}</span>
                    <span style={{ color: '#f59e0b', fontWeight: '700' }}>🔥 {h.streak || 0}</span>
                  </div>
                ))}
              </div>

              <div style={s.card}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>Tasks by Priority</h3>
                {['high', 'medium', 'low'].map(p => {
                  const count = tasks.filter(t => t.priority === p).length;
                  return (
                    <div key={p} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.875rem', textTransform: 'capitalize', color: priorityColor[p] }}>{p}</span>
                        <span style={{ fontSize: '0.875rem' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: `${totalTasks > 0 ? (count / totalTasks) * 100 : 0}%`, background: priorityColor[p], borderRadius: '3px', transition: 'width 0.3s' }} />
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
