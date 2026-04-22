// ===================== CONFIG =====================
const WORKER_URL = 'https://gemini-proxy.alankussainov10.workers.dev';
const GOOGLE_CLIENT_ID = '533836977579-vmtqmhrmtemrbo44loi5vjr9rv87jenj.apps.googleusercontent.com';

// ===================== STATE =====================
let user = null;
let currentSubject = 'english';
let lesson = null;
let lang = localStorage.getItem('darabala_lang') || 'ru';
let progressData = {
  english: { completed: new Set(), streak: 0, xp: 0 },
  cs:      { completed: new Set(), streak: 0, xp: 0 }
};
function prog(){ return progressData[currentSubject]; }

// ===================== INIT =====================
window.addEventListener('DOMContentLoaded', function(){
  buildAvatarGrid('avatar-grid', function(av){
    if(!user) user = {};
    user.avatar = av;
    document.getElementById('btn-step3').disabled = false;
    document.getElementById('mascot-emoji').textContent = av.emoji;
    document.getElementById('mascot-bubble').textContent = `Я ${av.name}! 🌟`;
  });
  switchView('login');
  initGoogleAuth();
  applyLang();
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/DaraBala/sw.js').catch(()=>{});
  }
});

// ===================== AVATAR GRID =====================
function buildAvatarGrid(containerId, onSelect){
  const grid = document.getElementById(containerId);
  if(!grid) return;
  grid.innerHTML = '';
  AVATARS.forEach(av => {
    const btn = document.createElement('button');
    btn.className = 'avatar-btn';
    btn.type = 'button';
    btn.innerHTML = `<span class="av-emoji">${av.emoji}</span><span class="av-label">${av.name}</span>`;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      grid.querySelectorAll('.avatar-btn').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel');
      if(onSelect) onSelect(av, btn);
    });
    grid.appendChild(btn);
  });
}

// ===================== ONBOARDING =====================
function checkStep1(){
  const val = document.getElementById('input-name').value.trim();
  document.getElementById('btn-step1').disabled = val.length < 2;
  if(val.length >= 2) document.getElementById('mascot-bubble').textContent = `Привет, ${val}! 👋`;
}

function goStep(n){
  document.querySelectorAll('.ob-step').forEach(s=>s.classList.remove('active'));
  document.getElementById('ob-step'+n).classList.add('active');
  if(n===2) setTimeout(initDrums, 60);
}

function finishOnboarding(){
  const dobVal = window.drumState
    ? `${window.drumState.year}-${String(window.drumState.month).padStart(2,'0')}-${String(window.drumState.day).padStart(2,'0')}`
    : '';
  user = { name: document.getElementById('input-name').value.trim(), dob: dobVal, avatar: user?.avatar || AVATARS[0] };
  if(window._googleUser){
    const key = 'darabala_profile_' + (window._googleUser.email || window._googleUser.name);
    localStorage.setItem(key, JSON.stringify(user));
  }
  setupChatForUser();
  showDashboard();
  setTimeout(()=>showWelcomeNew(user.name, user.avatar.emoji), 600);
}

// ===================== DRUM DATE PICKER =====================
window.drumState = { day:10, month:6, year:2015 };
const ITEM_H = 44;
const MONTHS_RU  = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function daysInMonth(m,y){ return new Date(y,m,0).getDate(); }

function initDrums(){
  const curY=new Date().getFullYear();
  const dc=daysInMonth(drumState.month,drumState.year);
  const days=Array.from({length:dc},(_,i)=>String(i+1));
  const months=lang==='kz'?['Қаңтар','Ақпан','Наурыз','Сәуір','Мамыр','Маусым','Шілде','Тамыз','Қыркүйек','Қазан','Қараша','Желтоқсан']:MONTHS_RU;
  const years=Array.from({length:80},(_,i)=>String(curY-5-i));
  buildDrum('drum-day-list','drum-day',days,drumState.day-1,v=>{ drumState.day=parseInt(v); updateDobDisplay(); });
  buildDrum('drum-month-list','drum-month',months,drumState.month-1,(v,i)=>{
    drumState.month=i+1;
    const dc2=daysInMonth(drumState.month,drumState.year);
    buildDrum('drum-day-list','drum-day',Array.from({length:dc2},(_,j)=>String(j+1)),Math.min(drumState.day-1,dc2-1),dv=>{ drumState.day=parseInt(dv); updateDobDisplay(); });
    updateDobDisplay();
  });
  buildDrum('drum-year-list','drum-year',years,5,v=>{
    drumState.year=parseInt(v);
    const dc3=daysInMonth(drumState.month,drumState.year);
    buildDrum('drum-day-list','drum-day',Array.from({length:dc3},(_,j)=>String(j+1)),Math.min(drumState.day-1,dc3-1),dv=>{ drumState.day=parseInt(dv); updateDobDisplay(); });
    updateDobDisplay();
  });
  updateDobDisplay();
}

function buildDrum(listId,scrollId,items,initIdx,onChange){
  const list=document.getElementById(listId);
  const scroll=document.getElementById(scrollId);
  if(!list||!scroll) return;
  list.innerHTML='';
  const pad=2;
  for(let p=0;p<pad;p++){ const d=document.createElement('div'); d.className='drum-item'; list.appendChild(d); }
  items.forEach((item,i)=>{ const d=document.createElement('div'); d.className='drum-item'+(i===initIdx?' selected':''); d.textContent=item; list.appendChild(d); });
  for(let p=0;p<pad;p++){ const d=document.createElement('div'); d.className='drum-item'; list.appendChild(d); }
  let cur=Math.max(0,Math.min(items.length-1,initIdx));
  function setIdx(idx,animate=true){
    idx=Math.max(0,Math.min(items.length-1,idx)); cur=idx;
    list.style.transition=animate?'transform .2s cubic-bezier(.25,.46,.45,.94)':'none';
    list.style.transform=`translateY(${-(idx*ITEM_H)}px)`;
    list.querySelectorAll('.drum-item').forEach((el,i)=>el.classList.toggle('selected',i-pad===idx));
    onChange(items[idx],idx);
  }
  setIdx(cur,false);
  let sY=0,sIdx=0,drag=false;
  function onStart(e){ drag=true; sY=(e.touches?.[0]||e).clientY; sIdx=cur; e.preventDefault(); }
  function onMove(e){ if(!drag)return; const dy=sY-(e.touches?.[0]||e).clientY; setIdx(sIdx+Math.round(dy/ITEM_H)); e.preventDefault(); }
  function onEnd(){ drag=false; }
  const clone=scroll.cloneNode(false);
  const hl=document.createElement('div'); hl.className='drum-highlight'; clone.appendChild(hl);
  clone.appendChild(list); scroll.parentNode.replaceChild(clone,scroll);
  clone.addEventListener('mousedown',onStart,{passive:false});
  clone.addEventListener('touchstart',onStart,{passive:false});
  window.addEventListener('mousemove',onMove,{passive:false});
  window.addEventListener('touchmove',onMove,{passive:false});
  window.addEventListener('mouseup',onEnd);
  window.addEventListener('touchend',onEnd);
  clone.addEventListener('wheel',e=>{ e.preventDefault(); setIdx(cur+(e.deltaY>0?1:-1)); },{passive:false});
}

function updateDobDisplay(){
  const el=document.getElementById('dob-display'); if(!el) return;
  const mArr=lang==='kz'?['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан']:MONTHS_GEN;
  el.textContent=`${drumState.day} ${mArr[drumState.month-1]} ${drumState.year} г.`;
}

// ===================== GOOGLE AUTH =====================
function initGoogleAuth(){
  applyLang();
  const saved=localStorage.getItem('darabala_user');
  if(saved){
    try{
      const u=JSON.parse(saved);
      const profileKey='darabala_profile_'+(u.email||u.name);
      const savedProfile=localStorage.getItem(profileKey);
      if(savedProfile){
        const profile=JSON.parse(savedProfile);
        if(profile.avatar&&profile.avatar.id) profile.avatar=AVATARS.find(a=>a.id===profile.avatar.id)||AVATARS[0];
        window._googleUser=u; user=profile;
        const sp=localStorage.getItem('darabala_progress_'+(u.email||u.name));
        if(sp){
          const spd=JSON.parse(sp);
          progressData.english={completed:new Set(spd.english?.completed||[]),streak:spd.english?.streak||0,xp:spd.english?.xp||0};
          progressData.cs={completed:new Set(spd.cs?.completed||[]),streak:spd.cs?.streak||0,xp:spd.cs?.xp||0};
        }
        showWelcomeBack(profile.name); return;
      }
      showReturningUser(u);
    }catch(e){ localStorage.removeItem('darabala_user'); }
  }
  if(window.google&&GOOGLE_CLIENT_ID){
    google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:handleGoogleCredential,auto_select:false});
  }
}

function signInWithGoogle(){
  if(!window.google){ alert('Google Sign-In не загружен. Войдите как гость.'); return; }
  google.accounts.id.prompt(n=>{ if(n.isNotDisplayed()||n.isSkippedMoment()) signInAsGuest(); });
}

function handleGoogleCredential(response){
  const parts=response.credential.split('.');
  const payload=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
  completeLogin({name:payload.name,email:payload.email,picture:payload.picture,source:'google'});
}

function signInAsGuest(){
  completeLogin({name:'Гость '+Math.floor(Math.random()*9000+1000),email:null,picture:null,source:'guest'});
}

function showReturningUser(u){
  const wrap=document.getElementById('login-returning-user');
  document.getElementById('continue-name').textContent=u.name.split(' ')[0];
  document.getElementById('login-user-preview').innerHTML=`<div style="width:44px;height:44px;border-radius:50%;background:#e8f5e9;display:flex;align-items:center;justify-content:center;font-size:22px;border:2px solid #c5e1a5;flex-shrink:0">${u.picture?`<img src="${u.picture}" style="width:44px;height:44px;border-radius:50%;object-fit:cover" referrerpolicy="no-referrer">`:'👤'}</div><div><div style="font-size:15px;font-weight:900;color:#333">${u.name}</div><div style="font-size:12px;color:#aaa;font-weight:700">${u.email||'Гостевой аккаунт'}</div></div>`;
  wrap.style.display='block'; window._savedUser=u;
}

function continueAsUser(){ if(window._savedUser) completeLogin(window._savedUser); }

function completeLogin(googleUser){
  localStorage.setItem('darabala_user',JSON.stringify(googleUser));
  const sp=localStorage.getItem('darabala_progress_'+(googleUser.email||googleUser.name));
  if(sp){ try{ const d=JSON.parse(sp); progressData.english={completed:new Set(d.english?.completed||[]),streak:d.english?.streak||0,xp:d.english?.xp||0}; progressData.cs={completed:new Set(d.cs?.completed||[]),streak:d.cs?.streak||0,xp:d.cs?.xp||0}; }catch(e){} }
  window._googleUser=googleUser;
  const ni=document.getElementById('input-name');
  if(ni&&googleUser.name){ ni.value=googleUser.name.split(' ')[0]; checkStep1(); }
  switchView('subject');
}

function saveProgress(){
  if(!window._googleUser) return;
  const key='darabala_progress_'+(window._googleUser.email||window._googleUser.name);
  localStorage.setItem(key,JSON.stringify({
    english:{completed:[...progressData.english.completed],streak:progressData.english.streak,xp:progressData.english.xp},
    cs:{completed:[...progressData.cs.completed],streak:progressData.cs.streak,xp:progressData.cs.xp}
  }));
}

function signOut(){
  if(confirm('Выйти из аккаунта?')){
    saveProgress(); localStorage.removeItem('darabala_user');
    window._googleUser=null; user=null; location.reload();
  }
}

// ===================== WELCOME =====================
function showWelcomeBack(name){
  const subj=sessionStorage.getItem('darabala_subject');
  if(subj) currentSubject=subj;
  setupChatForUser(); showDashboard();
  setTimeout(()=>{
    document.getElementById('welcome-av').textContent=user?.avatar?.emoji||'🐻';
    document.getElementById('welcome-name').textContent='С возвращением, '+name+'!';
    document.getElementById('welcome-sub').textContent=['Готов учиться? 🚀','Продолжаем! 💪','Сегодня будет интересно! 🌟'][Math.floor(Math.random()*3)];
    document.getElementById('welcome-overlay').classList.add('show');
  },400);
}

function showWelcomeNew(name,av){
  document.getElementById('welcome-av').textContent=av||'🐻';
  document.getElementById('welcome-name').textContent='Добро пожаловать, '+name+'!';
  document.getElementById('welcome-sub').textContent='Погнали учиться! 🚀';
  document.getElementById('welcome-overlay').classList.add('show');
}

function closeWelcome(){
  const ov=document.getElementById('welcome-overlay');
  ov.style.opacity='0'; ov.style.transition='opacity .3s ease';
  setTimeout(()=>{ ov.classList.remove('show'); ov.style.opacity=''; ov.style.transition=''; },300);
}

// ===================== PROFILE =====================
function openProfile(){
  if(!user) return;
  const picWrap=document.getElementById('profile-pic-wrap');
  picWrap.innerHTML=window._googleUser?.picture?`<img src="${window._googleUser.picture}" referrerpolicy="no-referrer"/>`:user.avatar?.emoji||'🐻';
  document.getElementById('profile-uname').textContent=user.name;
  document.getElementById('profile-email').textContent=window._googleUser?.email||'Гостевой аккаунт';
  document.getElementById('profile-xp-en').textContent=progressData.english.xp;
  document.getElementById('profile-xp-cs').textContent=progressData.cs.xp;
  document.getElementById('profile-streak').textContent=Math.max(progressData.english.streak,progressData.cs.streak)+'🔥';
  updateLangBtns();
  document.getElementById('profile-panel').classList.add('open');
  document.getElementById('profile-backdrop').classList.add('show');
}
function closeProfile(){
  document.getElementById('profile-panel').classList.remove('open');
  document.getElementById('profile-backdrop').classList.remove('show');
}

function openAvatarChange(){
  closeProfile();
  const grid=document.getElementById('avatar-modal-grid');
  grid.innerHTML='';
  AVATARS.forEach(av=>{
    const btn=document.createElement('button');
    btn.className='avatar-btn'+(user?.avatar?.id===av.id?' sel':'');
    btn.type='button';
    btn.innerHTML=`<span class="av-emoji">${av.emoji}</span><span class="av-label">${av.name}</span>`;
    btn.addEventListener('click',()=>{
      user.avatar=av;
      if(window._googleUser){ localStorage.setItem('darabala_profile_'+(window._googleUser.email||window._googleUser.name),JSON.stringify(user)); }
      document.getElementById('tb-avatar').textContent=av.emoji;
      document.getElementById('chat-av').textContent=av.emoji;
      document.getElementById('chat-name').textContent=av.name;
      document.getElementById('chat-toggle-emoji').textContent=av.emoji;
      grid.querySelectorAll('.avatar-btn').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel');
    });
    grid.appendChild(btn);
  });
  document.getElementById('avatar-change-modal').classList.add('open');
}
function closeAvatarChange(){ document.getElementById('avatar-change-modal').classList.remove('open'); }

// ===================== LANGUAGE =====================
function setLang(l){ lang=l; localStorage.setItem('darabala_lang',l); applyLang(); }
function applyLang(){
  document.getElementById('lang-ru')?.classList.toggle('active',lang==='ru');
  document.getElementById('lang-kz')?.classList.toggle('active',lang==='kz');
}
function updateLangBtns(){ applyLang(); }

// ===================== SUBJECT =====================
function selectSubject(subj){
  sessionStorage.setItem('darabala_subject',subj); currentSubject=subj;
  const t=document.getElementById('ob-logo-title'); const s=document.getElementById('ob-logo-sub');
  if(subj==='cs'){ if(t)t.textContent='Информатика · Python'; if(s)s.textContent='7 класс · Учимся программировать!'; }
  else           { if(t)t.textContent='DaraBala'; if(s)s.textContent='Давай учиться вместе!'; }
  updateSubjectSwitcher(); switchView('onboarding');
}

function switchSubjectPrompt(){ document.getElementById('subject-overlay').style.display='flex'; }

function changeSubject(subj){
  document.getElementById('subject-overlay').style.display='none';
  currentSubject=subj; sessionStorage.setItem('darabala_subject',subj);
  updateSubjectSwitcher(); buildMap(); setupChatForUser();
}

function updateSubjectSwitcher(){
  document.getElementById('subject-switcher-icon').textContent=currentSubject==='cs'?'🐍':'🇬🇧';
  document.getElementById('subject-switcher-label').textContent=currentSubject==='cs'?'Python':'Английский';
}

// ===================== DASHBOARD =====================
function showDashboard(){
  switchView('dashboard');
  document.getElementById('tb-avatar').textContent=user?.avatar?.emoji||'🐻';
  document.getElementById('tb-name').textContent=user?.name||'';
  updateTopbar(); updateSubjectSwitcher(); buildMap(); generateDashboardStory();
}

function updateTopbar(){
  const p=prog();
  document.getElementById('xp-val').textContent=p.xp+' XP';
  document.getElementById('streak-val').textContent=p.streak;
  const sp=document.getElementById('stat-streak'); const fi=document.getElementById('flame-icon');
  if(p.streak>0){ sp.classList.remove('dead'); fi.setAttribute('fill','currentColor'); fi.setAttribute('stroke','none'); }
  else { sp.classList.add('dead'); fi.setAttribute('fill','none'); fi.setAttribute('stroke','currentColor'); }
}

function buildMap(){
  const container=document.getElementById('map-container'); container.innerHTML='';
  const mods=currentSubject==='cs'?CS_MODULES:MODULES; const p=prog();
  mods.forEach((mod,mi)=>{
    const mh=document.createElement('div'); mh.className='module-header mc-'+(mi%9);
    mh.innerHTML=`<div style="position:relative;z-index:1"><h3>Unit ${mod.id} ${mod.icon}</h3><p>${mod.title}${mod.par?' · '+mod.par:''}</p></div><div class="mod-icon">${mod.icon}</div>`;
    mh.style.animation=`fadeSlide .4s ease ${mi*0.08}s both`; container.appendChild(mh);
    const col=document.createElement('div'); col.className='lessons-col';
    const key='mod_'+mi; const done=p.completed.has(key); const locked=mi>0&&!p.completed.has('mod_'+(mi-1));
    const wrap=document.createElement('div'); wrap.className='node-wrap'; wrap.style.marginBottom='10px';
    const btn=document.createElement('button');
    btn.className='lesson-node'+(done?' done':locked?' locked':' mc-'+(mi%9));
    btn.style.animation=`popIn .4s cubic-bezier(.175,.885,.32,1.275) ${mi*0.1}s both`;
    btn.disabled=locked; btn.innerHTML=done?'⭐':locked?'🔒':mod.icon;
    if(!locked) btn.onclick=()=>startLesson(mi,key);
    const badge=document.createElement('div');
    badge.style.cssText=`text-align:center;font-size:12px;font-weight:800;margin-top:6px;color:${done?'#8bc34a':locked?'#bbb':'#666'}`;
    badge.textContent=done?'Пройдено ✓':locked?'Закрыто':`${mod.lessons.length} вопросов`;
    wrap.appendChild(btn); wrap.appendChild(badge); col.appendChild(wrap); container.appendChild(col);
  });
}

// ===================== AI STORY =====================
async function generateDashboardStory(){
  const stEl=document.getElementById('dashboard-story'); if(!stEl||!user) return;
  const mods=currentSubject==='cs'?CS_MODULES:MODULES; const p=prog(); let midx=0;
  for(let i=0;i<mods.length;i++){ if(!p.completed.has('mod_'+i)){midx=i;break;} }
  const mod=mods[midx];
  stEl.style.display='block';
  stEl.innerHTML=`<div style="font-size:13px;font-weight:800;color:#8bc34a;margin-bottom:6px">📖 История урока</div><div style="color:#ccc;font-size:13px;font-style:italic">Генерирую историю...</div>`;
  try{
    const resp=await fetch(WORKER_URL+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`Напиши историю РОВНО 2 предложения на русском языке для темы "${mod.title}". Вставь имя "${user.name}". Только текст, без заголовка, максимум 200 символов.`})});
    const data=await resp.json();
    if(data.reply){
      const t=currentTeacher(); const txt=data.reply.slice(0,300);
      stEl.innerHTML=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:22px">${t.emoji}</span><span style="font-size:13px;font-weight:900;color:#8bc34a">📖 История урока</span></div><div style="font-size:14px;line-height:1.6;color:#444;font-weight:700" id="_story_text">${txt}</div>`;
      window._currentStoryText=txt;
    } else stEl.style.display='none';
  }catch(e){ stEl.style.display='none'; }
}

// ===================== UTILS =====================
function speakWord(word){
  if(!window.speechSynthesis) return;
  const utt=new SpeechSynthesisUtterance(word); utt.lang='en-US'; utt.rate=0.85;
  window.speechSynthesis.cancel(); window.speechSynthesis.speak(utt);
}

function switchView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const next=document.getElementById('view-'+name);
  if(next){ next.classList.add('active'); window.scrollTo(0,0); }
  const cw=document.getElementById('chat-widget');
  if(cw) cw.style.display=(name==='lesson'||name==='complete')?'none':(user?'block':'none');
}

function spawnConfetti(count=40){
  const colors=['#8bc34a','#ffc107','#42a5f5','#ef5350','#ab47bc','#ff9800'];
  for(let i=0;i<count;i++){
    const p=document.createElement('div'); p.className='confetti-piece';
    p.style.cssText=`left:${Math.random()*100}vw;top:-20px;background:${colors[Math.floor(Math.random()*colors.length)]};transform:rotate(${Math.random()*360}deg);animation:confettiFall ${1+Math.random()*2}s ease-in ${Math.random()*0.5}s forwards`;
    document.body.appendChild(p); setTimeout(()=>p.remove(),3000);
  }
}
