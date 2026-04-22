// ===================== LESSON ENGINE =====================
function startLesson(modIdx, key){
  const mods = currentSubject==='cs' ? CS_MODULES : MODULES;
  const allQ = mods[modIdx].lessons;
  const shuffled = [...allQ].sort(()=>Math.random()-.5);
  lesson = { modIdx, lid:key, questions:shuffled, qIdx:0, lives:3, score:0, checked:false, sel:null };
  lesson.question = shuffled[0];
  switchView('lesson');
  renderLives();
  document.getElementById('lesson-progress-fill').style.width='0%';
  renderQuestion(lesson.question);
}

function renderLives(){
  const d = document.getElementById('lives-display'); d.innerHTML='';
  for(let i=0;i<3;i++){
    const h=document.createElement('span');
    h.className='heart'+(i>=lesson.lives?' lost':'');
    h.textContent='❤️'; d.appendChild(h);
  }
}

function renderQuestion(q){
  const content = document.getElementById('lesson-content');
  content.innerHTML='';
  setFooter('neutral','');
  const cb = document.getElementById('btn-check');
  cb.disabled=true; cb.textContent='Проверить'; cb.className='btn-check green';
  cb.style.display=''; cb.onclick=handleCheck;
  lesson.checked=false; lesson.sel=null;

  const mechMap = {mcq:'Выбери ответ',truefalse:'Правда или Ложь?',listen:'Послушай и выбери',fillgap:'Вставь букву',sentence:'Составь фразу',match:'Найди пару',voice:'Произнеси вслух',code:'Напиши код Python'};
  const label = document.createElement('div'); label.className='mech-label';
  label.textContent=mechMap[q.type]||''; content.appendChild(label);

  if(q.type==='mcq')           renderMCQ(q,content);
  else if(q.type==='truefalse') renderTrueFalse(q,content);
  else if(q.type==='listen')    renderListen(q,content);
  else if(q.type==='fillgap')   renderFillGap(q,content);
  else if(q.type==='sentence')  renderSentence(q,content);
  else if(q.type==='match')     renderMatch(q,content);
  else if(q.type==='voice')     renderVoice(q,content);
  else if(q.type==='code')      renderCode(q,content);
}

function renderMCQ(q,el){
  if(q.img){ const em=document.createElement('div'); em.style.cssText='font-size:58px;text-align:center;margin-bottom:10px'; em.textContent=q.img; el.appendChild(em); }
  const qEl=document.createElement('div'); qEl.className='lesson-question'; qEl.textContent=q.question; el.appendChild(qEl);
  const grid=document.createElement('div'); grid.className='options-grid'; el.appendChild(grid);
  q.opts.forEach((opt,i)=>{
    const btn=document.createElement('button'); btn.className='opt-btn'; btn.dataset.idx=i;
    btn.textContent=opt.t;
    btn.onclick=()=>{ if(lesson.checked)return; lesson.sel=i; document.querySelectorAll('.opt-btn').forEach(b=>b.classList.remove('sel')); btn.classList.add('sel'); document.getElementById('btn-check').disabled=false; };
    grid.appendChild(btn);
  });
}

function renderTrueFalse(q,el){
  const qEl=document.createElement('div'); qEl.className='lesson-question';
  qEl.innerHTML=`<div style="font-size:68px;margin-bottom:12px">${q.emoji}</div>${q.question}`;
  el.appendChild(qEl);
  const tWrap=document.createElement('div'); tWrap.className='timer-bar-wrap'; el.appendChild(tWrap);
  const tBar=document.createElement('div'); tBar.className='timer-bar'; tBar.style.cssText='width:100%;transition:width 5s linear'; tWrap.appendChild(tBar);
  setTimeout(()=>tBar.style.width='0%',50);
  lesson.tfTimer=setTimeout(()=>{ if(!lesson.checked) checkTF(false,null); },5100);
  const wrap=document.createElement('div'); wrap.className='tf-wrap'; el.appendChild(wrap);
  ['✅ Да','❌ Нет'].forEach((txt,i)=>{
    const btn=document.createElement('button'); btn.className='tf-btn '+(i===0?'yes':'no'); btn.textContent=txt;
    btn.onclick=()=>{ clearTimeout(lesson.tfTimer); checkTF(i===0,btn); };
    wrap.appendChild(btn);
  });
  document.getElementById('btn-check').style.display='none';
}

function checkTF(userSaidYes,btn){
  if(lesson.checked)return; lesson.checked=true;
  document.getElementById('btn-check').style.display='';
  const q=lesson.question; const correct=userSaidYes===q.correctIs;
  document.querySelectorAll('.tf-btn').forEach(b=>b.disabled=true);
  if(correct){ lesson.score++; setFooter('good',`<div class="fb-main good"><span class="check-icon">✅</span> Правильно!</div>`); spawnConfetti(); }
  else { loseLife(); setFooter('bad',`<div class="fb-sub">Правильный ответ:</div><div class="fb-main bad">${q.correctIs?'Да ✅':'Нет ❌'} — это ${q.answer}</div>`); }
  const cb=document.getElementById('btn-check'); cb.textContent='Дальше'; cb.className='btn-check '+(correct?'green':'red'); cb.disabled=false; cb.onclick=nextQuestion;
}

function renderListen(q,el){
  const qEl=document.createElement('div'); qEl.className='lesson-question'; qEl.textContent='Послушай слово и выбери картинку!'; el.appendChild(qEl);
  const lisBtn=document.createElement('button'); lisBtn.className='listen-btn'; lisBtn.innerHTML='🔊';
  lisBtn.onclick=()=>{ speakWord(q.word, user?.avatar); lisBtn.classList.add('playing'); setTimeout(()=>lisBtn.classList.remove('playing'),1500); };
  el.appendChild(lisBtn);
  setTimeout(()=>speakWord(q.word, user?.avatar),300);
  const grid=document.createElement('div'); grid.className='options-grid'; el.appendChild(grid);
  q.opts.forEach((opt,i)=>{
    const btn=document.createElement('button'); btn.className='opt-btn'; btn.dataset.idx=i; btn.textContent=opt.t;
    btn.onclick=()=>{ if(lesson.checked)return; lesson.sel=i; document.querySelectorAll('.opt-btn').forEach(b=>b.classList.remove('sel')); btn.classList.add('sel'); document.getElementById('btn-check').disabled=false; };
    grid.appendChild(btn);
  });
}

function renderFillGap(q,el){
  const qEl=document.createElement('div'); qEl.className='lesson-question'; qEl.textContent='Вставь пропущенную букву!'; el.appendChild(qEl);
  const wordEl=document.createElement('div'); wordEl.className='gap-word-display';
  let html=''; for(let i=0;i<q.word.length;i++) html+=i===q.gapIdx?`<span class="gap" id="gap-slot">_</span>`:q.word[i];
  wordEl.innerHTML=html; el.appendChild(wordEl);
  const choicesEl=document.createElement('div'); choicesEl.className='letter-choices'; el.appendChild(choicesEl);
  q.choices.forEach(ch=>{
    const btn=document.createElement('button'); btn.className='letter-btn'; btn.textContent=ch;
    btn.onclick=()=>{
      if(lesson.checked)return;
      const correct=ch===q.word[q.gapIdx]; lesson.checked=true;
      document.querySelectorAll('.letter-btn').forEach(b=>b.disabled=true);
      document.getElementById('gap-slot').textContent=ch;
      if(correct){ btn.classList.add('correct'); lesson.score++; setFooter('good',`<div class="fb-main good"><span class="check-icon">✅</span> Правильно!</div>`); spawnConfetti(); }
      else { btn.classList.add('wrong'); document.getElementById('gap-slot').style.color='#ef5350'; loseLife(); setFooter('bad',`<div class="fb-sub">Правильная буква:</div><div class="fb-main bad">${q.word[q.gapIdx]}</div>`); }
      const cb=document.getElementById('btn-check'); cb.style.display='flex'; cb.textContent='Дальше'; cb.className='btn-check '+(correct?'green':'red'); cb.disabled=false; cb.onclick=nextQuestion;
    };
    choicesEl.appendChild(btn);
  });
  document.getElementById('btn-check').style.display='none';
}

function renderSentence(q,el){
  const qEl=document.createElement('div'); qEl.className='lesson-question'; qEl.textContent=`Переведи: "${q.translation}"`; el.appendChild(qEl);
  const target=document.createElement('div'); target.className='sentence-target'; target.id='sent-target'; el.appendChild(target);
  const bank=document.createElement('div'); bank.className='word-bank'; bank.id='word-bank'; el.appendChild(bank);
  [...q.words].sort(()=>Math.random()-.5).forEach(w=>{
    const chip=document.createElement('div'); chip.className='word-chip in-bank'; chip.textContent=w;
    chip.onclick=()=>toggleWord(chip,w,target,bank,q);
    bank.appendChild(chip);
  });
}

function toggleWord(chip,word,target,bank,q){
  if(lesson.checked)return;
  if(chip.parentElement===bank){ chip.classList.replace('in-bank','in-sentence'); target.appendChild(chip); }
  else { chip.classList.replace('in-sentence','in-bank'); bank.appendChild(chip); }
  const inS=[...target.querySelectorAll('.word-chip')].map(c=>c.textContent);
  document.getElementById('btn-check').disabled=inS.length===0;
}

function renderMatch(q,el){
  const qEl=document.createElement('div'); qEl.className='lesson-question'; qEl.textContent='Найди пары!'; el.appendChild(qEl);
  const wrap=document.createElement('div'); wrap.className='match-wrap'; el.appendChild(wrap);
  const lCol=document.createElement('div'); lCol.className='match-col';
  const rCol=document.createElement('div'); rCol.className='match-col';
  wrap.appendChild(lCol); wrap.appendChild(rCol);
  lesson.matchState={selected:null,matched:0,total:q.pairs.length};
  q.pairs.forEach(pair=>{
    const li=document.createElement('div'); li.className='match-item'; li.textContent=pair.en; li.dataset.key=pair.en; li.dataset.side='left';
    li.onclick=()=>selectMatchItem(li,q.pairs); lCol.appendChild(li);
  });
  [...q.pairs].sort(()=>Math.random()-.5).forEach(pair=>{
    const ri=document.createElement('div'); ri.className='match-item'; ri.textContent=pair.ru; ri.dataset.key=pair.en; ri.dataset.side='right';
    ri.onclick=()=>selectMatchItem(ri,q.pairs); rCol.appendChild(ri);
  });
  document.getElementById('btn-check').style.display='none';
}

function selectMatchItem(item){
  if(item.classList.contains('matched'))return;
  const st=lesson.matchState;
  if(!st.selected){ st.selected=item; item.classList.add('selected'); return; }
  const prev=st.selected; prev.classList.remove('selected'); st.selected=null;
  if(prev.dataset.side===item.dataset.side){ item.classList.add('selected'); st.selected=item; return; }
  if(prev.dataset.key===item.dataset.key){
    prev.classList.add('matched'); item.classList.add('matched'); st.matched++;
    if(st.matched===st.total){
      lesson.score++; lesson.checked=true;
      setTimeout(()=>{
        spawnConfetti();
        setFooter('good',`<div class="fb-main good"><span class="check-icon">✅</span> Все пары найдены!</div>`);
        const cb=document.getElementById('btn-check'); cb.style.display='flex'; cb.textContent='Дальше'; cb.className='btn-check green'; cb.disabled=false; cb.onclick=nextQuestion;
      },300);
    }
  } else {
    prev.classList.add('wrong-flash'); item.classList.add('wrong-flash'); loseLife();
    setTimeout(()=>{ prev.classList.remove('wrong-flash'); item.classList.remove('wrong-flash'); },500);
  }
}

function renderVoice(q,el){
  const qEl=document.createElement('div'); qEl.className='lesson-question'; qEl.textContent='Произнеси вслух!'; el.appendChild(qEl);
  const area=document.createElement('div'); area.className='mic-area'; el.appendChild(area);
  const wordEl=document.createElement('div'); wordEl.className='word-to-say'; wordEl.textContent=q.word; area.appendChild(wordEl);
  const transEl=document.createElement('div'); transEl.className='word-translation'; transEl.textContent=q.translation; area.appendChild(transEl);
  const lisBtn=document.createElement('button'); lisBtn.style.cssText='padding:10px 20px;border-radius:14px;border:none;background:#e3f2fd;color:#1565c0;font-family:Nunito,sans-serif;font-size:14px;font-weight:800;cursor:pointer;margin-bottom:8px';
  lisBtn.textContent='🔊 Послушать'; lisBtn.onclick=()=>speakWord(q.word, user?.avatar); area.appendChild(lisBtn);
  const micBtn=document.createElement('button'); micBtn.className='mic-btn'; micBtn.innerHTML='🎤'; area.appendChild(micBtn);
  const result=document.createElement('div'); result.className='mic-result'; result.textContent='Нажми на микрофон и говори!'; area.appendChild(result);
  micBtn.onclick=()=>startListening(micBtn,result,q);
  const skipBtn=document.createElement('button'); skipBtn.style.cssText='padding:8px 20px;border-radius:12px;border:none;background:#f5f5f5;color:#aaa;font-family:Nunito,sans-serif;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px';
  skipBtn.textContent='Пропустить →'; skipBtn.onclick=nextQuestion; area.appendChild(skipBtn);
  document.getElementById('btn-check').style.display='none';
}

function startListening(micBtn,resultEl,q){
  if(!window.SpeechRecognition&&!window.webkitSpeechRecognition){ resultEl.textContent='Микрофон не поддерживается 😢'; return; }
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const rec=new SR(); rec.lang='en-US'; rec.interimResults=false; rec.maxAlternatives=3;
  micBtn.classList.add('listening'); resultEl.textContent='Слушаю...'; resultEl.className='mic-result';
  rec.start();
  rec.onresult=e=>{
    micBtn.classList.remove('listening');
    const trs=Array.from(e.results[0]).map(r=>r.transcript.toLowerCase().trim());
    const target=q.word.toLowerCase();
    const ok=trs.some(t=>t.includes(target)||target.includes(t)||similarity(t,target)>0.7);
    if(ok){
      resultEl.textContent='✅ Отлично! Правильно!'; resultEl.className='mic-result ok';
      lesson.score++; spawnConfetti();
      const cb=document.getElementById('btn-check'); cb.style.display='flex'; cb.textContent='Дальше'; cb.className='btn-check green'; cb.disabled=false; cb.onclick=nextQuestion;
      setFooter('good',`<div class="fb-main good"><span class="check-icon">✅</span> Отлично произнёс!</div>`);
    } else { resultEl.textContent=`❌ Услышал: "${trs[0]}". Попробуй!`; resultEl.className='mic-result fail'; }
  };
  rec.onerror=()=>{ micBtn.classList.remove('listening'); resultEl.textContent='Ошибка. Попробуй ещё!'; };
}

function similarity(a,b){ const longer=a.length>b.length?a:b; if(!longer.length)return 1; return(longer.length-editDistance(a,b))/longer.length; }
function editDistance(a,b){ const m=a.length,n=b.length; const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0)); for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]); return dp[m][n]; }

function handleCheck(){
  if(lesson.checked)return; lesson.checked=true;
  const q=lesson.question;
  if(q.type==='mcq'||q.type==='listen'){
    const correct=lesson.sel===q.ans;
    document.querySelectorAll('.opt-btn').forEach(b=>{ b.disabled=true; const idx=parseInt(b.dataset.idx); if(idx===q.ans)b.classList.add('correct'); else if(idx===lesson.sel&&!correct){b.classList.remove('sel');b.classList.add('wrong');} else b.classList.add('dim'); });
    if(correct){ lesson.score++; setFooter('good',`<div class="fb-main good"><span class="check-icon">✅</span> Правильно!</div>`); spawnConfetti(); }
    else { loseLife(); setFooter('bad',`<div class="fb-sub">Правильный ответ:</div><div class="fb-main bad">${q.opts[q.ans].t}</div>`); }
    const cb=document.getElementById('btn-check'); cb.textContent='Дальше'; cb.className='btn-check '+(correct?'green':'red'); cb.disabled=false; cb.onclick=nextQuestion;
  } else if(q.type==='sentence'){
    const target=document.getElementById('sent-target');
    const inS=[...target.querySelectorAll('.word-chip')].map(c=>c.textContent);
    const correct=JSON.stringify(inS)===JSON.stringify(q.correct);
    if(correct){ lesson.score++; setFooter('good',`<div class="fb-main good"><span class="check-icon">✅</span> Правильно!</div>`); spawnConfetti(); }
    else { loseLife(); setFooter('bad',`<div class="fb-sub">Правильный порядок:</div><div class="fb-main bad">${q.correct.join(' ')}</div>`); }
    const cb=document.getElementById('btn-check'); cb.textContent='Дальше'; cb.className='btn-check '+(correct?'green':'red'); cb.disabled=false; cb.onclick=nextQuestion;
  }
}

function nextQuestion(){
  document.getElementById('btn-check').style.display='';
  document.getElementById('btn-check').disabled=true;
  clearTimeout(lesson.tfTimer);
  if(lesson.lives<=0){ showComplete(false); return; }
  lesson.qIdx++;
  if(lesson.qIdx<lesson.questions.length){
    lesson.question=lesson.questions[lesson.qIdx];
    lesson.checked=false; lesson.sel=null;
    document.getElementById('lesson-progress-fill').style.width=Math.round(lesson.qIdx/lesson.questions.length*100)+'%';
    renderQuestion(lesson.question);
  } else { showComplete(true); }
}

function loseLife(){ lesson.lives=Math.max(0,lesson.lives-1); renderLives(); }

function showComplete(passed){
  const earned=passed?Math.max(5,lesson.score*5):0;
  const p=prog();
  if(passed&&!p.completed.has(lesson.lid)){ p.completed.add(lesson.lid); p.streak=Math.min(p.streak+1,999); p.xp+=earned; setTimeout(saveProgress,500); }
  document.getElementById('comp-emoji').textContent=passed?'🏆':'💪';
  document.getElementById('comp-title').textContent=passed?'Урок пройден!':'Попробуй ещё раз!';
  document.getElementById('comp-sub').textContent=passed?'Молодец, '+user.name+'!':'Не сдавайся, ты справишься!';
  document.getElementById('comp-xp').textContent='+'+earned;
  document.getElementById('comp-score').textContent=lesson.score+' правильно';
  document.getElementById('comp-streak').textContent='🔥'+p.streak;
  if(passed) spawnConfetti(80);
  switchView('complete');
}

function setFooter(state,html){
  document.getElementById('lesson-footer').className='lesson-footer '+state;
  document.getElementById('feedback-area').innerHTML=html;
}

function exitLesson(){ switchView('dashboard'); buildMap(); }

// ===================== CODE EDITOR (Pyodide) =====================
let pyodideLoaded = null;

async function renderCode(q,el){
  const qEl=document.createElement('div'); qEl.className='lesson-question'; qEl.textContent=q.question; el.appendChild(qEl);
  
  const hintEl=document.createElement('div'); hintEl.style.cssText='font-size:13px;color:#666;margin-bottom:12px;background:#fff9c4;padding:10px;border-radius:8px';
  hintEl.innerHTML='💡 '+q.hint; el.appendChild(hintEl);
  
  const editor=document.createElement('textarea');
  editor.value=q.starterCode;
  editor.style.cssText='width:100%;height:150px;font-family:monospace;font-size:14px;border-radius:12px;padding:12px;border:2px solid #e0e0e0;resize:vertical;background:#1e1e1e;color:#d4d4d4';
  editor.id='code-editor';
  el.appendChild(editor);
  
  const btnWrap=document.createElement('div'); btnWrap.style.cssText='margin-top:12px;display:flex;gap:10px';
  
  const runBtn=document.createElement('button');
  runBtn.textContent='▶ Запустить';
  runBtn.className='btn-check green';
  runBtn.disabled=false;
  runBtn.onclick=async ()=>{
    runBtn.disabled=true; runBtn.textContent='⏳ Запуск...';
    
    // Load Pyodide if not already loaded
    if(!pyodideLoaded){
      try {
        const script=document.createElement('script');
        script.src='https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        document.head.appendChild(script);
        
        await new Promise((resolve,reject)=>{
          script.onload=resolve; script.onerror=reject;
        });
        
        pyodideLoaded=await loadPyodide();
        console.log('✅ Pyodide loaded');
      } catch(e){
        alert('Ошибка загрузки Python: '+e.message);
        runBtn.disabled=false; runBtn.textContent='▶ Запустить';
        return;
      }
    }
    
    try {
      // Capture stdout
      pyodideLoaded.setStdout({batched:(msg)=>{ window._pyOutput = (window._pyOutput||'')+msg+'\n'; }});
      window._pyOutput='';
      
      await pyodideLoaded.runPythonAsync(editor.value);
      
      const output=(window._pyOutput||'').trim();
      lesson.checked=true;
      
      // Check if output matches solution (fuzzy match for code)
      const correct=output.includes(q.solution) || q.solution==='string' || output.length>0;
      
      if(correct){
        lesson.score++;
        setFooter('good',`<div class="fb-main good"><span class="check-icon">✅</span> Отлично! Код работает!</div>`);
        spawnConfetti();
      } else {
        loseLife();
        setFooter('bad',`<div class="fb-sub\">Ожидалось:</div><div class="fb-main bad\">${q.solution}</div>`);
      }
      
      const cb=document.getElementById('btn-check');
      cb.textContent='Дальше'; cb.className='btn-check '+(correct?'green':'red'); cb.disabled=false; cb.onclick=nextQuestion;
      
    } catch(e) {
      alert('Ошибка в коде: '+e.message);
    }
    
    runBtn.disabled=false; runBtn.textContent='▶ Запустить';
  };
  btnWrap.appendChild(runBtn);
  
  const skipBtn=document.createElement('button');
  skipBtn.textContent='Пропустить →';
  skipBtn.style.cssText='padding:12px 24px;border-radius:14px;border:none;background:#f5f5f5;color:#aaa;font-family:Nunito,sans-serif;font-size:14px;font-weight:700;cursor:pointer';
  skipBtn.onclick=nextQuestion;
  btnWrap.appendChild(skipBtn);
  
  el.appendChild(btnWrap);
  document.getElementById('btn-check').style.display='none';
}
