import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function StarsBG() {
  const cvRef = useRef(null);
  useEffect(() => {
    const cv=cvRef.current; const ctx=cv.getContext('2d'); let aid;
    const resize=()=>{cv.width=window.innerWidth;cv.height=window.innerHeight;};
    resize(); window.addEventListener('resize',resize);
    const stars=Array.from({length:200},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*2+0.3,color:['#ffffff','#c4b5fd','#93c5fd','#67e8f9','#e0e7ff','#a5b4fc'][Math.floor(Math.random()*6)],tw:Math.random()*Math.PI*2,sp:Math.random()*0.008+0.003,pulse:Math.random()>0.6}));
    let shooters=[];
    const spawn=()=>shooters.push({x:Math.random()*cv.width*0.7,y:Math.random()*cv.height*0.4,len:100+Math.random()*80,op:1,spd:6+Math.random()*4,a:Math.PI/4+(Math.random()-0.5)*0.3,color:Math.random()>0.5?'#00e5ff':'#bf5fff'});
    const chars='アイウエオカキクケコサシスセソ0123456789ABCDEF';
    const fontSize=13;
    let drops=Array(Math.floor(cv.width/fontSize)).fill(0).map(()=>Math.random()*50);
    let frame=0;
    const draw=()=>{
      frame++;
      ctx.fillStyle='rgba(8,10,28,0.14)';ctx.fillRect(0,0,cv.width,cv.height);
      [{x:0.15,y:0.25,r:280,c:'rgba(99,102,241,0.05)'},{x:0.85,y:0.75,r:320,c:'rgba(139,92,246,0.04)'},{x:0.5,y:0.5,r:220,c:'rgba(6,182,212,0.03)'}].forEach(n=>{const g=ctx.createRadialGradient(n.x*cv.width,n.y*cv.height,0,n.x*cv.width,n.y*cv.height,n.r);g.addColorStop(0,n.c);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,cv.width,cv.height);});
      stars.forEach(s=>{s.tw+=s.sp;const op=s.pulse?0.15+0.85*(0.5+0.5*Math.sin(s.tw)):0.35+0.45*(0.5+0.5*Math.sin(s.tw));ctx.save();ctx.globalAlpha=op;ctx.shadowBlur=s.pulse?10:3;ctx.shadowColor=s.color;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();if(s.pulse&&op>0.75){ctx.globalAlpha=op*0.35;ctx.strokeStyle=s.color;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(s.x-s.r*4,s.y);ctx.lineTo(s.x+s.r*4,s.y);ctx.moveTo(s.x,s.y-s.r*4);ctx.lineTo(s.x,s.y+s.r*4);ctx.stroke();}ctx.restore();});
      if(frame%220===0)spawn();
      shooters=shooters.filter(s=>s.op>0);
      shooters.forEach(s=>{ctx.save();ctx.globalAlpha=s.op;const g=ctx.createLinearGradient(s.x,s.y,s.x-Math.cos(s.a)*s.len,s.y-Math.sin(s.a)*s.len);g.addColorStop(0,s.color);g.addColorStop(1,'transparent');ctx.strokeStyle=g;ctx.lineWidth=1.5;ctx.shadowBlur=10;ctx.shadowColor=s.color;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-Math.cos(s.a)*s.len,s.y-Math.sin(s.a)*s.len);ctx.stroke();ctx.restore();s.x+=s.spd;s.y+=s.spd;s.op-=0.018;});
      if(frame%9===0){const cols=Math.floor(cv.width/fontSize);if(drops.length!==cols)drops=Array(cols).fill(0).map(()=>Math.random()*50);ctx.font=`${fontSize}px monospace`;for(let i=0;i<cols;i++){const ch=chars[Math.floor(Math.random()*chars.length)];ctx.fillStyle=`rgba(0,229,255,${0.05+Math.random()*0.09})`;ctx.shadowBlur=3;ctx.shadowColor='#00e5ff';ctx.fillText(ch,i*fontSize,drops[i]*fontSize);if(drops[i]*fontSize>cv.height&&Math.random()>0.975)drops[i]=0;drops[i]+=0.38;}ctx.shadowBlur=0;}
      aid=requestAnimationFrame(draw);
    };
    draw();
    return()=>{window.removeEventListener('resize',resize);cancelAnimationFrame(aid);};
  },[]);
  return <canvas ref={cvRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}}/>;
}

export default function AuthPage() {
  const [tab,setTab]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [name,setName]=useState('');
  const [showPw,setShowPw]=useState(false);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [loadMsg,setLoadMsg]=useState('');
  const [forgotMode,setForgotMode]=useState(false);
  const [forgotEmail,setForgotEmail]=useState('');
  const [forgotSent,setForgotSent]=useState(false);
  const [profilePic,setProfilePic]=useState(null);

  useEffect(()=>{
    if(window.google)initGoogle();
    else{const s=document.getElementById('google-gsi');if(s)s.onload=initGoogle;}
  },[]); // eslint-disable-line

  const initGoogle=()=>{
    if(!window.google||!GOOGLE_CLIENT_ID)return;
    window.google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:handleGoogleCallback});
    const btn=document.getElementById('google-btn');
    if(btn)window.google.accounts.id.renderButton(btn,{theme:'filled_black',size:'large',width:320,text:'continue_with'});
  };

  const handleGoogleCallback=async(response)=>{
    setLoading(true);setLoadMsg('Signing in with Google...');
    try{
      const r=await axios.post(`${BACKEND_URL}/api/auth/google`,{token:response.credential});
      localStorage.setItem('token',r.data.token);
      localStorage.setItem('user',JSON.stringify(r.data.user));
      setLoadMsg('Loading your workspace...');
      await new Promise(res=>setTimeout(res,500));
      window.location.href='/dashboard';
    }catch{setError('Google sign-in failed. Please try again.');setLoading(false);}
  };

  const handleLogin=async(e)=>{
    e.preventDefault();setError('');
    setLoading(true);setLoadMsg('Signing in...');
    try{
      const r=await axios.post(`${BACKEND_URL}/api/auth/login`,{email,password});
      localStorage.setItem('token',r.data.token);
      localStorage.setItem('user',JSON.stringify(r.data.user));
      setLoadMsg('Loading your workspace...');
      await new Promise(res=>setTimeout(res,400));
      window.location.href='/dashboard';
    }catch{setError('Invalid email or password. Please try again.');setLoading(false);}
  };

  const handleSignup=async(e)=>{
    e.preventDefault();setError('');
    if(password.length<6){setError('Password must be at least 6 characters.');return;}
    setLoading(true);setLoadMsg('Creating your account...');
    try{
      const r=await axios.post(`${BACKEND_URL}/api/auth/register`,{email,password,name});
      localStorage.setItem('token',r.data.token);
      localStorage.setItem('user',JSON.stringify(r.data.user));
      setLoadMsg('Setting up your workspace...');
      await new Promise(res=>setTimeout(res,500));
      window.location.href='/dashboard';
    }catch(err){setError(err.response?.data?.detail||'Registration failed. Please try again.');setLoading(false);}
  };

  const FONT="'Outfit',sans-serif";
  const inp={width:'100%',padding:'13px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(99,102,241,0.25)',borderRadius:12,color:'#fff',fontSize:'0.95rem',outline:'none',boxSizing:'border-box',fontFamily:FONT,transition:'border-color 0.2s'};
  const lbl={fontSize:'0.72rem',fontWeight:700,letterSpacing:'1.5px',color:'rgba(255,255,255,0.45)',textTransform:'uppercase',marginBottom:7,display:'block'};
  const submitBtn={width:'100%',padding:'14px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:12,color:'#fff',fontWeight:700,fontSize:'1rem',cursor:'pointer',fontFamily:FONT,boxShadow:'0 4px 20px rgba(99,102,241,0.35)',marginBottom:16,transition:'opacity 0.2s'};

  return (
    <div style={{minHeight:'100vh',background:'#08091c',fontFamily:FONT,color:'#fff',position:'relative',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input::placeholder{color:rgba(255,255,255,0.22);}
        input:focus{border-color:rgba(99,102,241,0.55)!important;box-shadow:0 0 0 3px rgba(99,102,241,0.12);}
        .auth-card{width:100%;max-width:420px;position:relative;z-index:5;animation:fadeIn 0.5s ease;}
        @media(max-width:480px){.auth-card{max-width:100%!important;}}
      `}</style>

      <StarsBG/>

      {/* Loading overlay */}
      {loading&&(
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(8,10,28,0.93)',backdropFilter:'blur(10px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
          <div style={{fontSize:'2.8rem'}}>⚡</div>
          <div style={{fontSize:'1.3rem',fontWeight:800,background:'linear-gradient(90deg,#00e5ff,#bf5fff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>TaskMaster</div>
          <div style={{width:38,height:38,borderRadius:'50%',border:'3px solid rgba(99,102,241,0.15)',borderTopColor:'#6366f1',animation:'spin 0.75s linear infinite'}}/>
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:'0.9rem',letterSpacing:'0.5px'}}>{loadMsg}</div>
        </div>
      )}

      <div className="auth-card">

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:'2.8rem',marginBottom:8}}>⚡</div>
          <div style={{fontSize:'clamp(1.8rem,5vw,2.2rem)',fontWeight:800,marginBottom:6}}>
            <span style={{color:'#fff'}}>Task</span>
            <span style={{background:'linear-gradient(90deg,#8b5cf6,#a78bfa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Master</span>
          </div>
          <div style={{color:'rgba(255,255,255,0.35)',fontSize:'0.9rem'}}>Build habits. Dominate your day.</div>
        </div>

        {/* Card */}
        <div style={{background:'rgba(13,15,40,0.85)',backdropFilter:'blur(20px)',borderRadius:20,border:'1px solid rgba(99,102,241,0.18)',padding:'clamp(20px,5vw,32px)',boxShadow:'0 24px 64px rgba(0,0,0,0.5)'}}>

          {/* Forgot password */}
          {forgotMode?(
            <div>
              <button onClick={()=>{setForgotMode(false);setForgotSent(false);}} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:'0.85rem',marginBottom:18,fontFamily:FONT,display:'flex',alignItems:'center',gap:6}}>← Back to login</button>
              {forgotSent?(
                <div style={{textAlign:'center',padding:'24px 0'}}>
                  <div style={{fontSize:'2.5rem',marginBottom:12}}>📧</div>
                  <div style={{fontWeight:700,fontSize:'1.1rem',marginBottom:8}}>Check your email!</div>
                  <div style={{color:'rgba(255,255,255,0.4)',fontSize:'0.88rem',lineHeight:1.7}}>If an account exists for <strong style={{color:'rgba(167,139,250,0.9)'}}>{forgotEmail}</strong>, you'll receive a reset link shortly.</div>
                  <button onClick={()=>{setForgotMode(false);setForgotSent(false);}} style={{...submitBtn,marginTop:20,marginBottom:0}}>Back to Login</button>
                </div>
              ):(
                <form onSubmit={e=>{e.preventDefault();setForgotSent(true);}}>
                  <div style={{fontWeight:700,fontSize:'1.1rem',marginBottom:6}}>Reset Password</div>
                  <div style={{color:'rgba(255,255,255,0.35)',fontSize:'0.85rem',marginBottom:20}}>Enter your email to receive a reset link.</div>
                  <label style={lbl}>EMAIL</label>
                  <input style={{...inp,marginBottom:16}} type="email" placeholder="you@example.com" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} required/>
                  <button type="submit" style={{...submitBtn,marginBottom:0}}>Send Reset Link</button>
                </form>
              )}
            </div>
          ):(
            <>
              {/* Tab switcher */}
              <div style={{display:'flex',background:'rgba(255,255,255,0.04)',borderRadius:12,padding:4,marginBottom:24,border:'1px solid rgba(99,102,241,0.12)'}}>
                {['login','signup'].map(t=>(
                  <button key={t} onClick={()=>{setTab(t);setError('');}} style={{flex:1,padding:'10px',borderRadius:10,border:'none',cursor:'pointer',fontFamily:FONT,fontWeight:700,fontSize:'0.92rem',background:tab===t?'linear-gradient(135deg,#6366f1,#8b5cf6)':'transparent',color:tab===t?'#fff':'rgba(255,255,255,0.35)',boxShadow:tab===t?'0 2px 12px rgba(99,102,241,0.35)':'none',transition:'all 0.2s'}}>
                    {t==='login'?'Login':'Sign Up'}
                  </button>
                ))}
              </div>

              {/* Error */}
              {error&&(
                <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:'0.85rem',color:'#fca5a5',display:'flex',alignItems:'center',gap:8}}>
                  ⚠️ {error}
                </div>
              )}

              {/* Login form */}
              {tab==='login'&&(
                <form onSubmit={handleLogin}>
                  <label style={lbl}>EMAIL</label>
                  <input style={{...inp,marginBottom:14}} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>

                  <label style={lbl}>PASSWORD</label>
                  <div style={{position:'relative',marginBottom:8}}>
                    <input style={{...inp,paddingRight:48}} type={showPw?'text':'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/>
                    <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:'1.1rem',padding:0,lineHeight:1}}>
                      {showPw?'🙈':'👁️'}
                    </button>
                  </div>

                  <div style={{textAlign:'right',marginBottom:20}}>
                    <button type="button" onClick={()=>setForgotMode(true)} style={{background:'none',border:'none',color:'rgba(167,139,250,0.8)',cursor:'pointer',fontSize:'0.82rem',fontFamily:FONT,fontWeight:600}}>Forgot password?</button>
                  </div>

                  <button type="submit" style={submitBtn}>🚀 Login</button>

                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                    <div style={{flex:1,height:1,background:'rgba(255,255,255,0.08)'}}/>
                    <span style={{color:'rgba(255,255,255,0.25)',fontSize:'0.8rem'}}>or continue with</span>
                    <div style={{flex:1,height:1,background:'rgba(255,255,255,0.08)'}}/>
                  </div>

                  <div id="google-btn" style={{display:'flex',justifyContent:'center',marginBottom:4}}/>

                  <div style={{textAlign:'center',marginTop:18,fontSize:'0.85rem',color:'rgba(255,255,255,0.3)'}}>
                    Don't have an account?{' '}
                    <button type="button" onClick={()=>{setTab('signup');setError('');}} style={{background:'none',border:'none',color:'rgba(167,139,250,0.85)',cursor:'pointer',fontFamily:FONT,fontWeight:700,fontSize:'0.85rem'}}>Sign up free</button>
                  </div>
                </form>
              )}

              {/* Signup form */}
              {tab==='signup'&&(
                <form onSubmit={handleSignup}>
                  <label style={lbl}>FULL NAME</label>
                  <input style={{...inp,marginBottom:14}} type="text" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} required autoComplete="name"/>

                  <label style={lbl}>EMAIL</label>
                  <input style={{...inp,marginBottom:14}} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>

                  <label style={lbl}>PASSWORD</label>
                  <div style={{position:'relative',marginBottom:14}}>
                    <input style={{...inp,paddingRight:48}} type={showPw?'text':'password'} placeholder="Min 6 characters" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password"/>
                    <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:'1.1rem',padding:0,lineHeight:1}}>
                      {showPw?'🙈':'👁️'}
                    </button>
                  </div>

                  {/* Password strength */}
                  {password.length>0&&(
                    <div style={{marginBottom:16}}>
                      <div style={{display:'flex',gap:4,marginBottom:5}}>
                        {[1,2,3,4].map(i=>(<div key={i} style={{flex:1,height:3,borderRadius:2,background:password.length>=i*2?(password.length>=8?'#10b981':password.length>=5?'#f59e0b':'#ef4444'):'rgba(255,255,255,0.08)',transition:'all 0.3s'}}/>))}
                      </div>
                      <div style={{fontSize:'0.72rem',color:password.length>=8?'#10b981':password.length>=5?'#f59e0b':'#ef4444'}}>
                        {password.length>=8?'✅ Strong password':password.length>=5?'⚠️ Medium — add numbers or symbols':'❌ Too short'}
                      </div>
                    </div>
                  )}

                  {/* Profile photo */}
                  <label style={{...lbl,marginBottom:8}}>PROFILE PHOTO <span style={{color:'rgba(255,255,255,0.2)',fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                    <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',overflow:'hidden',flexShrink:0}}>
                      {profilePic?<img src={profilePic} alt="profile" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'👤'}
                    </div>
                    <label style={{flex:1,padding:'10px 14px',background:'rgba(255,255,255,0.04)',border:'1px dashed rgba(99,102,241,0.25)',borderRadius:10,cursor:'pointer',fontSize:'0.82rem',color:'rgba(255,255,255,0.4)',textAlign:'center',display:'block',transition:'all 0.2s'}}>
                      Upload photo
                      <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>setProfilePic(ev.target.result);r.readAsDataURL(f);}}}/>
                    </label>
                  </div>

                  <button type="submit" style={submitBtn}>🎉 Create Account</button>

                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                    <div style={{flex:1,height:1,background:'rgba(255,255,255,0.08)'}}/>
                    <span style={{color:'rgba(255,255,255,0.25)',fontSize:'0.8rem'}}>or</span>
                    <div style={{flex:1,height:1,background:'rgba(255,255,255,0.08)'}}/>
                  </div>

                  <div id="google-btn" style={{display:'flex',justifyContent:'center',marginBottom:4}}/>

                  <div style={{textAlign:'center',marginTop:18,fontSize:'0.85rem',color:'rgba(255,255,255,0.3)'}}>
                    Already have an account?{' '}
                    <button type="button" onClick={()=>{setTab('login');setError('');}} style={{background:'none',border:'none',color:'rgba(167,139,250,0.85)',cursor:'pointer',fontFamily:FONT,fontWeight:700,fontSize:'0.85rem'}}>Log in</button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <div style={{textAlign:'center',marginTop:16,fontSize:'0.75rem',color:'rgba(255,255,255,0.18)'}}>
          ⚡ TaskMaster — Build habits. Dominate your day.
        </div>
      </div>
    </div>
  );
}
