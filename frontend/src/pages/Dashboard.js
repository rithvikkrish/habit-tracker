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
const FONT  = `'Outfit',${EMOJI}`;
const CYAN  = '#00e5ff';
const PURP  = '#bf5fff';
const GRAD  = `linear-gradient(90deg,${CYAN},${PURP})`;

function AuthStyleBG() {
  const cvRef = useRef(null);
  useEffect(()=>{
    const cv=cvRef.current; const ctx=cv.getContext('2d'); let aid;
    const resize=()=>{ cv.width=window.innerWidth; cv.height=window.innerHeight; };
    resize(); window.addEventListener('resize',resize);
    const stars=Array.from({length:200},()=>({
      x:Math.random()*cv.width, y:Math.random()*cv.height,
      r:Math.random()*1.9+0.3,
      color:['#ffffff','#c4b5fd','#93c5fd','#67e8f9','#e0e7ff','#a5b4fc'][Math.floor(Math.random()*6)],
      tw:Math.random()*Math.PI*2, sp:Math.random()*0.008+0.003,
      pulse:Math.random()>0.6
    }));
    let shooters=[];
    const spawn=()=>shooters.push({x:Math.random()*cv.width*0.7,y:Math.random()*cv.height*0.4,len:100+Math.random()*80,op:1,spd:6+Math.random()*4,a:Math.PI/4+(Math.random()-0.5)*0.3,color:Math.random()>0.5?CYAN:PURP});
    const fontSize=13;
    let drops=Array(Math.floor(cv.width/fontSize)).fill(0).map(()=>Math.random()*50);
    const chars='アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF';
    let frame=0;
    const draw=()=>{
      frame++;
      ctx.fillStyle='rgba(8,10,28,0.14)';ctx.fillRect(0,0,cv.width,cv.height);
      [{x:0.15,y:0.25,r:280,c:'rgba(99,102,241,0.05)'},{x:0.85,y:0.75,r:320,c:'rgba(139,92,246,0.04)'},{x:0.5,y:0.5,r:220,c:'rgba(6,182,212,0.03)'}].forEach(n=>{const g=ctx.createRadialGradient(n.x*cv.width,n.y*cv.height,0,n.x*cv.width,n.y*cv.height,n.r);g.addColorStop(0,n.c);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,cv.width,cv.height);});
      stars.forEach(s=>{s.tw+=s.sp;const op=s.pulse?0.15+0.85*(0.5+0.5*Math.sin(s.tw)):0.35+0.45*(0.5+0.5*Math.sin(s.tw));ctx.save();ctx.globalAlpha=op;ctx.shadowBlur=s.pulse?10:3;ctx.shadowColor=s.color;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();if(s.pulse&&op>0.75){ctx.globalAlpha=op*0.35;ctx.strokeStyle=s.color;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(s.x-s.r*4,s.y);ctx.lineTo(s.x+s.r*4,s.y);ctx.moveTo(s.x,s.y-s.r*4);ctx.lineTo(s.x,s.y+s.r*4);ctx.stroke();}ctx.restore();});
      if(frame%220===0)spawn();
      shooters=shooters.filter(s=>s.op>0);
      shooters.forEach(s=>{ctx.save();ctx.globalAlpha=s.op;const g=ctx.createLinearGradient(s.x,s.y,s.x-Math.cos(s.a)*s.len,s.y-Math.sin(s.a)*s.len);g.addColorStop(0,s.color);g.addColorStop(1,'transparent');ctx.strokeStyle=g;ctx.lineWidth=1.5;ctx.shadowBlur=10;ctx.shadowColor=s.color;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-Math.cos(s.a)*s.len,s.y-Math.sin(s.a)*s.len);ctx.stroke();ctx.restore();s.x+=s.spd;s.y+=s.spd;s.op-=0.018;});
      if(frame%9===0){const cols=Math.floor(cv.width/fontSize);if(drops.length!==cols)drops=Array(cols).fill(0).map(()=>Math.random()*50);ctx.font=`${fontSize}px monospace`;for(let i=0;i<cols;i++){const ch=chars[Math.floor(Math.random()*chars.length)];const op=0.05+Math.random()*0.09;ctx.fillStyle=`rgba(0,229,255,${op})`;ctx.shadowBlur=3;ctx.shadowColor=CYAN;ctx.fillText(ch,i*fontSize,drops[i]*fontSize);if(drops[i]*fontSize>cv.height&&Math.random()>0.975)drops[i]=0;drops[i]+=0.38;}ctx.shadowBlur=0;}
      aid=requestAnimationFrame(draw);
    };
    draw();
    return()=>{window.removeEventListener('resize',resize);cancelAnimationFrame(aid);};
  },[]);
  return <canvas ref={cvRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}}/>;
}

function Confetti({active,onDone}) {
  const cvRef=useRef(null);
  useEffect(()=>{
    if(!active)return;
    const cv=cvRef.current;const ctx=cv.getContext('2d');
    cv.width=window.innerWidth;cv.height=window.innerHeight;
    const p=Array.from({length:80},()=>({x:Math.random()*cv.width,y:-10,vx:(Math.random()-0.5)*6,vy:Math.random()*4+2,color:[CYAN,PURP,'#10b981','#f59e0b','#fff'][Math.floor(Math.random()*5)],r:Math.random()*5+2,life:1}));
    let aid;
    const draw=()=>{ctx.clearRect(0,0,cv.width,cv.height);let alive=false;p.forEach(pt=>{pt.x+=pt.vx;pt.y+=pt.vy;pt.life-=0.015;pt.vy+=0.1;if(pt.life>0){alive=true;ctx.save();ctx.globalAlpha=pt.life;ctx.fillStyle=pt.color;ctx.shadowBlur=6;ctx.shadowColor=pt.color;ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r,0,Math.PI*2);ctx.fill();ctx.restore();}});if(alive)aid=requestAnimationFrame(draw);else onDone();};
    draw();return()=>cancelAnimationFrame(aid);
  },[active]);
  return <canvas ref={cvRef} style={{position:'fixed',inset:0,zIndex:99998,pointerEvents:'none',display:active?'block':'none'}}/>;
}

function Clock() {
  const [t,setT]=useState({time:'',ampm:'',date:''});
  useEffect(()=>{
    const tick=()=>{const n=new Date();let h=n.getHours();const ap=h>=12?'PM':'AM';h=h%12||12;const days=['SUN','MON','TUE','WED','THU','FRI','SAT'],months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];setT({time:`${h}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`,ampm:ap,date:`${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}`});};
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);
  return (
    <div style={{minWidth:240,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 36px',borderLeft:'1px solid rgba(255,255,255,0.06)',background:'rgba(0,0,0,0.22)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:190,height:190,borderRadius:'50%',border:`1px solid rgba(0,229,255,0.07)`,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>
      <div style={{position:'absolute',width:140,height:140,borderRadius:'50%',border:`1px solid rgba(191,95,255,0.06)`,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>
      <div style={{display:'flex',alignItems:'flex-start',gap:6,position:'relative',zIndex:1}}>
        <span style={{fontSize:'clamp(1.6rem,3vw,2.8rem)',fontWeight:800,fontVariantNumeric:'tabular-nums',lineHeight:1,letterSpacing:1,background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{t.time}</span>
        <span style={{fontSize:'0.95rem',fontWeight:800,color:CYAN,marginTop:7,letterSpacing:1}}>{t.ampm}</span>
      </div>
      <div style={{fontSize:'0.68rem',fontWeight:700,color:'rgba(0,200,230,0.55)',letterSpacing:'2px',marginTop:7,position:'relative',zIndex:1}}>{t.date}</div>
    </div>
  );
}

function BarChart({data,colorFn}) {
  const max=Math.max(...data.map(d=>d.value),1);
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:5,height:85,marginTop:10}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
          <span style={{fontSize:'0.58rem',color:CYAN,fontWeight:700}}>{d.value||''}</span>
          <div style={{width:'100%',borderRadius:'4px 4px 0 0',background:colorFn?colorFn(i):GRAD,height:`${Math.max((d.value/max)*65,d.value>0?4:0)}px`,transition:'height 0.5s',boxShadow:d.value>0?`0 0 8px rgba(0,229,255,0.3)`:'none',minHeight:d.value>0?4:0}}/>
          <span style={{fontSize:'0.58rem',color:'rgba(255,255,255,0.3)',fontWeight:600,textAlign:'center',lineHeight:1.2}}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function HabitHeatmap({history}) {
  const weeks=18,days=weeks*7;
  const cells=Array.from({length:days},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(days-1-i));return{date:d.toISOString().split('T')[0],done:history?.includes(d.toISOString().split('T')[0])};});
  const dayL=['S','M','T','W','T','F','S'];
  return (
    <div style={{overflowX:'auto',paddingBottom:4}}>
      <div style={{display:'flex',gap:2}}>
        <div style={{display:'flex',flexDirection:'column',gap:2,marginRight:4}}>
          {dayL.map((l,i)=><div key={i} style={{height:12,width:10,fontSize:'0.5rem',color:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center'}}>{i%2===1?l:''}</div>)}
        </div>
        {Array.from({length:weeks},(_,w)=>(
          <div key={w} style={{display:'flex',flexDirection:'column',gap:2}}>
            {cells.slice(w*7,(w+1)*7).map((c,d)=>(
              <div key={d} title={c.date} style={{width:12,height:12,borderRadius:2,background:c.done?GRAD:'rgba(255,255,255,0.06)',boxShadow:c.done?`0 0 5px rgba(0,229,255,0.4)`:'none',transition:'all 0.2s'}}/>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [user]=useState(()=>JSON.parse(localStorage.getItem('user')||'{}'));
  const [tasks,setTasks]=useState([]);
  const [categories,setCategories]=useState([]);
  const [dailyQuote,setDailyQuote]=useState(null);
  const [activeTab,setActiveTab]=useState('tasks');
  const [analyticsPeriod,setAnalyticsPeriod]=useState('weekly');
  const [showAdd,setShowAdd]=useState(false);
  const [newTask,setNewTask]=useState({title:'',description:'',category:'Work',priority:'medium',status:'todo',due_date:''});
  const [editTask,setEditTask]=useState(null);
  const [searchQ,setSearchQ]=useState('');
  const [filterCat,setFilterCat]=useState('all');
  const [filterPri,setFilterPri]=useState('all');
  const [expandedTask,setExpandedTask]=useState(null);
  const [confetti,setConfetti]=useState(false);
  const [habits,setHabits]=useState([]);
  const [newHabit,setNewHabit]=useState('');
  const [habitEmoji,setHabitEmoji]=useState('⭐');
  const [editHabit,setEditHabit]=useState(null);
  const [habitsLoading,setHabitsLoading]=useState(false);
  const [expandedHabit,setExpandedHabit]=useState(null);
  const [showAddCat,setShowAddCat]=useState(false);
  const [newCatName,setNewCatName]=useState('');
  const [newCatColor,setNewCatColor]=useState('#00e5ff');
  const [notifEnabled,setNotifEnabled]=useState(false);
  const [loading,setLoading]=useState(true);
  const [showProfileMenu,setShowProfileMenu]=useState(false);

  const fetchTasks=async()=>{try{const r=await api.get('/api/tasks');setTasks(r.data);}catch{}};
  const fetchCategories=async()=>{try{const r=await api.get('/api/categories');setCategories(r.data);}catch{}};
  const fetchQuote=async()=>{try{const r=await api.get('/api/daily-quote');setDailyQuote(r.data);}catch{}};
  const fetchHabits=async()=>{setHabitsLoading(true);try{const r=await api.get('/api/habits');setHabits(r.data);}catch{}setHabitsLoading(false);};

  useEffect(()=>{
    const init=async()=>{
      setLoading(true);
      await Promise.all([fetchTasks(),fetchCategories(),fetchQuote(),fetchHabits()]);
      setLoading(false);
    };
    init();
    const id=setInterval(fetchQuote,3600000);
    if('Notification' in window&&Notification.permission==='granted')setNotifEnabled(true);
    return()=>clearInterval(id);
  },[]); // eslint-disable-line

  useEffect(()=>{
    if(!notifEnabled)return;
    habits.forEach(h=>{
      const today=new Date().toISOString().split('T')[0];
      const yesterday=new Date(Date.now()-86400000).toISOString().split('T')[0];
      if(h.streak>0&&!h.history?.includes(today)&&h.history?.includes(yesterday)){
        new Notification(`⚠️ Streak at risk!`,{body:`Mark "${h.name}" done today or lose your 🔥${h.streak} streak!`,icon:'/favicon.ico'});
      }
    });
  },[habits,notifEnabled]);

  const enableNotifications=async()=>{
    if(!('Notification' in window)){alert('Browser does not support notifications');return;}
    const perm=await Notification.requestPermission();
    if(perm==='granted'){setNotifEnabled(true);new Notification('🔔 TaskMaster',{body:'Streak reminders enabled!'});}
  };

  const logout=()=>{localStorage.clear();window.location.href='/auth';};

  const addTask=async(e)=>{e.preventDefault();try{await api.post('/api/tasks',{...newTask,due_date:newTask.due_date||null});setNewTask({title:'',description:'',category:'Work',priority:'medium',status:'todo',due_date:''});setShowAdd(false);fetchTasks();}catch{}};
  const saveEditTask=async(e)=>{e.preventDefault();try{await api.put(`/api/tasks/${editTask.id}`,editTask);setEditTask(null);fetchTasks();}catch{}};
  const updateStatus=async(id,status)=>{if(status==='done')setConfetti(true);try{await api.put(`/api/tasks/${id}`,{status});fetchTasks();}catch{}};
  const deleteTask=async(id)=>{try{await api.delete(`/api/tasks/${id}`);fetchTasks();}catch{}};

  const addHabit=async()=>{if(!newHabit.trim())return;try{await api.post('/api/habits',{name:newHabit,emoji:habitEmoji});setNewHabit('');fetchHabits();}catch{}};
  const toggleHabit=async(id)=>{const today=new Date().toISOString().split('T')[0];try{await api.put(`/api/habits/${id}/toggle`,{date:today});fetchHabits();}catch{}};
  const deleteHabit=async(id)=>{try{await api.delete(`/api/habits/${id}`);fetchHabits();}catch{}};
  const saveEditHabit=async()=>{if(!editHabit)return;try{await api.put(`/api/habits/${editHabit.id}/edit`,{name:editHabit.name,emoji:editHabit.emoji});fetchHabits();setEditHabit(null);}catch{setEditHabit(null);}};
  const addCategory=async()=>{if(!newCatName.trim())return;try{await api.post('/api/categories',{name:newCatName,color:newCatColor});setNewCatName('');setShowAddCat(false);fetchCategories();}catch{}};

  const getLast7=()=>Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().split('T')[0];});

  const filteredTasks=tasks.filter(t=>{
    const matchQ=!searchQ||t.title.toLowerCase().includes(searchQ.toLowerCase());
    const matchCat=filterCat==='all'||t.category===filterCat;
    const matchPri=filterPri==='all'||t.priority===filterPri;
    return matchQ&&matchCat&&matchPri;
  });

  const getDueBadge=due=>{
    if(!due)return null;
    const today=new Date();today.setHours(0,0,0,0);
    const dueD=new Date(due);dueD.setHours(0,0,0,0);
    const diff=Math.round((dueD-today)/(1000*60*60*24));
    if(diff<0)return{label:'Overdue',color:'#ef4444'};
    if(diff===0)return{label:'Due Today',color:'#f59e0b'};
    if(diff===1)return{label:'Due Tomorrow',color:'#f59e0b'};
    return{label:`Due in ${diff}d`,color:'rgba(255,255,255,0.4)'};
  };

  const getWeeklyTaskData=()=>{const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const ds=d.toISOString().split('T')[0];return{label:days[d.getDay()],value:tasks.filter(t=>t.created_at&&t.created_at.startsWith(ds)).length};});};
  const getMonthlyTaskData=()=>Array.from({length:4},(_,i)=>{const s=new Date();s.setDate(s.getDate()-(3-i)*7);const e=new Date();e.setDate(e.getDate()-(2-i)*7);return{label:`W${i+1}`,value:tasks.filter(t=>{if(!t.created_at)return false;const cd=new Date(t.created_at);return cd>=s&&cd<e;}).length};});
  const getWeeklyHabitData=()=>{const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const ds=d.toISOString().split('T')[0];return{label:days[d.getDay()],value:habits.filter(h=>h.history?.includes(ds)).length};});};
  const getMonthlyHabitData=()=>{const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-(5-i));const ym=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return{label:months[d.getMonth()],value:habits.reduce((a,h)=>a+(h.history?.filter(dt=>dt.startsWith(ym)).length||0),0)};});};
  const getCategoryData=()=>categories.map(c=>({label:c.name.length>6?c.name.slice(0,5)+'…':c.name,value:tasks.filter(t=>t.category===c.name).length}));

  const taskBarData=analyticsPeriod==='weekly'?getWeeklyTaskData():getMonthlyTaskData();
  const habitBarData=analyticsPeriod==='weekly'?getWeeklyHabitData():getMonthlyHabitData();
  const done=tasks.filter(t=>t.status==='done').length;
  const total=tasks.length;
  const inProg=tasks.filter(t=>t.status==='in-progress').length;

  const emojis=['⭐','💪','📚','🏃','💧','🧘','🎯','🍎','😴','✍️','🏋️','🧠','🎵','🌿','☀️'];
  const pColor={high:'#ef4444',medium:'#f59e0b',low:'#10b981'};
  const pEmoji={high:'🔴',medium:'🟡',low:'🟢'};
  const sColor={todo:CYAN,'in-progress':'#f59e0b',done:'#10b981'};
  const sEmoji={todo:'📌','in-progress':'⏳',done:'✅'};
  const catColors=['#00e5ff','#bf5fff','#10b981','#f59e0b','#ef4444','#06b6d4','#a855f7','#ec4899'];

  const card={background:'rgba(10,12,30,0.78)',borderRadius:16,border:'1px solid rgba(99,102,241,0.15)',padding:'20px 22px',backdropFilter:'blur(14px)'};
  const inp={width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.04)',border:`1px solid rgba(99,102,241,0.2)`,borderRadius:10,color:'#fff',fontSize:'0.9rem',outline:'none',boxSizing:'border-box',fontFamily:FONT};
  const sel={padding:'10px 14px',background:'rgba(8,10,28,0.95)',border:`1px solid rgba(99,102,241,0.2)`,borderRadius:10,color:'#fff',fontSize:'0.9rem',outline:'none',fontFamily:FONT};
  const btn={background:`linear-gradient(135deg,rgba(0,229,255,0.15),rgba(191,95,255,0.28))`,border:`1px solid rgba(0,229,255,0.32)`,borderRadius:10,color:'#fff',padding:'11px 24px',cursor:'pointer',fontWeight:700,fontSize:'0.875rem',fontFamily:FONT,transition:'all 0.2s',boxShadow:`0 0 18px rgba(0,229,255,0.1)`};
  const periodBtn=p=>({padding:'7px 18px',borderRadius:8,border:analyticsPeriod===p?`1px solid rgba(0,229,255,0.4)`:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',fontFamily:FONT,fontWeight:700,fontSize:'0.8rem',background:analyticsPeriod===p?`linear-gradient(135deg,rgba(0,229,255,0.15),rgba(191,95,255,0.2))`:'transparent',color:analyticsPeriod===p?CYAN:'rgba(255,255,255,0.35)',transition:'all 0.2s'});

  const Avatar=({size=32})=>(
    <div style={{width:size,height:size,borderRadius:'50%',background:GRAD,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,overflow:'hidden',boxShadow:`0 0 10px rgba(99,102,241,0.35)`,flexShrink:0,fontSize:size*0.4}}>
      {user.profile_pic?<img src={user.profile_pic} alt="av" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{color:'#fff'}}>{(user.name||'U').charAt(0).toUpperCase()}</span>}
    </div>
  );

  const MenuItem=({icon,label,sub,color,onClick})=>(
    <button onClick={onClick} style={{width:'100%',padding:'10px 18px',display:'flex',alignItems:'center',gap:12,background:'transparent',border:'none',color:color||'rgba(255,255,255,0.72)',cursor:'pointer',fontFamily:FONT,fontSize:'0.875rem',fontWeight:500,textAlign:'left',transition:'all 0.15s'}}
      onMouseEnter={e=>{e.currentTarget.style.background=color?'rgba(239,68,68,0.1)':'rgba(99,102,241,0.12)';e.currentTarget.style.color=color||'#fff';}}
      onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=color||'rgba(255,255,255,0.72)';}}>
      <span style={{fontSize:'1rem',width:20,textAlign:'center',flexShrink:0}}>{icon}</span>
      <div><div>{label}</div>{sub&&<div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.3)',marginTop:1}}>{sub}</div>}</div>
    </button>
  );

  if(loading){
    return(
      <div style={{minHeight:'100vh',background:'#08091c',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:FONT}}>
        <AuthStyleBG/>
        <div style={{position:'relative',zIndex:5,textAlign:'center'}}>
          <div style={{fontSize:'3rem',marginBottom:16}}>⚡</div>
          <div style={{fontSize:'1.5rem',fontWeight:800,background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:14}}>TaskMaster</div>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:14}}>
            {[0,1,2].map(i=>(<div key={i} style={{width:10,height:10,borderRadius:'50%',background:GRAD,animation:`loadBounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>))}
          </div>
          <div style={{color:'rgba(255,255,255,0.35)',fontSize:'0.85rem'}}>Loading your workspace...</div>
        </div>
        <style>{`@keyframes loadBounce{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-13px);opacity:1}}`}</style>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:'#08091c',fontFamily:FONT,color:'#fff',position:'relative',overflowX:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{opacity:0.2}50%{opacity:0.5}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes loadBounce{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-13px);opacity:1}}
        *{scrollbar-width:thin;scrollbar-color:rgba(99,102,241,0.2) transparent;box-sizing:border-box;}
        input::placeholder{color:rgba(255,255,255,0.2);}
        select option{background:#08091c;color:#fff;}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1) opacity(0.4);}
        textarea{resize:vertical;}
        .dash-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;}
        .dash-quote{display:flex;align-items:stretch;min-height:155px;}
        .dash-tabs{display:flex;gap:4px;margin-bottom:24px;background:rgba(10,12,30,0.7);padding:5px;border-radius:12px;border:1px solid rgba(99,102,241,0.12);width:fit-content;overflow-x:auto;max-width:100%;}
        .dash-filters{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}
        .dash-task-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
        .dash-task-actions{display:flex;gap:8px;align-items:center;}
        .dash-analytics-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
        .dash-analytics-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
        .dash-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;}
        @media(max-width:768px){
          .dash-stats{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
          .dash-quote{flex-direction:column!important;}
          .dash-tabs{width:100%!important;}
          .dash-filters{flex-direction:column!important;}
          .dash-task-row{flex-direction:column!important;align-items:flex-start!important;}
          .dash-task-actions{width:100%!important;justify-content:flex-end!important;flex-wrap:wrap!important;}
          .dash-analytics-3{grid-template-columns:1fr!important;}
          .dash-analytics-2{grid-template-columns:1fr!important;}
          .dash-cat-grid{grid-template-columns:repeat(2,1fr)!important;}
          .dash-main{padding:16px 14px!important;}
          .dash-nav{padding:0 16px!important;height:56px!important;}
        }
        @media(max-width:480px){
          .dash-stats{grid-template-columns:repeat(2,1fr)!important;}
          .dash-analytics-3{grid-template-columns:1fr!important;}
          .dash-cat-grid{grid-template-columns:1fr 1fr!important;}
        }
      `}</style>

      <AuthStyleBG/>
      <Confetti active={confetti} onDone={()=>setConfetti(false)}/>

      {/* ── Navbar ── */}
      <nav className="dash-nav" style={{position:'relative',zIndex:10,background:'rgba(8,10,28,0.92)',backdropFilter:'blur(20px)',borderBottom:`1px solid rgba(99,102,241,0.15)`,padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64,boxShadow:'0 2px 24px rgba(0,0,0,0.6)'}}>
        <span style={{fontWeight:800,fontSize:'clamp(1.1rem,2.5vw,1.4rem)',background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>⚡ TaskMaster</span>

        {/* Profile dropdown */}
        <div style={{position:'relative'}}>
          <button onClick={()=>setShowProfileMenu(!showProfileMenu)}
            style={{display:'flex',alignItems:'center',gap:9,background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:24,padding:'5px 14px 5px 5px',cursor:'pointer',transition:'all 0.2s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(99,102,241,0.45)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(99,102,241,0.2)'}>
            <Avatar size={32}/>
            <span style={{color:'rgba(255,255,255,0.78)',fontSize:'0.85rem',fontFamily:FONT,fontWeight:600,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name||'User'}</span>
            <span style={{color:'rgba(255,255,255,0.35)',fontSize:'0.7rem',display:'inline-block',transition:'transform 0.2s',transform:showProfileMenu?'rotate(180deg)':'none'}}>▼</span>
          </button>

          {showProfileMenu&&(
            <>
              <div onClick={()=>setShowProfileMenu(false)} style={{position:'fixed',inset:0,zIndex:19}}/>
              <div style={{position:'absolute',top:'calc(100% + 10px)',right:0,zIndex:20,background:'rgba(10,12,35,0.97)',backdropFilter:'blur(20px)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:14,overflow:'hidden',minWidth:230,boxShadow:'0 16px 48px rgba(0,0,0,0.7)',animation:'slideIn 0.15s ease'}}>

                {/* Header */}
                <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(99,102,241,0.1)',display:'flex',alignItems:'center',gap:12}}>
                  <Avatar size={40}/>
                  <div style={{overflow:'hidden',flex:1}}>
                    <div style={{fontWeight:700,fontSize:'0.92rem',color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name||'User'}</div>
                    <div style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.35)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.email||''}</div>
                  </div>
                </div>

                <div style={{padding:'6px 0'}}>
                  <MenuItem icon="👤" label="Edit Profile" sub="View your stats & info" onClick={()=>{setShowProfileMenu(false);setActiveTab('profile');}}/>
                  <MenuItem icon="💬" label="Send Feedback" sub="Tell us what you think" onClick={()=>{setShowProfileMenu(false);window.open('mailto:rithvikkrishna1618@gmail.com?subject=TaskMaster Feedback','_blank');}}/>
                  <MenuItem icon="❓" label="Help & Support" sub="GitHub issues" onClick={()=>{setShowProfileMenu(false);window.open('https://github.com/rithvikkrish/habit-tracker/issues','_blank');}}/>
                  <MenuItem icon="🔔" label={notifEnabled?'Reminders On ✓':'Enable Reminders'} sub={notifEnabled?'Streak alerts active':'Get streak alerts'} onClick={()=>{setShowProfileMenu(false);if(!notifEnabled)enableNotifications();}}/>
                </div>

                <div style={{height:1,background:'rgba(99,102,241,0.12)'}}/>

                <div style={{padding:'6px 0'}}>
                  <MenuItem icon="🚪" label="Logout" color="rgba(239,68,68,0.8)" onClick={()=>{setShowProfileMenu(false);logout();}}/>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      <div className="dash-main" style={{position:'relative',zIndex:5,maxWidth:1200,margin:'0 auto',padding:'28px 24px'}}>

        {/* Quote + Clock */}
        {dailyQuote&&(
          <div className="dash-quote" style={{...card,marginBottom:26,animation:'fadeUp 0.5s ease',padding:0,overflow:'hidden',border:`1px solid rgba(99,102,241,0.2)`,boxShadow:'0 4px 40px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex',alignItems:'center',gap:22,padding:'22px 28px',flex:1}}>
              <div style={{position:'relative',flexShrink:0}}>
                <div style={{position:'absolute',inset:-4,borderRadius:18,background:GRAD,opacity:0.28,filter:'blur(10px)',animation:'glowPulse 3s ease-in-out infinite',zIndex:-1}}/>
                <img src={dailyQuote.image_url} alt="" onError={e=>e.target.style.display='none'} style={{width:105,height:125,borderRadius:14,objectFit:'cover',border:`2px solid rgba(99,102,241,0.3)`,display:'block'}}/>
              </div>
              <div style={{flex:1}}>
                <p style={{color:CYAN,fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'3px',margin:'0 0 10px',fontWeight:700}}>{dailyQuote.character}</p>
                <p style={{color:'rgba(255,255,255,0.82)',fontSize:'1rem',fontStyle:'italic',margin:0,lineHeight:1.8}}>"{dailyQuote.quote}"</p>
              </div>
            </div>
            <Clock/>
          </div>
        )}

        {/* Stats */}
        <div className="dash-stats">
          {[{label:'TOTAL TASKS',value:total,icon:'🗒️'},{label:'COMPLETED',value:done,icon:'✅'},{label:'HABITS',value:habits.length,icon:'🔥'},{label:'CATEGORIES',value:categories.length,icon:'🗂️'}].map((st,i)=>(
            <div key={st.label} style={{...card,textAlign:'center',padding:'26px 14px',transition:'all 0.25s',cursor:'default',animation:`fadeUp ${0.25+i*0.07}s ease`}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor='rgba(99,102,241,0.35)';e.currentTarget.style.boxShadow='0 8px 32px rgba(99,102,241,0.1)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor='';e.currentTarget.style.boxShadow='';}}>
              <div style={{fontSize:'2.2rem',marginBottom:10,fontFamily:EMOJI}}>{st.icon}</div>
              <div style={{fontSize:'2rem',fontWeight:800,lineHeight:1,marginBottom:7,background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{st.value}</div>
              <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.28)',letterSpacing:'1.5px',fontWeight:700}}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {[{id:'tasks',label:'📋 Tasks'},{id:'habits',label:'🧡 Habits'},{id:'analytics',label:'📊 Analytics'},{id:'categories',label:'🗂️ Categories'},{id:'profile',label:'👤 Profile'}].map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:'8px 18px',borderRadius:9,border:activeTab===tab.id?`1px solid rgba(99,102,241,0.4)`:'1px solid transparent',cursor:'pointer',fontFamily:FONT,fontWeight:700,fontSize:'0.83rem',transition:'all 0.2s',background:activeTab===tab.id?`linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))`:'transparent',color:activeTab===tab.id?'#fff':'rgba(255,255,255,0.35)',boxShadow:activeTab===tab.id?`0 0 16px rgba(99,102,241,0.15)`:'none',whiteSpace:'nowrap'}}>{tab.label}</button>
          ))}
        </div>

        {/* TASKS */}
        {activeTab==='tasks'&&(
          <div style={{animation:'fadeUp 0.3s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:10}}>
              <h2 style={{margin:0,fontSize:'1.15rem',fontWeight:700}}><span style={{fontFamily:EMOJI}}>🗒️</span> My Tasks</h2>
              <button onClick={()=>setShowAdd(!showAdd)} style={btn}>+ Add Task</button>
            </div>
            <div className="dash-filters">
              <input style={{...inp,flex:2,minWidth:160}} placeholder="🔍 Search tasks..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
              <select style={{...sel,flex:1,minWidth:120}} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <select style={{...sel,flex:1,minWidth:110}} value={filterPri} onChange={e=>setFilterPri(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
              </select>
            </div>
            {showAdd&&(
              <form onSubmit={addTask} style={{...card,marginBottom:14,display:'flex',flexDirection:'column',gap:11,border:`1px solid rgba(99,102,241,0.25)`,animation:'slideIn 0.2s ease'}}>
                <input style={inp} placeholder="Task title *" value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} required/>
                <textarea style={{...inp,height:65}} placeholder="Description (optional)" value={newTask.description} onChange={e=>setNewTask({...newTask,description:e.target.value})}/>
                <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
                  <select style={sel} value={newTask.category} onChange={e=>setNewTask({...newTask,category:e.target.value})}>
                    {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <select style={sel} value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})}>
                    <option value="low">🟢 Low</option><option value="medium">🟡 Medium</option><option value="high">🔴 High</option>
                  </select>
                  <input type="date" style={{...sel,color:newTask.due_date?'#fff':'rgba(255,255,255,0.3)'}} value={newTask.due_date} onChange={e=>setNewTask({...newTask,due_date:e.target.value})}/>
                </div>
                <div style={{display:'flex',gap:9}}>
                  <button type="submit" style={btn}>Add Task</button>
                  <button type="button" onClick={()=>setShowAdd(false)} style={{...btn,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'none'}}>Cancel</button>
                </div>
              </form>
            )}
            {editTask&&(
              <form onSubmit={saveEditTask} style={{...card,marginBottom:14,display:'flex',flexDirection:'column',gap:11,border:`1px solid rgba(0,229,255,0.28)`,animation:'slideIn 0.2s ease',boxShadow:`0 0 20px rgba(0,229,255,0.08)`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:CYAN,fontWeight:700,fontSize:'0.85rem'}}>✏️ Editing Task</span>
                  <button type="button" onClick={()=>setEditTask(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'1.1rem'}}>✕</button>
                </div>
                <input style={inp} value={editTask.title} onChange={e=>setEditTask({...editTask,title:e.target.value})} required/>
                <textarea style={{...inp,height:65}} placeholder="Description" value={editTask.description||''} onChange={e=>setEditTask({...editTask,description:e.target.value})}/>
                <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
                  <select style={sel} value={editTask.category} onChange={e=>setEditTask({...editTask,category:e.target.value})}>
                    {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <select style={sel} value={editTask.priority} onChange={e=>setEditTask({...editTask,priority:e.target.value})}>
                    <option value="low">🟢 Low</option><option value="medium">🟡 Medium</option><option value="high">🔴 High</option>
                  </select>
                  <input type="date" style={sel} value={editTask.due_date||''} onChange={e=>setEditTask({...editTask,due_date:e.target.value})}/>
                </div>
                <div style={{display:'flex',gap:9}}>
                  <button type="submit" style={btn}>Save Changes</button>
                  <button type="button" onClick={()=>setEditTask(null)} style={{...btn,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'none'}}>Cancel</button>
                </div>
              </form>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:9}}>
              {filteredTasks.length===0&&(
                <div style={{...card,textAlign:'center',padding:46,border:'1px solid rgba(99,102,241,0.1)'}}>
                  {tasks.length===0?(<div><div style={{fontSize:'2.8rem',marginBottom:10,fontFamily:EMOJI}}>🗒️</div><div style={{color:'rgba(255,255,255,0.45)',fontWeight:600,marginBottom:5}}>No tasks yet!</div><div style={{color:'rgba(255,255,255,0.22)',fontSize:'0.85rem'}}>Hit "+ Add Task" to get started</div></div>):(<div style={{color:'rgba(255,255,255,0.3)'}}>No tasks match your filters</div>)}
                </div>
              )}
              {filteredTasks.map(task=>{
                const due=getDueBadge(task.due_date);
                const isExp=expandedTask===task.id;
                return(
                  <div key={task.id} style={{...card,transition:'all 0.22s',padding:0,overflow:'hidden',border:`1px solid ${task.status==='done'?'rgba(16,185,129,0.14)':'rgba(99,102,241,0.12)'}`}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(99,102,241,0.3)';e.currentTarget.style.transform='translateX(2px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=task.status==='done'?'rgba(16,185,129,0.14)':'rgba(99,102,241,0.12)';e.currentTarget.style.transform='';}}>
                    <div className="dash-task-row" style={{padding:'14px 18px'}}>
                      <div style={{flex:1,minWidth:140}}>
                        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5,flexWrap:'wrap'}}>
                          <p style={{margin:0,fontWeight:700,fontSize:'0.95rem',textDecoration:task.status==='done'?'line-through':'none',color:task.status==='done'?'rgba(255,255,255,0.22)':'#fff'}}>{task.title}</p>
                          {due&&<span style={{fontSize:'0.62rem',padding:'2px 7px',borderRadius:8,background:`${due.color}18`,color:due.color,fontWeight:700,border:`1px solid ${due.color}30`}}>{due.label}</span>}
                        </div>
                        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                          <span style={{fontSize:'0.68rem',padding:'2px 9px',borderRadius:20,background:`${pColor[task.priority]}15`,color:pColor[task.priority],fontWeight:700,border:`1px solid ${pColor[task.priority]}30`,fontFamily:EMOJI}}>{pEmoji[task.priority]} {task.priority.charAt(0).toUpperCase()+task.priority.slice(1)}</span>
                          <span style={{fontSize:'0.68rem',padding:'2px 9px',borderRadius:20,background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.35)',fontWeight:600,border:'1px solid rgba(255,255,255,0.08)',fontFamily:EMOJI}}>💼 {task.category}</span>
                          {task.description&&<button onClick={()=>setExpandedTask(isExp?null:task.id)} style={{fontSize:'0.68rem',padding:'2px 9px',borderRadius:20,background:`rgba(99,102,241,0.1)`,color:'rgba(167,139,250,0.8)',fontWeight:600,border:`1px solid rgba(99,102,241,0.2)`,cursor:'pointer',fontFamily:FONT}}>{isExp?'▲ Hide':'▼ Details'}</button>}
                        </div>
                      </div>
                      <div className="dash-task-actions">
                        <span style={{fontSize:'0.78rem',fontWeight:700,color:sColor[task.status],fontFamily:EMOJI,minWidth:85,textAlign:'right'}}>{sEmoji[task.status]} {task.status==='in-progress'?'In Progress':task.status.charAt(0).toUpperCase()+task.status.slice(1)}</span>
                        <select value={task.status} onChange={e=>updateStatus(task.id,e.target.value)} style={{...sel,padding:'6px 9px',fontSize:'0.78rem',color:sColor[task.status]}}>
                          <option value="todo">Todo</option><option value="in-progress">In Progress</option><option value="done">Done</option>
                        </select>
                        <button onClick={()=>setEditTask({...task})} style={{background:'rgba(99,102,241,0.1)',border:`1px solid rgba(99,102,241,0.22)`,borderRadius:8,color:'rgba(167,139,250,0.9)',padding:'6px 9px',cursor:'pointer'}}>✏️</button>
                        <button onClick={()=>deleteTask(task.id)} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,color:'#ef4444',padding:'6px 9px',cursor:'pointer',fontFamily:EMOJI}}>🗑️</button>
                      </div>
                    </div>
                    {isExp&&task.description&&(
                      <div style={{padding:'0 18px 14px',borderTop:'1px solid rgba(99,102,241,0.1)',paddingTop:12,animation:'slideIn 0.2s ease'}}>
                        <p style={{margin:0,color:'rgba(255,255,255,0.55)',fontSize:'0.88rem',lineHeight:1.7}}>{task.description}</p>
                        {task.due_date&&<p style={{margin:'7px 0 0',color:'rgba(255,255,255,0.3)',fontSize:'0.78rem'}}>📅 Due: {new Date(task.due_date).toLocaleDateString('en-US',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HABITS */}
        {activeTab==='habits'&&(
          <div style={{animation:'fadeUp 0.3s ease'}}>
            <h2 style={{marginBottom:16,fontSize:'1.15rem',fontWeight:700}}><span style={{fontFamily:EMOJI}}>💪</span> My Habits</h2>
            {habits.filter(h=>{const t=new Date().toISOString().split('T')[0];const y=new Date(Date.now()-86400000).toISOString().split('T')[0];return h.streak>0&&!h.history?.includes(t)&&h.history?.includes(y);}).length>0&&(
              <div style={{...card,marginBottom:12,background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.22)',padding:'11px 16px',display:'flex',alignItems:'center',gap:9}}>
                <span style={{fontFamily:EMOJI}}>⚠️</span>
                <span style={{fontSize:'0.83rem',color:'#f59e0b',fontWeight:600}}>Streaks at risk today! Mark your habits done before midnight.</span>
              </div>
            )}
            <div style={{...card,marginBottom:12,background:'rgba(0,229,255,0.04)',border:`1px solid rgba(0,229,255,0.12)`,padding:'11px 16px',display:'flex',alignItems:'center',gap:9}}>
              <span style={{fontFamily:EMOJI}}>☁️</span>
              <span style={{fontSize:'0.83rem',color:'rgba(0,229,255,0.75)'}}>Habits saved to cloud — persist across logins!</span>
            </div>
            <div style={{...card,marginBottom:14,display:'flex',flexDirection:'column',gap:11,border:`1px solid rgba(99,102,241,0.15)`}}>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {emojis.map(e=>(<button key={e} onClick={()=>setHabitEmoji(e)} style={{background:habitEmoji===e?`rgba(99,102,241,0.2)`:'transparent',border:habitEmoji===e?`1px solid rgba(99,102,241,0.45)`:'1px solid rgba(255,255,255,0.07)',borderRadius:9,padding:'5px 8px',cursor:'pointer',fontSize:'1.3rem',transition:'all 0.2s',fontFamily:EMOJI}}>{e}</button>))}
              </div>
              <div style={{display:'flex',gap:9}}>
                <input style={inp} placeholder="New habit name..." value={newHabit} onChange={e=>setNewHabit(e.target.value)} onKeyPress={e=>e.key==='Enter'&&addHabit()}/>
                <button onClick={addHabit} style={btn}>Add</button>
              </div>
            </div>
            {habitsLoading&&<div style={{...card,textAlign:'center',padding:32,color:'rgba(255,255,255,0.3)'}}>Loading habits...</div>}
            {!habitsLoading&&habits.length===0&&(
              <div style={{...card,textAlign:'center',padding:44,border:'1px solid rgba(99,102,241,0.1)'}}>
                <div style={{fontSize:'2.8rem',marginBottom:10,fontFamily:EMOJI}}>💪</div>
                <div style={{color:'rgba(255,255,255,0.45)',fontWeight:600,marginBottom:5}}>No habits yet!</div>
                <div style={{color:'rgba(255,255,255,0.22)',fontSize:'0.85rem'}}>Add your first habit above</div>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              {habits.map(habit=>{
                const today=new Date().toISOString().split('T')[0];
                const doneToday=habit.history?.includes(today);
                const yest=new Date(Date.now()-86400000).toISOString().split('T')[0];
                const atRisk=habit.streak>0&&!doneToday&&habit.history?.includes(yest);
                const isExp=expandedHabit===habit.id;
                return(
                  <div key={habit.id} style={{...card,border:atRisk?'1px solid rgba(245,158,11,0.28)':doneToday?'1px solid rgba(16,185,129,0.18)':'1px solid rgba(99,102,241,0.12)',transition:'all 0.2s'}}>
                    {editHabit?.id===habit.id?(
                      <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center'}}>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{emojis.map(e=>(<button key={e} onClick={()=>setEditHabit({...editHabit,emoji:e})} style={{background:editHabit.emoji===e?`rgba(99,102,241,0.2)`:'transparent',border:editHabit.emoji===e?`1px solid rgba(99,102,241,0.4)`:'1px solid transparent',borderRadius:8,padding:'3px 6px',cursor:'pointer',fontSize:'1.1rem',fontFamily:EMOJI}}>{e}</button>))}</div>
                        <input style={{...inp,flex:1,minWidth:130}} value={editHabit.name} onChange={e=>setEditHabit({...editHabit,name:e.target.value})}/>
                        <button onClick={saveEditHabit} style={{...btn,padding:'8px 14px'}}>Save</button>
                        <button onClick={()=>setEditHabit(null)} style={{...btn,padding:'8px 12px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'none'}}>✕</button>
                      </div>
                    ):(
                      <>
                        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                          <span style={{fontSize:'1.8rem',fontFamily:EMOJI}}>{habit.emoji}</span>
                          <div style={{flex:1,minWidth:120}}>
                            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6,flexWrap:'wrap'}}>
                              <p style={{margin:0,fontWeight:700,fontSize:'0.95rem'}}>{habit.name}</p>
                              {atRisk&&<span style={{fontSize:'0.62rem',padding:'2px 7px',borderRadius:7,background:'rgba(245,158,11,0.12)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.25)',fontWeight:700}}>⚠️ At risk</span>}
                              {doneToday&&<span style={{fontSize:'0.62rem',padding:'2px 7px',borderRadius:7,background:'rgba(16,185,129,0.1)',color:'#10b981',border:'1px solid rgba(16,185,129,0.22)',fontWeight:700}}>✅ Done</span>}
                            </div>
                            <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                              {getLast7().map(day=>(<div key={day} title={day} style={{width:26,height:26,borderRadius:6,background:habit.history?.includes(day)?GRAD:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',fontWeight:700,color:habit.history?.includes(day)?'#fff':'rgba(255,255,255,0.25)',boxShadow:habit.history?.includes(day)?`0 0 8px rgba(0,229,255,0.3)`:'none'}}>{new Date(day).getDate()}</div>))}
                            </div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                            <span style={{color:'#f59e0b',fontWeight:700,fontFamily:EMOJI,fontSize:'0.9rem'}}>🔥 {habit.streak||0}</span>
                            <button onClick={()=>setExpandedHabit(isExp?null:habit.id)} style={{background:'rgba(99,102,241,0.1)',border:`1px solid rgba(99,102,241,0.22)`,borderRadius:8,color:'rgba(167,139,250,0.85)',padding:'6px 10px',cursor:'pointer',fontSize:'0.75rem',fontFamily:FONT,fontWeight:600}}>{isExp?'▲':'📅 History'}</button>
                            <button onClick={()=>toggleHabit(habit.id)} style={{...btn,padding:'7px 14px',background:doneToday?'rgba(16,185,129,0.15)':btn.background,border:doneToday?'1px solid rgba(16,185,129,0.3)':btn.border,fontFamily:EMOJI,fontSize:'0.82rem'}}>{doneToday?'✅ Done':'Mark Done'}</button>
                            <button onClick={()=>setEditHabit({...habit})} style={{background:'rgba(99,102,241,0.1)',border:`1px solid rgba(99,102,241,0.2)`,borderRadius:8,color:'rgba(167,139,250,0.9)',padding:'6px 9px',cursor:'pointer'}}>✏️</button>
                            <button onClick={()=>deleteHabit(habit.id)} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,color:'#ef4444',padding:'6px 9px',cursor:'pointer',fontFamily:EMOJI}}>🗑️</button>
                          </div>
                        </div>
                        {isExp&&(
                          <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid rgba(99,102,241,0.1)',animation:'slideIn 0.2s ease'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9,flexWrap:'wrap',gap:6}}>
                              <span style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.35)',fontWeight:600}}>Last 18 weeks</span>
                              <span style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.28)'}}>Total: <strong style={{color:CYAN}}>{habit.history?.length||0}</strong> check-ins</span>
                            </div>
                            <HabitHeatmap history={habit.history}/>
                            <div style={{display:'flex',gap:5,marginTop:7,alignItems:'center'}}>
                              <span style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.22)'}}>Less</span>
                              {[0.06,0.3,0.6,1].map((o,i)=><div key={i} style={{width:11,height:11,borderRadius:3,background:`linear-gradient(90deg,rgba(0,229,255,${o}),rgba(191,95,255,${o}))`}}/>)}
                              <span style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.22)'}}>More</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        {activeTab==='categories'&&(
          <div style={{animation:'fadeUp 0.3s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h2 style={{margin:0,fontSize:'1.15rem',fontWeight:700}}><span style={{fontFamily:EMOJI}}>🗂️</span> My Categories</h2>
              <button onClick={()=>setShowAddCat(!showAddCat)} style={btn}>+ Add Category</button>
            </div>
            {showAddCat&&(
              <div style={{...card,marginBottom:14,display:'flex',gap:11,flexWrap:'wrap',alignItems:'center',border:`1px solid rgba(99,102,241,0.25)`,animation:'slideIn 0.2s ease'}}>
                <input style={{...inp,flex:1,minWidth:160}} placeholder="Category name" value={newCatName} onChange={e=>setNewCatName(e.target.value)}/>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{catColors.map(c=>(<button key={c} onClick={()=>setNewCatColor(c)} style={{width:26,height:26,borderRadius:50,background:c,border:newCatColor===c?'2px solid #fff':'2px solid transparent',cursor:'pointer',boxShadow:newCatColor===c?`0 0 10px ${c}`:'none',transition:'all 0.2s'}}/>))}</div>
                <button onClick={addCategory} style={btn}>Add</button>
                <button onClick={()=>setShowAddCat(false)} style={{...btn,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',boxShadow:'none'}}>Cancel</button>
              </div>
            )}
            <div className="dash-cat-grid">
              {categories.length===0&&<div style={{...card,textAlign:'center',padding:32,color:'rgba(255,255,255,0.25)',gridColumn:'1/-1'}}>No categories yet</div>}
              {categories.map(cat=>{
                const tc=tasks.filter(t=>t.category===cat.name).length;
                const dc=tasks.filter(t=>t.category===cat.name&&t.status==='done').length;
                return(
                  <div key={cat.id} style={{...card,border:`1px solid ${cat.color}22`,transition:'all 0.25s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=`${cat.color}45`;e.currentTarget.style.boxShadow=`0 0 18px ${cat.color}12`;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=`${cat.color}22`;e.currentTarget.style.boxShadow='';}}>
                    <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:10}}>
                      <div style={{width:12,height:12,borderRadius:50,background:cat.color,boxShadow:`0 0 7px ${cat.color}`,flexShrink:0}}/>
                      <span style={{fontWeight:700,fontSize:'0.95rem'}}>{cat.name}</span>
                      {cat.is_default&&<span style={{fontSize:'0.58rem',padding:'1px 6px',borderRadius:7,background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.28)',border:'1px solid rgba(255,255,255,0.08)'}}>Default</span>}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}>
                      <span style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.38)'}}>{tc} tasks</span>
                      <span style={{fontSize:'0.78rem',color:'#10b981'}}>{dc} done</span>
                    </div>
                    <div style={{height:5,background:'rgba(255,255,255,0.05)',borderRadius:3}}>
                      <div style={{height:'100%',width:`${tc>0?(dc/tc)*100:0}%`,background:`linear-gradient(90deg,${cat.color},rgba(0,229,255,0.5))`,borderRadius:3,transition:'width 0.5s',boxShadow:`0 0 6px ${cat.color}50`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab==='analytics'&&(
          <div style={{animation:'fadeUp 0.3s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10}}>
              <h2 style={{margin:0,fontSize:'1.15rem',fontWeight:700}}><span style={{fontFamily:EMOJI}}>📊</span> Analytics</h2>
              <div style={{display:'flex',gap:5,background:'rgba(10,12,30,0.7)',padding:4,borderRadius:9,border:'1px solid rgba(99,102,241,0.12)'}}>
                <button onClick={()=>setAnalyticsPeriod('weekly')} style={periodBtn('weekly')}>📅 Weekly</button>
                <button onClick={()=>setAnalyticsPeriod('monthly')} style={periodBtn('monthly')}>🗓️ Monthly</button>
              </div>
            </div>
            {total===0&&habits.length===0?(
              <div style={{...card,textAlign:'center',padding:56,border:`1px solid rgba(99,102,241,0.12)`}}>
                <div style={{fontSize:'3rem',marginBottom:14,fontFamily:EMOJI}}>📊</div>
                <div style={{fontSize:'1rem',fontWeight:700,marginBottom:7,color:'rgba(255,255,255,0.5)'}}>No data yet</div>
                <div style={{fontSize:'0.85rem',color:'rgba(255,255,255,0.22)',maxWidth:320,margin:'0 auto',lineHeight:1.7}}>Add tasks and habits — your analytics will appear here automatically!</div>
              </div>
            ):(
              <>
                <div className="dash-analytics-3" style={{marginBottom:16}}>
                  {[{label:'TASKS DONE',value:done,icon:'✅',color:'#10b981'},{label:'IN PROGRESS',value:inProg,icon:'⏳',color:'#f59e0b'},{label:'HABIT CHECK-INS',value:habits.reduce((a,h)=>a+(h.history?.length||0),0),icon:'💪',color:CYAN}].map(s=>(
                    <div key={s.label} style={{...card,display:'flex',alignItems:'center',gap:12,padding:'14px 18px'}}>
                      <span style={{fontSize:'1.6rem',fontFamily:EMOJI}}>{s.icon}</span>
                      <div><div style={{fontSize:'1.5rem',fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div><div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.28)',letterSpacing:'1px',marginTop:3,fontWeight:600}}>{s.label}</div></div>
                    </div>
                  ))}
                </div>
                <div className="dash-analytics-2">
                  <div style={{...card,border:`1px solid rgba(0,229,255,0.1)`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <h3 style={{margin:0,fontSize:'0.9rem',color:CYAN,fontFamily:EMOJI}}>📋 Tasks Created</h3>
                      <span style={{fontSize:'0.67rem',color:'rgba(255,255,255,0.22)',fontWeight:600}}>{analyticsPeriod==='weekly'?'Last 7 days':'Last 4 weeks'}</span>
                    </div>
                    <BarChart data={taskBarData}/>
                  </div>
                  <div style={{...card,border:`1px solid rgba(191,95,255,0.1)`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <h3 style={{margin:0,fontSize:'0.9rem',color:PURP,fontFamily:EMOJI}}>💪 Habit Check-ins</h3>
                      <span style={{fontSize:'0.67rem',color:'rgba(255,255,255,0.22)',fontWeight:600}}>{analyticsPeriod==='weekly'?'Last 7 days':'Last 6 months'}</span>
                    </div>
                    <BarChart data={analyticsPeriod==='weekly'?habitBarData:getMonthlyHabitData()} colorFn={()=>`linear-gradient(180deg,${PURP},rgba(191,95,255,0.4))`}/>
                  </div>
                </div>
                <div className="dash-analytics-3">
                  <div style={card}>
                    <h3 style={{margin:'0 0 12px',fontSize:'0.9rem',color:CYAN,fontFamily:EMOJI}}>✅ Completion Rate</h3>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                      <div style={{position:'relative',width:110,height:110}}>
                        <svg viewBox="0 0 120 120" width="110" height="110" style={{transform:'rotate(-90deg)'}}>
                          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"/>
                          <circle cx="60" cy="60" r="50" fill="none" stroke="url(#cg)" strokeWidth="12" strokeDasharray={`${total>0?(done/total)*314:0} 314`} strokeLinecap="round"/>
                          <defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={CYAN}/><stop offset="100%" stopColor={PURP}/></linearGradient></defs>
                        </svg>
                        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontSize:'1.2rem',fontWeight:800,background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{total>0?Math.round((done/total)*100):0}%</div>
                      </div>
                      <p style={{color:'rgba(255,255,255,0.25)',fontSize:'0.78rem',margin:0}}>{done} of {total} done</p>
                    </div>
                  </div>
                  <div style={card}>
                    <h3 style={{margin:'0 0 12px',fontSize:'0.9rem',color:CYAN,fontFamily:EMOJI}}>📌 By Priority</h3>
                    {['high','medium','low'].map(p=>{const count=tasks.filter(t=>t.priority===p).length;return(<div key={p} style={{marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:'0.8rem',color:pColor[p],fontFamily:EMOJI}}>{pEmoji[p]} {p.charAt(0).toUpperCase()+p.slice(1)}</span><span style={{fontSize:'0.8rem',color:'rgba(255,255,255,0.38)',fontWeight:700}}>{count}</span></div><div style={{height:6,background:'rgba(255,255,255,0.05)',borderRadius:3}}><div style={{height:'100%',width:`${total>0?(count/total)*100:0}%`,background:`linear-gradient(90deg,${pColor[p]},${CYAN})`,borderRadius:3,transition:'width 0.6s',boxShadow:`0 0 7px ${pColor[p]}50`}}/></div></div>);})}
                  </div>
                  <div style={card}>
                    <h3 style={{margin:'0 0 12px',fontSize:'0.9rem',color:CYAN,fontFamily:EMOJI}}>🔥 Habit Streaks</h3>
                    {habits.length===0&&<p style={{color:'rgba(255,255,255,0.22)',fontSize:'0.85rem'}}>No habits yet</p>}
                    {habits.slice(0,5).map(h=>(<div key={h.id} style={{display:'flex',alignItems:'center',gap:9,marginBottom:9}}><span style={{fontFamily:EMOJI,fontSize:'1rem'}}>{h.emoji}</span><div style={{flex:1}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:'0.8rem'}}>{h.name}</span><span style={{color:'#f59e0b',fontWeight:700,fontFamily:EMOJI,fontSize:'0.8rem'}}>🔥{h.streak||0}</span></div><div style={{height:4,background:'rgba(255,255,255,0.05)',borderRadius:2}}><div style={{height:'100%',width:`${Math.min((h.streak||0)/30*100,100)}%`,background:GRAD,borderRadius:2,boxShadow:`0 0 5px rgba(0,229,255,0.3)`}}/></div></div></div>))}
                  </div>
                </div>
                {categories.length>0&&(
                  <div style={{...card,marginTop:14,border:`1px solid rgba(99,102,241,0.1)`}}>
                    <h3 style={{margin:'0 0 4px',fontSize:'0.9rem',color:CYAN,fontFamily:EMOJI}}>🗂️ Tasks by Category</h3>
                    <BarChart data={getCategoryData()} colorFn={i=>`linear-gradient(180deg,hsl(${180+i*30},100%,60%),hsl(${180+i*30},80%,30%))`}/>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PROFILE */}
        {activeTab==='profile'&&(
          <div style={{animation:'fadeUp 0.3s ease',maxWidth:520}}>
            <h2 style={{marginBottom:22,fontSize:'1.15rem',fontWeight:700}}><span style={{fontFamily:EMOJI}}>👤</span> Profile</h2>
            <div style={{...card,border:'1px solid rgba(99,102,241,0.2)'}}>
              <div style={{display:'flex',alignItems:'center',gap:18,marginBottom:22,paddingBottom:20,borderBottom:'1px solid rgba(99,102,241,0.1)'}}>
                <div style={{width:70,height:70,borderRadius:'50%',background:GRAD,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',fontWeight:800,overflow:'hidden',boxShadow:`0 0 22px rgba(99,102,241,0.35)`,flexShrink:0}}>
                  {user.profile_pic?<img src={user.profile_pic} alt="av" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{color:'#fff'}}>{(user.name||'U').charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <div style={{fontWeight:800,fontSize:'1.15rem',marginBottom:3}}>{user.name||'User'}</div>
                  <div style={{fontSize:'0.82rem',color:'rgba(255,255,255,0.4)',marginBottom:10}}>{user.email||''}</div>
                  <div style={{fontSize:'0.72rem',color:'rgba(99,102,241,0.8)',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:8,padding:'4px 10px',display:'inline-block'}}>
                    🏆 Member since {user.created_at?new Date(user.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}):'Day 1'}
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
                {[{label:'Tasks',value:total,icon:'🗒️'},{label:'Done',value:done,icon:'✅'},{label:'Habits',value:habits.length,icon:'🔥'}].map(s=>(
                  <div key={s.label} style={{background:'rgba(99,102,241,0.08)',borderRadius:10,padding:'12px',textAlign:'center',border:'1px solid rgba(99,102,241,0.12)'}}>
                    <div style={{fontSize:'1.4rem',fontFamily:EMOJI,marginBottom:4}}>{s.icon}</div>
                    <div style={{fontSize:'1.3rem',fontWeight:800,background:GRAD,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{s.value}</div>
                    <div style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.3)',fontWeight:600,letterSpacing:'1px'}}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                {[{label:'Name',value:user.name||'—'},{label:'Email',value:user.email||'—'},{label:'Notifications',value:notifEnabled?'✅ Enabled':'❌ Disabled',color:notifEnabled?'#10b981':'rgba(255,255,255,0.3)'},{label:'Total Check-ins',value:habits.reduce((a,h)=>a+(h.history?.length||0),0),color:CYAN}].map(row=>(
                  <div key={row.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:9,border:'1px solid rgba(255,255,255,0.06)'}}>
                    <span style={{color:'rgba(255,255,255,0.4)',fontSize:'0.85rem'}}>{row.label}</span>
                    <span style={{fontWeight:600,fontSize:'0.85rem',color:row.color||'#fff'}}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:9}}>
                <button onClick={()=>window.open('mailto:rithvikkrishna1618@gmail.com?subject=TaskMaster Feedback','_blank')} style={{...btn,width:'100%',justifyContent:'center',display:'flex',gap:8}}>💬 Send Feedback</button>
                <button onClick={()=>window.open('https://github.com/rithvikkrish/habit-tracker/issues','_blank')} style={{...btn,width:'100%',background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.25)',boxShadow:'none',justifyContent:'center',display:'flex',gap:8}}>❓ Help & Support</button>
                {!notifEnabled&&<button onClick={enableNotifications} style={{...btn,width:'100%',background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.25)',boxShadow:'none',color:'#f59e0b',justifyContent:'center',display:'flex',gap:8}}>🔔 Enable Reminders</button>}
                <button onClick={logout} style={{width:'100%',padding:'12px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,color:'#ef4444',cursor:'pointer',fontFamily:FONT,fontWeight:700,fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>🚪 Logout</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
