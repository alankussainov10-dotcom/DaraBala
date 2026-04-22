// ===================== CHAT =====================
let chatOpen = false;
let chatWaiting = false;
let chatHistories = { english: [], cs: [] };

function toggleChat(){
  chatOpen=!chatOpen;
  document.getElementById('chat-box').classList.toggle('open',chatOpen);
  document.getElementById('chat-dot').classList.remove('show');
  if(chatOpen) setTimeout(()=>document.getElementById('chat-input').focus(),100);
}

function addBotMessage(text){
  const msgs=document.getElementById('chat-messages');
  const div=document.createElement('div'); div.className='msg bot';
  div.innerHTML=`<div class="msg-av">${currentTeacher()?.emoji||'🤖'}</div><div class="msg-bubble">${text}</div>`;
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight;
}

function addUserMessage(text){
  const msgs=document.getElementById('chat-messages');
  const div=document.createElement('div'); div.className='msg user';
  div.innerHTML=`<div class="msg-bubble">${text}</div>`;
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight;
}

function showTyping(){
  const msgs=document.getElementById('chat-messages');
  const div=document.createElement('div'); div.className='msg bot'; div.id='typing-msg';
  div.innerHTML=`<div class="msg-av">${currentTeacher()?.emoji||'🤖'}</div><div class="typing-indicator"><span></span><span></span><span></span></div>`;
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight;
}

function removeTyping(){ const t=document.getElementById('typing-msg'); if(t)t.remove(); }

function setupChatForUser(){
  if(!user) return;
  const av = currentTeacher();
  document.getElementById('chat-av').textContent = av.emoji;
  document.getElementById('chat-name').textContent = av.name;
  document.getElementById('chat-toggle-emoji').textContent = av.emoji;
  document.getElementById('chat-widget').style.display = 'block';
  updateChatChips();
  // Send greeting
  const msgs = document.getElementById('chat-messages');
  if(msgs) msgs.innerHTML = '';
  setTimeout(()=>{
    addBotMessage(av.greet(user.name));
    document.getElementById('chat-dot').classList.add('show');
  }, 800);
}

function updateChatChips(){
  const chips = currentSubject==='cs'
    ? ['Объясни if/else','Что такое функция?','Помоги с ошибкой','Объясни range()']
    : ['Как сказать привет?','Что значит слово?','Объясни правило','Приведи пример'];
  const el = document.getElementById('chat-chips');
  if(!el) return;
  el.innerHTML='';
  chips.forEach(c=>{
    const chip=document.createElement('button');
    chip.style.cssText='padding:5px 12px;border-radius:12px;border:1.5px solid #c5e1a5;background:#f1f8e9;font-family:Nunito,sans-serif;font-size:12px;font-weight:800;color:#558b2f;cursor:pointer;white-space:nowrap';
    chip.textContent=c;
    chip.onclick=()=>{ document.getElementById('chat-input').value=c; sendChat(); };
    el.appendChild(chip);
  });
}

async function sendChat(){
  const input=document.getElementById('chat-input');
  const text=input.value.trim(); if(!text||chatWaiting)return;
  input.value=''; chatWaiting=true;
  document.getElementById('chat-send-btn').disabled=true;
  const teacher=currentTeacher();
  chatHistories[currentSubject].push({role:'user',content:text});
  addUserMessage(text); showTyping();
  const hist=chatHistories[currentSubject].slice(-6).map(m=>(m.role==='user'?'Ученик: ':'Учитель: ')+m.content).join('\n');
  const msg=teacher.sp(user?.name||'Ученик')+'\n\n'+hist+'\nУченик: '+text;
  try{
    const response=await fetch(WORKER_URL+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
    const data=await response.json(); removeTyping();
    const reply=data.reply||'Упс! 😅';
    chatHistories[currentSubject].push({role:'assistant',content:reply});
    addBotMessage(reply);
    if(!chatOpen){ document.getElementById('chat-dot').classList.add('show'); }
  }catch(e){ removeTyping(); addBotMessage('Ой, не могу ответить сейчас 😅'); }
  chatWaiting=false; document.getElementById('chat-send-btn').disabled=false;
}
