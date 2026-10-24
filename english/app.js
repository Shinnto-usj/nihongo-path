import {tracks, lessons, diagnostic} from './content/course.js';
import {listening, speaking, resources, benchmarks} from './content/studio.js';
import {pronunciation} from './content/pronunciation.js';
import {normalizePronunciationText, createPronunciationPlayer} from './lib/pronunciation.js';
import {STORAGE_KEY, defaultState, loadState, saveState, importState, exportState, localDate, getStreak, dueCards, reviewCard, recordLesson, recordPractice, recordBaseline, saveDraft, getDailyPlan} from './lib/engine.js';

const $=selector=>document.querySelector(selector);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={today:'M3 10 12 3l9 7M5 9v11h5v-6h4v6h5V9',lessons:'M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1m0-15c3-2 6-2 9-1v15c-3-1-6-1-9 1V6',listening:'M4 14v-3a8 8 0 0 1 16 0v3M4 12H2v7h4v-7H4m16 0h2v7h-4v-7h2',speaking:'M9 4a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0V4M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8',review:'M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5',journal:'M4 20V10m6 10V4m6 16v-7m5 7H1',arrow:'M4 12h15m-6-6 6 6-6 6',play:'m9 5 11 7-11 7V5',check:'m5 12 4 4L20 5',close:'m6 6 12 12M18 6 6 18',clock:'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',settings:'M4 7h16M4 17h16M8 4v6m8 4v6'};
const icon=(name,size=18)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name]||icons.arrow}"/></svg>`;
const navigation=[['today','Today','今日练习'],['lessons','Expression','表达精修'],['listening','Listening','听懂话外之音'],['speaking','Speaking','开口练习'],['review','Recall','表达复习'],['journal','Journal','样本与记录']];
const lessonMap=new Map(lessons.map(item=>[item.id,item]));
const chunks=lessons.flatMap(lesson=>lesson.chunks.map(chunk=>({...chunk,lessonId:lesson.id})));
const chunkMap=new Map(chunks.map(chunk=>[chunk.id,chunk]));
let state,rawAtLoad=null,lastSaved=null,storageBlocked=false,storageConflict=false,storageError='',dirty=false;
try{rawAtLoad=localStorage.getItem(STORAGE_KEY);lastSaved=rawAtLoad;state=loadState();if(loadState.lastError)storageError='浏览器未能读取本地存储；请导出备份后再关闭页面。';}
catch(error){state=defaultState();storageBlocked=true;storageError='现有进度无法读取，已暂停写入，避免覆盖原记录。请先导出原始记录，再导入有效备份。';}
let route='today',filter='all',session=null,reviewSession=null,draftTimer=null,toastTimer=null;
let speechRequest=0,speechUtterance=null,recordingRequest=0,mediaRecorder=null,mediaStream=null,recordingChunks=[],recordingUrl='',recordingPending=false;
let activeSpeechKey='',activeSpeechMessage='';
const voiceSampleText='What I find interesting is the gap between what we expect and what we see.';
const pronunciationPlayer=createSpeechPlayer();
let lastFocus=null;
const dialog=$('#practice-dialog');
const minutesText=n=>Number(n||0).toLocaleString('zh-CN',{maximumFractionDigits:1});
const wordCount=text=>(String(text||'').match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).length;
const dateLabel=(value,short=false)=>{try{return new Intl.DateTimeFormat('zh-CN',{timeZone:state.profile.timeZone,month:'short',day:'numeric',...(short?{}:{weekday:'long'})}).format(new Date(value));}catch{return '';}};
const getDraft=id=>state.drafts[id]?.text||'';
const dateNow=()=>localDate(new Date(),state.profile.timeZone);
const isPassed=id=>Boolean(state.lessons[id]?.passed);

function toast(message){clearTimeout(toastTimer);const inDialog=dialog.open;const target=inDialog?$('#session-message'):$('#toast');if(!target)return;target.textContent=message;target.hidden=false;toastTimer=setTimeout(()=>{target.hidden=true;},5000);}
function storageBanner(){const el=$('#storage-warning');el.hidden=!storageError;if(storageError)el.innerHTML=`${escape(storageError)} <button data-action="export">导出当前备份</button>${rawAtLoad?'<button data-action="export-raw">导出原始记录</button>':''}${storageConflict?'<button data-action="reload">重新载入</button>':''}`;$('#storage-status').innerHTML=`<span class="status-dot"></span>${storageError?'当前记录需备份':'进度保存在此浏览器'}`;}
function persist({replace=false}={}){
  dirty=true;
  if((storageBlocked||storageConflict)&&!replace){storageBanner();return false;}
  try{
    const current=localStorage.getItem(STORAGE_KEY);
    if(!replace&&current!==lastSaved){storageConflict=true;storageError='另一个标签页修改了进度，已暂停覆盖。导出当前练习后重新载入，可保留两边的记录。';storageBanner();return false;}
    const ok=saveState(state);
    if(!ok){storageError='浏览器未能保存这次修改。当前页面仍可练习，请及时导出备份。';storageBanner();return false;}
    lastSaved=localStorage.getItem(STORAGE_KEY);storageError='';storageBlocked=false;storageConflict=false;dirty=false;storageBanner();return true;
  }catch{storageError='本地存储不可用，当前进度仅保留在本页；请导出备份。';storageBanner();return false;}
}
function totalMinutes(day){
  let total=0;
  const include=at=>!day||localDate(new Date(at),state.profile.timeZone)===day;
  for(const item of Object.values(state.lessons))for(const attempt of item.history||[])if(include(attempt.at))total+=attempt.minutes||0;
  for(const item of state.practice)if(include(item.at))total+=item.minutes||0;
  return total;
}
function header(kicker,title,description,extra=''){return `<div class="page-heading"><div><span class="eyebrow">${escape(kicker)}</span><h1>${escape(title)}</h1><p>${escape(description)}</p></div>${extra}</div>`;}
function button(label,action,id='',kind=''){return `<button class="btn ${kind}" data-action="${action}"${id?` data-id="${escape(id)}"`:''}>${label}</button>`;}
function page(){
  const hash=location.hash.slice(1);route=[...navigation.map(n=>n[0]),'settings','about'].includes(hash)?hash:'today';
  $('#navigation').innerHTML=navigation.map(([id,en,cn])=>`<a href="#${id}" class="nav-item ${route===id?'active':''}"${route===id?' aria-current="page"':''}>${icon(id)}<span>${cn}</span></a>`).join('');
  $('#route-label').textContent=navigation.find(n=>n[0]===route)?.[1]||({settings:'Settings',about:'Method & sources'}[route]);
  $('#main').innerHTML=({today:renderToday,lessons:renderLessons,listening:renderListening,speaking:renderSpeaking,review:renderReview,journal:renderJournal,settings:renderSettings,about:renderAbout}[route])();
  storageBanner();
}
function renderToday(){
  const plan=getDailyPlan(state,lessons),next=plan.nextLesson,practiced=totalMinutes(dateNow()),passed=Object.values(state.lessons).filter(x=>x.passed).length;
  if(!next){plan.lessonMinutes=Math.round(plan.outputMinutes*.4);plan.outputMinutes-=plan.lessonMinutes;}
  const dayIndex=Math.floor(Date.now()/86400000),phrase=chunks[dayIndex%chunks.length],listen=listening[dayIndex%listening.length],speakItem=speaking[dayIndex%speaking.length];
  return `${header('ONE DAY, A LITTLE MORE YOURSELF.','让英语，重新顺起来。','每天一点输入，一次表达，一次有意识的改写。',`<span class="date-tag">${escape(dateLabel(new Date()))}</span>`)}
  <section class="hero"><div class="hero-copy"><span class="eyebrow">YOUR ENGLISH, IN PRACTICE</span><h1>Find the words.<br>Make them <em>yours.</em></h1><p>把想法说清楚，把分寸说出来。<br>从熟悉的英语，走向自如、准确、有你自己声音的表达。</p><div class="hero-actions">${button(`${state.baseline.length?'继续今天的练习':'建立我的起点'} ${icon('arrow',15)}`,state.baseline.length?(next?'lesson':'speak'):'baseline',state.baseline.length?(next?.id||speakItem.id):'')}<a href="#lessons" class="text-link">探索表达课程</a></div></div><div class="hero-art" aria-hidden="true"><div class="editor-card"><div class="eyebrow"><span>THE ART OF SAYING IT</span><span>01 / ∞</span></div><blockquote>“What I find interesting<br>is <span>the gap between</span><br>what we expect<br>and what we see.”</blockquote><div class="card-annotation">A clear thought. A natural turn of phrase.</div><div class="sound-sticker"><span class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>FIND YOUR RHYTHM</div></div></div></section>
  <div class="stat-grid"><div class="stat-card"><span class="label">今日已记录练习 ${icon('clock',14)}</span><div class="number">${minutesText(practiced)}<small>/ ${plan.budget} 分钟</small></div><progress max="${plan.budget}" value="${Math.min(practiced,plan.budget)}" aria-label="今日练习时间"></progress><div class="foot">仅统计已完成并保存的练习时间</div></div><div class="stat-card"><span class="label">连续练习</span><div class="number">${getStreak(state)}<small>天</small></div><div class="foot">每次开口，都在找回熟悉感</div></div><div class="stat-card"><span class="label">等待主动回忆</span><div class="number">${plan.due.filter(x=>chunkMap.has(x.id)).length}<small>个表达</small></div><div class="foot">已完成 ${passed} / ${lessons.length} 个表达单元</div></div></div>
  <div class="dashboard-grid"><section class="panel"><div class="panel-header"><div><span class="eyebrow">TODAY'S PRACTICE</span><h2>给英语留一小段时间</h2></div><span class="tag">${plan.budget} 分钟建议</span></div>
  <div class="task-row"><span class="task-index">01</span><div class="task-body"><div class="task-title">先想起来，再看答案</div><p class="task-subtitle">${plan.due.length?'复习到期表达，把“看得懂”变成“用得出”。':'完成表达单元后，学过的词块会进入复习。'}</p></div><div class="task-meta"><span>${plan.reviewMinutes} 分钟</span><a class="round-btn" href="#review" aria-label="进入表达复习">${icon('arrow',15)}</a></div></div>
  <div class="task-row"><span class="task-index">02</span><div class="task-body"><div class="task-title">${escape(next?.title||listen.title)}</div><p class="task-subtitle">${escape(next?.subtitle||listen.focus)}</p></div><div class="task-meta"><span>${plan.lessonMinutes} 分钟</span><button class="round-btn" data-action="${next?'lesson':'listen'}" data-id="${escape(next?.id||listen.id)}" aria-label="开始今日表达练习">${icon('arrow',15)}</button></div></div>
  <div class="task-row"><span class="task-index">03</span><div class="task-body"><div class="task-title">${escape(speakItem.title)}</div><p class="task-subtitle">说一次，回听，再用更清楚的方式说一次。</p></div><div class="task-meta"><span>${plan.outputMinutes} 分钟</span><button class="round-btn" data-action="speak" data-id="${escape(speakItem.id)}" aria-label="开始今日开口练习">${icon('arrow',15)}</button></div></div></section>
  <section class="panel phrase-card"><span class="eyebrow">A PHRASE TO MAKE YOUR OWN</span><blockquote>“${escape(phrase.text)}”</blockquote><p>${escape(phrase.meaning)}</p><button class="text-link" data-action="lesson" data-id="${escape(phrase.lessonId)}">放进真实语境里练习 ↗</button></section></div>
  <div class="after-panel"><div><strong>用样本看变化。</strong>保留今天的表达，之后用同一个任务再说一次；流畅度、措辞和结构的变化，比打卡更值得看。</div><a class="btn secondary small" href="#journal">查看我的样本</a></div>`;
}
function renderLessons(){return `${header('THE EXPRESSION LAB','把表达打磨到位。','每课：观察语境 → 判断措辞 → 自己表达 → 对照改写。')}<div class="filter-row"><button class="filter ${filter==='all'?'active':''}" data-action="filter" data-id="all">全部单元</button>${tracks.map(track=>`<button class="filter ${filter===track.id?'active':''}" data-action="filter" data-id="${escape(track.id)}">${escape(track.title)}</button>`).join('')}</div><div class="lesson-grid">${lessons.filter(lesson=>filter==='all'||lesson.track===filter).map(lesson=>{const entry=state.lessons[lesson.id],trackIndex=tracks.findIndex(x=>x.id===lesson.track);return `<article class="lesson-card track${trackIndex}"><div class="card-top"><span>${escape(tracks[trackIndex]?.title)}</span><span>${lesson.minutes} MIN</span></div><h3>${escape(lesson.title)}</h3><div class="subtitle">${escape(lesson.subtitle)}</div><p>${escape(lesson.objective)}</p><div class="card-bottom"><span>${entry?.passed?'✓ 已通过判断练习':entry?`上次 ${entry.lastScore}/${entry.lastTotal}`:'3 个语境判断 · 1 次输出'}</span>${button(entry?'再次练习':'开始练习','lesson',lesson.id,'small secondary')}</div></article>`;}).join('')}</div><div class="note neutral">选择题检查你在指定语境中的判断；开放表达请结合参考版本和检查表自评。参考版本不是唯一正确答案，系统不自动判定开放文本的语言质量。</div>`;}
function renderListening(){return `${header('LISTEN BETWEEN THE LINES','听懂话，也听懂分寸。','先听意图，再辨认细节；最后打开文本，留意语气与信息结构。')}<div class="note"><strong>两种材料，各有用途。</strong>下面的原创短篇优先播放预生成神经合成音频，非真人录音；适合语意和语用判断。听节奏时建议使用原速，素材不可用时由设备本地声线备用。自然连读、真实口音与互动请搭配下方真人音频入口。</div><div class="studio-grid">${listening.map((item,i)=>`<article class="studio-card track${i%6}"><div class="card-top"><span>LISTENING ${String(i+1).padStart(2,'0')}</span><span>${item.minutes} MIN</span></div><h3>${escape(item.title)}</h3><div class="subtitle">${escape(item.focus)}</div><p>${escape(item.scene)}</p><div class="card-bottom"><span class="tag">合成示范 · 3 个判断</span>${button('进入练习','listen',item.id,'small secondary')}</div></article>`).join('')}</div><section class="space-top"><h2>把耳朵交给真实的声音。</h2><p class="section-intro">选择 30–60 秒真人片段：不看字幕听两遍 → 用自己的话复述 → 对照原文 → 跟读。先求信息与重音清楚，再追求速度。</p>${renderResources()}<div class="row-actions">${button('记录一次真人听力练习','external','','secondary')}</div></section>`;}
function renderSpeaking(){return `${header('FIND YOUR VOICE','让复杂想法，说得从容。','短时输出、回听、修订、重说。录音只供自己回听，不上传或自动评分。')}<div class="studio-grid">${speaking.map((item,i)=>`<article class="studio-card track${i%6}"><div class="card-top"><span>SPEAKING ${String(i+1).padStart(2,'0')}</span><span>${item.seconds} SEC</span></div><h3>${escape(item.title)}</h3><p>${escape(item.context)}</p><div class="card-bottom"><span class="tag">提示 · 参考 · 自评</span>${button('开始表达','speak',item.id,'small secondary')}</div></article>`).join('')}</div><section class="space-top"><h2>给以后的自己，留一个参照。</h2><p class="section-intro">每隔几周重做同一个基准任务。用文本或自己下载的录音对照变化；这些自评不会生成 CEFR 或“母语水平”认证。</p><div class="benchmark-grid">${benchmarks.map(item=>`<article class="benchmark-card"><h3>${escape(item.title)}</h3><p>${escape(item.prompt)}</p>${button('留一份样本','benchmark',item.id,'small secondary')}</article>`).join('')}</div></section>`;}
function renderReview(){
  if(!reviewSession)reviewSession={ids:dueCards(state).filter(x=>chunkMap.has(x.id)).slice(0,20).map(x=>x.id),index:0,revealed:false};
  const rs=reviewSession,chunk=chunkMap.get(rs.ids[rs.index]);
  if(!chunk)return `${header('MAKE IT AVAILABLE','让表达，随时用得出。','主动回忆 → 放进新句子 → 再看原例句。')}<div class="empty-state"><h2>${rs.ids.length?'这一轮复习完成了。':'现在没有到期表达。'}</h2><p>${rs.ids.length?`本轮练习了 ${rs.ids.length} 个表达。选“重来”的表达将在约 10 分钟后再次到期。`:'独立通过一个表达单元后，其中的词块就会进入复习队列。你也可以先去学一个新单元。'}</p><a class="btn" href="#lessons">进入表达精修 ${icon('arrow',15)}</a> ${button('刷新到期队列','review-refresh','','secondary')}</div><div class="note neutral">这是一套透明的简易间隔复习安排；“想起来了”并不等于在所有语境中都能熟练使用。复习时试着另造一个和你有关的新句子。</div>`;
  return `${header('MAKE IT AVAILABLE','先回忆，再翻开。','尽量说出一个完整句子，而不是只想起中文意思。')}<section class="panel review-face"><div class="question-meta"><span>本轮 ${rs.index+1} / ${rs.ids.length}</span><span>主动回忆</span></div><progress value="${rs.index}" max="${rs.ids.length}" aria-label="复习进度"></progress><div class="prompt">${escape(chunk.prompt||chunk.meaning)}</div><p class="muted small">${escape(chunk.meaning)}</p>${rs.revealed?`<div class="answer">${escape(chunk.text)}</div><p class="example">${escape(chunk.example)}</p><div class="row-actions">${button(`${icon('play',14)} 听示范`,'speak-chunk',chunk.id,'secondary small')}${button('停止','stop-speech','','secondary small')}${speechStatusMarkup(`${chunk.text}. ${chunk.example}`,'review-speech-status')}</div><p class="tiny muted">按刚才回忆的情况选择。看完答案再想起，选“重来”。</p><div class="ratings">${[['again','重来','约 10 分钟'],['hard','有点难','约 1 天'],['good','想起来了','延长间隔'],['easy','能自然使用','更长间隔']].map(([rating,title,sub])=>`<button data-action="review-grade" data-id="${rating}"><strong>${title}</strong>${sub}</button>`).join('')}</div>`:button('显示参考表达','review-reveal','','secondary')}</section>`;
}
function renderJournal(){
  const entries=Object.entries(state.drafts).filter(([,d])=>d.text.trim()).sort((a,b)=>b[1].updatedAt.localeCompare(a[1].updatedAt));
  const baselines=state.baseline,completed=Object.values(state.lessons).filter(x=>x.passed).length;
  const baselineText=baselines.length?`最近一次：${baselines.at(-1).score}/${baselines.at(-1).total}`:'还没有起点样本';
  const samples=state.practice.filter(p=>p.text?.trim()),records=state.practice;
  return `${header('YOUR WORDS, OVER TIME','看见自己，越来越自如。','保留练习样本，比较表达变化；不把练习分数当作语言等级。')}<div class="stat-grid"><div class="stat-card"><span class="label">已记录练习</span><div class="number">${minutesText(totalMinutes())}<small>分钟</small></div><div class="foot">按已保留的练习记录统计</div></div><div class="stat-card"><span class="label">完成表达单元</span><div class="number">${completed}<small>/ ${lessons.length}</small></div><div class="foot">独立判断正确率至少 80%</div></div><div class="stat-card"><span class="label">已保存输出</span><div class="number">${samples.length}<small>份样本</small></div><div class="foot">另有 ${entries.length} 份最近草稿</div></div></div>
  <div class="split-layout"><section class="panel"><span class="eyebrow">A REPEATABLE STARTING POINT</span><h2>起点与复测</h2><p class="small muted">8 个语境判断 + 一小段写作。它帮助你留意薄弱点，不是 CEFR 分级考试。重复题目会产生熟悉效应，复测时也要比较新的表达样本。</p><div class="metric-row"><span>${escape(baselineText)}</span><strong>${baselines.length} 次记录</strong></div><div class="row-actions">${button(baselines.length?'再做一次起点练习':'建立我的起点','baseline','','secondary')}</div>${baselines.length>1?`<div class="two-samples"><div class="sample-box"><h3>最早样本 · ${escape(dateLabel(baselines[0].at,true))}</h3><p>${escape(baselines[0].writing||'当时没有保存写作样本。')}</p></div><div class="sample-box"><h3>最近样本 · ${escape(dateLabel(baselines.at(-1).at,true))}</h3><p>${escape(baselines.at(-1).writing||'本次没有保存写作样本。')}</p></div></div>`:baselines.length?`<div class="sample-box"><h3>起点写作</h3><p>${escape(baselines[0].writing||'本次没有保存写作样本。')}</p></div>`:''}</section><section class="panel"><span class="eyebrow">LOOK FOR THE CHANGE</span><h2>比较什么？</h2><ul class="checklist"><li>同样一个意思，是否更快找到合适的说法？</li><li>听者能否轻松跟上重点与转折？</li><li>是否少了生硬直译，多了自然搭配？</li><li>语气能否随关系、场合和目的调整？</li><li>遇到卡顿，能否换一种说法继续？</li></ul><p class="tiny muted">自评是个人观察，不是自动评分。真实交流中的反馈同样重要。</p></section></div>
  <section class="space-top"><div class="panel-header"><h2>保存下来的练习</h2>${button('导出完整备份','export','','small secondary')}</div>${records.length?records.slice().reverse().slice(0,30).map(item=>`<article class="draft-card"><header><strong>${escape(practiceTitle(item))}</strong><span>${escape(dateLabel(item.at,true))} · ${minutesText(item.minutes)} 分钟</span></header>${item.score!==undefined?`<p class="small muted">语境判断 ${item.score}/${item.total} · ${item.assisted?'有文字辅助':'作答阶段未看文本'}</p>`:''}${item.text?.trim()?`<p class="draft-text">${escape(item.text)}</p>`:`<p class="tiny muted">${item.type==='baseline'?'起点判断与写作样本见上方。':['speaking','benchmark'].includes(item.type)?'本次未保存文本；录音需在练习中单独下载保留。':'本次未保存文字输出。'}</p>`}${item.ratings?`<p class="tiny muted">自评：${Object.entries(item.ratings).map(([key,value])=>`${({clarity:'清晰',naturalness:'自然',flow:'流畅',precision:'准确'})[key]||key} ${value}/5`).join(' · ')}</p>`:''}</article>`).join(''):'<div class="empty-state"><p>完成口语、基准任务或外部练习后，你保存的输出会出现在这里。</p><a href="#speaking" class="btn secondary">开始一次表达</a></div>'}</section>
  ${entries.length?`<section class="space-top"><h2>最近的草稿</h2><p class="tiny muted">每个任务保留最近一份草稿。完成口语任务时保存的样本会另外保留，方便回看。</p>${entries.slice(0,15).map(([id,draft])=>`<article class="draft-card"><header><strong>${escape(draftTitle(id))}</strong><span>${escape(dateLabel(draft.updatedAt,true))}</span></header><p class="draft-text">${escape(draft.text)}</p></article>`).join('')}</section>`:''}`;
}
function practiceTitle(item){const all=[...lessons,...listening,...speaking,...benchmarks];return all.find(x=>x.id===item.id)?.title||(item.type==='external'?'真人材料与真实交流':item.type==='baseline'?'起点练习':'表达样本');}
function draftTitle(id){const actual=id.slice(id.indexOf(':')+1);return [...lessons,...listening,...speaking,...benchmarks].find(x=>x.id===actual)?.title||(id==='baseline:writing'?'起点写作':'练习草稿');}
function renderSettings(){
  const p=state.profile,voices=localEnglishVoices();
  return `${header('MAKE ROOM FOR ENGLISH','按你的节奏，持续练习。','学习设置和个人样本只保存在这个浏览器中。')}<section class="panel settings-section"><h2>每日练习</h2><div class="field-grid"><div><label for="daily-minutes">每天给英语的时间（分钟）</label><input id="daily-minutes" type="number" min="15" max="120" step="1" value="${p.dailyMinutes}"><p class="field-help">15–120 分钟，按现实可持续的时间安排。</p></div><div><label for="focus">当前优先方向</label><select id="focus">${[['balanced','均衡表达'],['research','研究讨论与复杂观点'],['conversation','日常交谈与自然互动'],['writing','写作与措辞精修']].map(([value,label])=>`<option value="${value}"${p.focus===value?' selected':''}>${label}</option>`).join('')}</select><p class="field-help">影响今日推荐单元的顺序，所有课程仍可自由练习。</p></div><div><label for="time-zone">记录日期使用的时区</label><select id="time-zone">${[...new Set([p.timeZone,'Asia/Singapore','Asia/Shanghai','Asia/Hong_Kong','Asia/Tokyo','America/New_York','America/Los_Angeles','Europe/London','UTC'])].map(value=>`<option${p.timeZone===value?' selected':''}>${escape(value)}</option>`).join('')}</select></div><div><label for="speech-rate">示范语速</label><select id="speech-rate">${[0.75,0.9,1,1.1].map(value=>`<option value="${value}"${p.speechRate===value?' selected':''}>${value===1?'原速（建议）':`${value}×`}</option>`).join('')}</select></div></div><div class="space-top"><label for="voice-uri">系统本地备用音色</label><select id="voice-uri"><option value="">自动选择可用的本地备用音色</option>${voices.map(voice=>`<option value="${escape(voice.voiceURI)}"${p.voiceURI===voice.voiceURI?' selected':''}>${escape(voice.name)} · ${escape(voice.lang)}</option>`).join('')}</select><p class="field-help">${voices.length?`检测到 ${voices.length} 个浏览器标记为本地的英语音色。`:'尚未检测到本地英语音色；可在操作系统中安装英语语音后重开页面。'} 仅在示范素材缺失或播放失败时使用，不切换到远程语音；更换备用声线不会改变预生成音频的音色。用户输入文字不会发送给语音服务。</p></div><div class="row-actions">${button('保存设置','save-settings')} ${button('试听示范','test-voice','','secondary')}${button('停止','stop-speech','','secondary')}${speechStatusMarkup(voiceSampleText,'settings-speech-status')}</div></section>
  <section class="panel settings-section"><h2>备份与换设备</h2><p>记录不会自动同步。定期导出备份；换浏览器或设备后，可导入继续。导入会替换本浏览器的英文学习记录，请先导出已有记录。</p><div class="row-actions">${button('导出进度备份','export','','secondary')}${button('导入备份','import','','secondary')}</div><p class="field-help">文本样本随备份保存。录音只留在当前练习中，需要保留时请单独下载；离开练习后会释放。</p></section>
  <section class="panel settings-section"><h2>使用与数据</h2><p>课程和示例是公开的，个人记录由浏览器本地存储保存。应用没有登录、模型接口、分析追踪、联网录音上传或自动转写。录音需要你主动允许，页面隐藏时会停止。</p><p>英文与日文使用不同的存储键；它们仍位于同一网站来源，这不构成浏览器层面的安全隔离。本地记录和导出的文件没有应用层加密。</p><a href="#about" class="text-link">查看训练范围与材料来源 ↗</a></section>`;
}
function renderResources(){return `<div class="resource-list">${resources.map(item=>`<article class="resource-row"><small>${escape(item.kind)} · ${escape(item.level)}</small><div><a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${escape(item.title)} ↗</a></div><p>${escape(item.howToUse)}</p></article>`).join('')}</div>`;}
function renderAbout(){return `${header('WHY THIS PRACTICE','自如的表达，来自不断使用。','以清晰、自然、准确、得体和互动能力为方向。')}<div class="split-layout"><section class="panel"><h2>一套进阶练习室</h2><p class="small muted">适合已有较强英语基础、希望恢复使用状态并继续精修的人。训练围绕搭配、语域、信息结构、立场、互动与叙事展开。</p><ul class="checklist"><li>先做语境判断，理解表达为什么适合这里。</li><li>再独立写或说，把表达用在新情境里。</li><li>对照参考版本，保留自己的意思与声音。</li><li>之后主动回忆，并在真实交流中再次使用。</li></ul><div class="note neutral">“Native”包含多样的口音、地域和个人风格。这里的目标是高水平、自然且有效的沟通；CEFR C1/C2 描述可提供参考，但 C2 不等同于母语者。</div></section><section class="panel"><h2>分数说明什么？</h2><p class="small muted">选择题分数只反映本组题目的表现。词卡间隔依据你自己报告的回忆情况；开放文本、口语自然度和发音没有自动评分。</p><p class="small muted">微课提供的是精修入口，不是完整的等级教材。真人输入、长期阅读、真实对话和有针对性的反馈仍然需要持续进行。</p><p class="small muted">所有内置短文与案例均为原创教学示例。内置示范优先使用预生成神经合成音频（非真人录音），对应素材不可用时由设备本地声线备用。外部真人材料通过链接访问，应用不复制或抓取其音频、文本。</p><a class="text-link" href="https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4" target="_blank" rel="noopener noreferrer">Council of Europe · CEFR Companion Volume ↗</a></section></div><section class="space-top"><h2>继续走进真实英语</h2>${renderResources()}</section>`;}

function startSession(kind,id=''){
  stopSpeech();
  if(session)closeSession();
  const item=kind==='lesson'?lessonMap.get(id):kind==='listen'?listening.find(x=>x.id===id):kind==='speak'?speaking.find(x=>x.id===id):kind==='benchmark'?benchmarks.find(x=>x.id===id):null;
  if(['lesson','listen','speak','benchmark'].includes(kind)&&!item)return;
  lastFocus=document.activeElement;
  session={kind,id,item,stage:['speak','benchmark','external'].includes(kind)?'output':'intro',questions:kind==='baseline'?diagnostic:item?.questions||[],index:0,answers:[],selected:null,assisted:false,transcript:false,activeMs:0,runStart:document.hidden?null:performance.now(),finished:false,timerRemaining:item?.seconds||90,timerStart:null,timerRunning:false};
  session.draftKey=kind==='baseline'?'baseline:writing':`${kind==='speak'?'speaking':kind==='listen'?'listening':kind}:${id||'practice'}`;
  renderDialog();dialog.showModal();
}
function activeMilliseconds(){return session?session.activeMs+(session.runStart===null?0:performance.now()-session.runStart):0;}
function sessionMinutes(){return Math.min(120,Math.round(activeMilliseconds()/6000)/10);}
function flushDraft(){clearTimeout(draftTimer);draftTimer=null;if(session){const area=$('#answer-writing');if(area){saveDraft(state,session.draftKey,area.value);dirty=true;persist();}}}
function closeSession(){
  flushDraft();stopSpeech();stopRecording({discard:true});releaseRecording();
  session=null;if(dialog.open)dialog.close();page();if(lastFocus?.isConnected)lastFocus.focus();else $('#main').focus({preventScroll:true});
}
function renderDialog(){
  if(!session)return;
  const s=session,title=s.kind==='baseline'?'A place to begin':s.kind==='external'?'Bring English into real life':s.item.title;
  const label={lesson:'EXPRESSION LAB',listen:'LISTEN BETWEEN THE LINES',speak:'SPEAKING STUDIO',benchmark:'A REPEATABLE SAMPLE',baseline:'YOUR STARTING POINT',external:'REAL-WORLD PRACTICE'}[s.kind];
  $('#dialog-content').innerHTML=`<header class="dialog-header"><div><span class="eyebrow">${label}</span><h2 id="dialog-title">${escape(title)}</h2></div><button class="close" data-action="close" aria-label="关闭练习">×</button></header><div class="dialog-body">${s.stage==='intro'?sessionIntro():s.stage==='quiz'?sessionQuestion():s.stage==='output'?sessionOutput():sessionSummary()}${s.persisted===false?`<div class="note warning">浏览器未能保存这次练习。记录仍在当前页面，请导出备份后再离开。${button('导出当前备份','export','','secondary small')}</div>`:''}</div><div id="session-message" class="session-toast" role="status" aria-live="polite" hidden></div>`;
  if(s.kind==='speak'||s.kind==='benchmark')updateRecorderUI();
}
function sessionIntro(){
  const s=session;
  if(s.kind==='baseline')return `<p class="intro">先留下今天的样本。8 道题观察你对搭配、语气与信息结构的判断，再写一段自己的英语。</p><div class="note neutral">这不是英语等级测试，也不会把结果换算成托福、CEFR 或“母语水平”。你可以之后重做；重复题目的熟悉效应需要和新的输出样本一起考虑。</div><h3>写作会用到这个问题：</h3><blockquote class="model">Explain a view you changed recently. What convinced you, what remains uncertain, and how would you explain it to a friend outside your field?</blockquote><p class="tiny muted">建议 100–160 词，按你现在的真实状态写即可。</p><div class="dialog-footer"><span>8 个判断 · 1 份写作样本</span>${button('开始起点练习','quiz-start')}</div>`;
  if(s.kind==='listen')return `<p class="intro">${escape(s.item.scene)}</p><div class="pill-list"><span>${escape(s.item.focus)}</span><span>预生成神经合成 · 非真人录音</span></div>${listenControls()}<p class="small muted">先听两遍，试着复述说话者的意图。打开文本后，整次判断会标记为“有文字辅助”；也可以把它作为阅读练习使用。</p>${s.transcript?`<div class="transcript">${escape(s.item.script)}</div>`:''}<div class="dialog-footer"><span>进入判断题后仍可重听</span>${button('开始语境判断','quiz-start')}</div>`;
  const item=s.item;return `<p class="intro">${escape(item.brief)}</p><div class="note"><strong>这一课要练习</strong>${escape(item.objective)}</div><div class="comparison"><div><small>ORIGINAL EXPRESSION</small><p>${escape(item.example.before)}</p></div><div><small>IN THIS CONTEXT</small><p>${escape(item.example.after)}</p></div></div><p class="small muted">${escape(item.example.note)}</p><div class="dialog-footer"><span>3 个语境判断，然后自己表达</span>${button('开始判断练习','quiz-start')}</div>`;
}
function listenControls(){return `<div class="listen-panel"><div><p>原创听力示范 · 合成语音，非真人录音</p>${speechStatusMarkup(session.item.script)}</div><div class="row-actions">${button(`${icon('play',14)} 播放`,'play-listening','','small')}${button('原速','play-listening','original','secondary small')}${button('慢速','play-listening','slow','secondary small')}${button('停止','stop-speech','','secondary small')}${button(session.transcript?'收起文本':'查看文本','toggle-transcript','','secondary small')}</div></div>`;}
function sessionQuestion(){
  const s=session,q=s.questions[s.index],selected=s.selected!==null,correct=s.selected===q.answer;
  return `<div class="question-meta"><span>判断 ${s.index+1} / ${s.questions.length}</span><span>${s.kind==='listen'?(s.assisted?'有文字辅助':'听后作答'):s.kind==='baseline'?'起点观察':'语境与措辞'}</span></div><progress value="${s.index}" max="${s.questions.length}" aria-label="判断练习进度"></progress>${s.kind==='listen'?listenControls():''}${s.kind==='listen'&&s.transcript?`<div class="transcript">${escape(s.item.script)}</div>`:''}<h3 class="question-prompt">${escape(q.prompt)}</h3><div class="options">${q.options.map((choice,i)=>`<button class="option ${selected&&i===q.answer?'correct':''} ${selected&&i===s.selected&&i!==q.answer?'incorrect':''}" data-action="answer" data-id="${i}"${selected?' disabled':''}><span class="letter">${String.fromCharCode(65+i)}</span><span>${escape(choice)}</span></button>`).join('')}</div>${selected?`<div class="feedback ${correct?'':'incorrect'}" role="status"><strong>${correct?'这个选择符合当前语境。':'看看语境中的区别。'}</strong>${escape(q.explanation)}</div><div class="dialog-footer"><span>已记录第一次选择</span>${button(s.index===s.questions.length-1?'进入表达环节':'下一题','quiz-next')}</div>`:'<p class="tiny muted space-top">根据题目给定的关系、目的和场景选择最合适的一项。</p>'}`;
}
function checklist(items){return `<div class="checklist">${items.map((item,i)=>`<label><input type="checkbox" data-check="${i}"><span>${escape(item)}</span></label>`).join('')}</div>`;}
function writingArea(label,placeholder='Write in your own words…'){const text=getDraft(session.draftKey);return `<label for="answer-writing">${escape(label)}</label><textarea id="answer-writing" maxlength="${session.kind==='external'?19000:20000}" data-draft="${escape(session.draftKey)}" placeholder="${escape(placeholder)}">${escape(text)}</textarea><div class="writing-meta"><span id="word-count">${wordCount(text)} words</span><span>草稿自动保存在此浏览器</span></div>`;}
function selfRatings(){return `<div class="self-ratings">${[['clarity','清晰度'],['naturalness','措辞自然度'],['flow','流畅度'],['precision','准确与分寸']].map(([key,label])=>`<div><label for="rating-${key}">${label} · 自评</label><select id="rating-${key}" data-rating="${key}"><option value="">暂不评价</option>${[1,2,3,4,5].map(n=>`<option value="${n}">${n} / 5</option>`).join('')}</select></div>`).join('')}</div><p class="tiny muted">1 = 经常影响表达，3 = 基本可用仍有卡顿，5 = 本次感觉自然自如。只用于自己的前后比较。</p>`;}
function recorderPanel(){return `<section class="recorder"><h3>录下来，听一遍。</h3><p>只在本次练习中回听；想保留请下载。不会上传、转写或自动评分。最长录音 3 分钟。</p><div class="row-actions"><button class="btn small secondary" data-action="record-start" id="record-start">开始录音</button><button class="btn small secondary" data-action="record-stop" id="record-stop" disabled>停止录音</button><span id="recording-status" class="tiny muted">等待你主动开启</span></div><audio id="recording-player" controls hidden></audio><a id="recording-download" hidden download>下载这次录音</a></section>`;}
function sessionOutput(){
  const s=session;
  if(s.kind==='baseline')return `<span class="tag plum">起点写作 · 建议 100–160 词</span><blockquote class="model">Explain a view you changed recently. What convinced you, what remains uncertain, and how would you explain it to a friend outside your field?</blockquote>${writingArea('留下你现在的表达')}<div class="note neutral">现在不必追求完美，也不用查找复杂词汇。保留这份真实样本，之后才有东西可以对照。</div><div class="dialog-footer"><span>可以只保存判断题，稍后再留写作样本</span>${button('保存起点记录','finish')}</div>`;
  if(s.kind==='lesson')return `<span class="tag plum">YOUR TURN · 让表达离开例句</span><p class="intro space-top">${escape(s.item.task.prompt)}</p>${writingArea('用你自己的英语完成任务')}<details><summary>写完后，对照一个参考版本</summary><blockquote class="model">${escape(s.item.task.model)}</blockquote><ul>${s.item.task.notes.map(note=>`<li>${escape(note)}</li>`).join('')}</ul><p class="tiny">这是一个可行版本，不是唯一答案。保留你的意思，重点比较语气、组织和搭配。</p></details>${checklist(s.item.task.checklist)}<div class="dialog-footer"><span>文本不会自动评分</span>${button('完成并保存练习','finish')}</div>`;
  if(s.kind==='listen')return `<span class="tag ${s.assisted?'gold':'plum'}">${s.assisted?'本次看过文字辅助':'本次判断未打开文本'}</span><h3 class="space-top">先用自己的话，概括说话者的真正意思。</h3>${writingArea('一两句话复述，或写下你注意到的语气')}<details><summary>对照原文与值得留意的表达</summary><div class="transcript">${escape(s.item.script)}</div><ul>${s.item.noticing.map(note=>`<li>${escape(note)}</li>`).join('')}</ul></details><div class="dialog-footer"><span>答题后的对照不改变已记录的辅助标记</span>${button('保存听力练习','finish')}</div>`;
  if(s.kind==='external')return `<p class="intro">听一段真人英语，参加一次真实交流，或者精读一段材料，把真正用过的英语记下来。</p><div class="field-grid"><div><label for="external-minutes">本次实际练习时间（分钟）</label><input id="external-minutes" type="number" min="1" max="120" value="15"></div><div><label for="external-source">材料或情境（可选）</label><input id="external-source" maxlength="300" placeholder="例如：一段访谈 / 一次工作讨论"></div></div><div class="space-top">${writingArea('写一个复述、表达样本，或记录值得再练的地方')}</div>${selfRatings()}<div class="dialog-footer"><span>按实际发生的练习填写</span>${button('保存这次真实练习','finish')}</div>`;
  const item=s.item;return `<p class="intro">${escape(item.context||'同一个任务，隔一段时间再做一次，比较自己的表达变化。')}</p><div class="note"><strong>YOUR PROMPT</strong>${escape(item.prompt)}</div>${item.scaffold?`<div class="pill-list">${item.scaffold.map(x=>`<span>${escape(x)}</span>`).join('')}</div>`:''}<div class="timer-row"><div><div id="timer-digits" class="timer-digits">${timerLabel(s.timerRemaining)}</div><small>练习计时 · 切到后台会暂停</small></div><button class="btn secondary small" data-action="timer-toggle" id="timer-toggle">开始计时</button></div>${recorderPanel()}<div class="space-top">${writingArea('准备提纲，或回听后写下第二次表达')}</div>${item.model?`<details><summary>表达之后，看看另一个组织方式</summary><blockquote class="model">${escape(item.model)}</blockquote><p class="tiny">参考文本不代表必须模仿的口音或个人风格。可以用自己的方式完成同样的沟通目的。</p></details>`:''}${checklist(item.checklist)}${selfRatings()}<div class="dialog-footer"><span>保存的是文本与自评；录音请另行下载</span>${button('保存这次表达','finish')}</div>`;
}
function sessionSummary(){
  const s=session,score=s.answers.filter((answer,i)=>answer===s.questions[i]?.answer).length,total=s.questions.length;
  if(total)return `<div class="score-block"><span class="eyebrow">ONE PRACTICE, ONE STEP</span><div class="score">${score}<small> / ${total}</small></div><h3>${s.kind==='lesson'?(score/total>=.8?'这组语境判断已通过。':'把这次区别，再想一遍。'):s.kind==='baseline'?'起点样本已记录。':'听后判断已记录。'}</h3><p>${s.kind==='lesson'?(score/total>=.8?'本课表达已加入间隔复习。继续用自己的话，在新情境中使用它们。':'本次表现已经保存；达到至少 80% 后，本课词块会进入间隔复习。'):s.kind==='baseline'?'这只是当前这组题目的表现。之后结合真实交流反馈与输出样本一起观察。':s.assisted?'本次打开过文本，记录为有文字辅助。':'本次作答阶段未打开文本。分数只描述这组题目的表现。'}</p></div><div class="dialog-footer"><span>已完成练习 · ${minutesText(s.recordedMinutes||0)} 分钟</span>${button('回到练习室','close')}</div>`;
  return `<div class="score-block"><span class="eyebrow">YOUR VOICE, A LITTLE CLEARER</span><div class="score">✓</div><h3>这次表达，留下来了。</h3><p>稍后可以在「样本与记录」里回看文本与自评。继续练习时，试着只改一个最影响表达的地方。</p></div>${['speak','benchmark'].includes(s.kind)?recorderPanel():''}<div class="dialog-footer"><span>${minutesText(s.recordedMinutes||0)} 分钟 · ${['speak','benchmark'].includes(s.kind)?'离开前可下载录音':'按实际练习记录'}</span>${button('回到练习室','close')}</div>`;
}
function readRatings(){const result={};document.querySelectorAll('[data-rating]').forEach(el=>{if(el.value)result[el.dataset.rating]=Number(el.value);});return Object.keys(result).length?result:undefined;}
function finishSession(){
  const s=session;if(!s||s.finished)return;
  if(s.kind==='external'){const minutes=Number($('#external-minutes')?.value);if(!Number.isFinite(minutes)||minutes<1||minutes>120){toast('请填写 1–120 分钟之间的实际练习时间。');return;}}
  flushDraft();stopSpeech();stopRecording();
  const score=s.answers.filter((answer,i)=>answer===s.questions[i]?.answer).length,total=s.questions.length,text=getDraft(s.draftKey),minutes=sessionMinutes(),ratings=readRatings();
  dirty=true;
  if(s.kind==='lesson'){
    recordLesson(state,{id:s.id,score,total,assisted:false,minutes,chunkIds:s.item.chunks.map(c=>c.id)});
    if(text.trim())recordPractice(state,{type:'writing',id:s.id,minutes:0,text});
  }else if(s.kind==='baseline'){
    recordBaseline(state,{score,total,answers:s.answers.map(String),writing:text,note:'语境判断与写作样本；非等级测试。'});
    recordPractice(state,{type:'baseline',id:'starting-point',minutes});
  }else if(s.kind==='listen')recordPractice(state,{type:'listening',id:s.id,minutes,text,score,total,assisted:s.assisted});
  else if(s.kind==='external'){
    const externalMinutes=Number($('#external-minutes').value),source=$('#external-source').value.trim();
    recordPractice(state,{type:'external',id:'real-world',minutes:externalMinutes,text:source?`材料 / 情境：${source}\n\n${text}`:text,...(ratings?{ratings}:{})});s.recordedMinutes=externalMinutes;
  }else recordPractice(state,{type:s.kind==='benchmark'?'benchmark':'speaking',id:s.id,minutes,text,...(ratings?{ratings}:{})});
  const saved=persist();s.persisted=saved;s.finished=true;s.stage='summary';s.recordedMinutes??=minutes;s.timerRunning=false;s.timerStart=null;renderDialog();if(!saved)toast('练习已留在当前页面，但浏览器保存失败。请先导出备份。');
}

function localEnglishVoices(){return 'speechSynthesis' in window?window.speechSynthesis.getVoices().filter(voice=>voice.localService===true&&/^en(?:[-_]|$)/i.test(voice.lang)):[];}
function pronunciationLabel(text){
  const key=normalizePronunciationText(text),entry=Object.hasOwn(pronunciation.entries,key)?pronunciation.entries[key]:null;
  return entry?(typeof entry==='string'?pronunciation.label:entry.label)||'预生成神经合成语音':'系统本地备用';
}
function speechStatusMarkup(text,id='speech-status'){
  const key=normalizePronunciationText(text),message=activeSpeechKey===key&&activeSpeechMessage?activeSpeechMessage:
    `${pronunciationLabel(text)} · ${state.profile.speechRate===1?'原速':`${state.profile.speechRate}×（当前设置）`}`;
  return `<span id="${id}" class="tiny muted" data-speech-key="${escape(key)}" role="status" aria-live="polite">${escape(message)}</span>`;
}
function setSpeechStatus(message){
  activeSpeechMessage=message;
  document.querySelectorAll('[data-speech-key]').forEach(el=>{if(el.dataset.speechKey===activeSpeechKey)el.textContent=message;});
}
function createSpeechPlayer(){
  return createPronunciationPlayer({
    manifest:pronunciation,baseURL:document.baseURI,createAudio:()=>new Audio(),isHidden:()=>document.hidden,
    stopFallback:()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();speechUtterance=null;},
    onStatus:event=>{
      if(event.state==='loading')setSpeechStatus(`正在载入 · ${event.label}`);
      else if(event.state==='playing')setSpeechStatus(`正在播放 · ${event.label} · ${event.rate===1?'原速':`${event.rate}×`}`);
      else if(event.state==='ended')setSpeechStatus(`${event.label} · 播放完成`);
      else if(event.state==='fallback')setSpeechStatus('系统本地备用 · 正在准备英语声线');
      else if(event.state==='unavailable')setSpeechStatus('暂无可用发音 · 可使用外部真人音频');
      else if(event.state==='cancelled')setSpeechStatus(`${event.source==='local'?'系统本地备用':pronunciationLabel(activeSpeechKey)} · 已停止`);
    },
  });
}
function stopSpeech(){speechRequest++;pronunciationPlayer.stop();speechUtterance=null;activeSpeechKey='';activeSpeechMessage='';}
async function speakText(text,rate=state.profile.speechRate){
  if(!text||document.hidden)return;
  stopSpeech();activeSpeechKey=normalizePronunciationText(text);const request=speechRequest;
  return pronunciationPlayer.play(text,{rate:Number(rate),fallback:({text:phrase,rate:speed,isCurrent})=>
    speakLocalText(phrase,speed,()=>isCurrent()&&request===speechRequest)});
}
async function speakLocalText(text,rate,isCurrent){
  if(!isCurrent()||document.hidden)return false;
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){toast('这段示范素材暂不可用，此浏览器也不支持本地备用语音。请用外部真人音频材料继续练习。');return false;}
  let voices=localEnglishVoices();
  if(!voices.length){await new Promise(resolve=>setTimeout(resolve,700));if(!isCurrent()||document.hidden)return false;voices=localEnglishVoices();}
  const voice=voices.find(v=>v.voiceURI===state.profile.voiceURI)||voices.find(v=>/^en-US$/i.test(v.lang))||voices[0];
  if(!voice){toast('这段素材暂不可用，也没有可用的本地英语音色。请在系统中安装英语语音，或使用页面中的真人音频链接。不会切换到远程语音。');return false;}
  if(!isCurrent()||document.hidden)return false;
  const utterance=new SpeechSynthesisUtterance(String(text));utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=rate;speechUtterance=utterance;
  setSpeechStatus(`系统本地备用 · ${voice.name} · ${rate===1?'原速':`${rate}×`}`);
  utterance.onend=()=>{if(!isCurrent())return;speechUtterance=null;setSpeechStatus('系统本地备用 · 播放完成');};
  utterance.onerror=event=>{if(!isCurrent()||['interrupted','canceled'].includes(event.error))return;speechUtterance=null;setSpeechStatus('系统本地备用 · 播放失败');toast('本地备用语音未能播放。可换一个本地音色，或先阅读文本。');};
  window.speechSynthesis.speak(utterance);return true;
}
let microphoneTimer=null;
function releaseRecording(){if(recordingUrl){URL.revokeObjectURL(recordingUrl);recordingUrl='';}recordingChunks=[];}
function updateRecorderUI(){
  const start=$('#record-start'),stop=$('#record-stop'),status=$('#recording-status'),player=$('#recording-player'),download=$('#recording-download');
  if(!start)return;
  const recording=mediaRecorder?.state==='recording';
  start.disabled=Boolean(recording||recordingPending||session?.finished);stop.disabled=!recording&&!recordingPending;
  start.textContent=recordingPending?'等待麦克风许可…':recording?'正在录音':recordingUrl?'重新录音':'开始录音';
  if(status)status.textContent=recording?'正在录音 · 切到后台将停止':recordingPending?'请在浏览器权限提示中选择':recordingUrl?'已停止，可以回听或下载':session?.finished?(mediaRecorder?'正在准备回听…':'本次没有可回听的录音'):'等待你主动开启';
  if(player){player.hidden=!recordingUrl;if(recordingUrl&&player.getAttribute('src')!==recordingUrl)player.src=recordingUrl;}
  if(download){download.hidden=!recordingUrl;if(recordingUrl){download.href=recordingUrl;download.download=`english-practice-${dateNow()}.${recordingChunks[0]?.type?.includes('mp4')?'m4a':'webm'}`;}}
}
async function startRecording(){
  if(document.hidden||!session||session.finished||recordingPending||mediaRecorder?.state==='recording')return;
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('此浏览器暂不支持录音。可用系统录音工具，或直接口述并保存文本笔记。');return;}
  stopSpeech();releaseRecording();const request=++recordingRequest,owner=session;recordingPending=true;updateRecorderUI();
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    if(request!==recordingRequest||session!==owner||!dialog.open||document.hidden){stream.getTracks().forEach(track=>track.stop());return;}
    mediaStream=stream;const recorder=new MediaRecorder(stream),pieces=[];let recorderTimer=null;mediaRecorder=recorder;recordingPending=false;
    recorder.ondataavailable=event=>{if(request===recordingRequest&&event.data?.size)pieces.push(event.data);};
    recorder.onstop=()=>{
      clearTimeout(recorderTimer);if(microphoneTimer===recorderTimer)microphoneTimer=null;stream.getTracks().forEach(track=>track.stop());if(mediaRecorder===recorder)mediaRecorder=null;if(mediaStream===stream)mediaStream=null;
      if(request!==recordingRequest||session!==owner)return;
      if(pieces.length){releaseRecording();recordingChunks=pieces;recordingUrl=URL.createObjectURL(new Blob(pieces,{type:recorder.mimeType||pieces[0].type||'audio/webm'}));}
      updateRecorderUI();
    };
    recorder.onerror=()=>{if(request!==recordingRequest)return;stopRecording({discard:true});toast('录音中断，请检查麦克风后再试。');};
    recorder.start();updateRecorderUI();recorderTimer=setTimeout(()=>{if(request===recordingRequest){stopRecording();toast('已达到 3 分钟，录音自动停止。');}},180000);microphoneTimer=recorderTimer;
  }catch(error){
    if(request!==recordingRequest)return;recordingPending=false;mediaStream?.getTracks().forEach(track=>track.stop());mediaStream=null;mediaRecorder=null;updateRecorderUI();toast(error.name==='NotAllowedError'?'麦克风没有获准使用。你仍然可以口述并保存文本。':'未能开启麦克风，请检查设备后重试。');
  }
}
function stopRecording({discard=false}={}){
  clearTimeout(microphoneTimer);microphoneTimer=null;
  if(discard||recordingPending)recordingRequest++;
  recordingPending=false;
  if(mediaRecorder&&mediaRecorder.state!=='inactive'){try{mediaRecorder.stop();}catch{}}
  mediaStream?.getTracks().forEach(track=>track.stop());mediaStream=null;
  if(discard){mediaRecorder=null;releaseRecording();}
  updateRecorderUI();
}
function timerLabel(seconds){const value=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}
function remainingSeconds(){return session?.timerRunning?Math.max(0,session.timerRemaining-(performance.now()-session.timerStart)/1000):session?.timerRemaining||0;}
function pauseTimer(){if(!session?.timerRunning)return;session.timerRemaining=remainingSeconds();session.timerRunning=false;session.timerStart=null;updateTimer();}
function updateTimer(){if(!session)return;const display=$('#timer-digits'),control=$('#timer-toggle');if(display)display.textContent=timerLabel(remainingSeconds());if(control)control.textContent=session.timerRunning?'暂停':remainingSeconds()<=0?'再练一轮':'开始 / 继续';}
function toggleTimer(){if(!session)return;if(session.timerRunning)pauseTimer();else{if(session.timerRemaining<=0)session.timerRemaining=session.item?.seconds||90;session.timerRunning=true;session.timerStart=performance.now();updateTimer();}}
function downloadText(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportBackup(){flushDraft();downloadText(exportState(state),`english-atelier-backup-${dateNow()}.json`);toast('备份已下载。录音需要在练习中单独下载。');}
function saveSettings(){
  const candidate=JSON.parse(JSON.stringify(state));
  candidate.profile.dailyMinutes=Number($('#daily-minutes').value);candidate.profile.focus=$('#focus').value;candidate.profile.timeZone=$('#time-zone').value;candidate.profile.speechRate=Number($('#speech-rate').value);candidate.profile.voiceURI=$('#voice-uri').value;candidate.updatedAt=new Date().toISOString();
  try{state=importState(JSON.stringify(candidate));}catch{toast('请检查设置：每天时间须为 15–120 的整数。');return;}
  const saved=persist();page();toast(saved?'设置已保存。明天也给英语留一点空间。':'设置暂存在本页，请导出备份。');
}

document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-action]');if(!target||target.disabled)return;
  const {action,id}=target.dataset;
  try{
    if(action==='lesson')startSession('lesson',id);
    else if(action==='listen')startSession('listen',id);
    else if(action==='speak')startSession('speak',id);
    else if(action==='benchmark')startSession('benchmark',id);
    else if(action==='baseline')startSession('baseline');
    else if(action==='external')startSession('external');
    else if(action==='close')closeSession();
    else if(action==='filter'){filter=id;page();}
    else if(action==='quiz-start'){stopSpeech();session.stage='quiz';renderDialog();}
    else if(action==='answer'){
      if(!session||session.stage!=='quiz'||session.selected!==null)return;
      const choice=Number(id);if(!Number.isInteger(choice)||choice<0||choice>=session.questions[session.index].options.length)return;
      session.selected=choice;session.answers[session.index]=choice;renderDialog();
    }else if(action==='quiz-next'){
      if(!session||session.selected===null)return;
      if(session.index<session.questions.length-1){session.index++;session.selected=null;}else{stopSpeech();session.stage='output';}
      renderDialog();dialog.scrollTop=0;
    }else if(action==='finish')finishSession();
    else if(action==='play-listening'&&session?.kind==='listen')await speakText(session.item.script,id==='original'?1:id==='slow'?0.75:state.profile.speechRate);
    else if(action==='toggle-transcript'&&session?.kind==='listen'){session.transcript=!session.transcript;if(session.transcript)session.assisted=true;renderDialog();}
    else if(action==='stop-speech')stopSpeech();
    else if(action==='test-voice')await speakText(voiceSampleText);
    else if(action==='speak-chunk'){const chunk=chunkMap.get(id);if(chunk)await speakText(`${chunk.text}. ${chunk.example}`);}
    else if(action==='record-start')await startRecording();
    else if(action==='record-stop')stopRecording();
    else if(action==='timer-toggle')toggleTimer();
    else if(action==='review-reveal'){reviewSession.revealed=true;page();}
    else if(action==='review-grade'){
      if(!reviewSession?.revealed)return;const cardId=reviewSession.ids[reviewSession.index];if(!cardId)return;
      stopSpeech();reviewCard(state,cardId,id);persist();reviewSession.index++;reviewSession.revealed=false;page();
    }else if(action==='review-refresh'){reviewSession=null;page();}
    else if(action==='save-settings')saveSettings();
    else if(action==='export')exportBackup();
    else if(action==='export-raw'&&rawAtLoad)downloadText(rawAtLoad,`english-atelier-original-${dateNow()}.json`);
    else if(action==='import')$('#import-file').click();
    else if(action==='reload')location.reload();
  }catch(error){toast(`这次操作未完成：${error.message||'请检查输入后重试。'}`);}
});
document.addEventListener('input',event=>{
  const area=event.target;if(!area.matches('[data-draft]')||!session)return;
  try{saveDraft(state,area.dataset.draft,area.value);dirty=true;const counter=$('#word-count');if(counter)counter.textContent=`${wordCount(area.value)} words`;clearTimeout(draftTimer);draftTimer=setTimeout(()=>{persist();draftTimer=null;},400);}catch{toast('草稿太长，暂未保存。请缩短后再试。');}
});
$('#import-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(file.size>15000000)throw new Error('文件过大，请选择本应用导出的进度 JSON。');
    const candidate=importState(await file.text());
    if(!window.confirm('导入会替换当前浏览器的英文学习记录。确认已经备份现有进度，并继续导入吗？'))return;
    if(session)closeSession();state=candidate;reviewSession=null;const saved=persist({replace:true});page();toast(saved?'备份已导入，可以继续练习。':'数据已载入本页，但浏览器保存失败，请保留备份文件。');
  }catch(error){toast(`没有导入：${error.message||'请使用本应用导出的有效备份。'}`);}finally{event.target.value='';}
});
dialog.addEventListener('cancel',event=>{event.preventDefault();closeSession();});
dialog.addEventListener('click',event=>{if(event.target===dialog)closeSession();});
window.addEventListener('hashchange',()=>{if(session)closeSession();stopSpeech();reviewSession=null;page();$('#main').focus({preventScroll:true});window.scrollTo({top:0});});
window.addEventListener('storage',event=>{
  if(event.key!==STORAGE_KEY||event.newValue===lastSaved)return;
  if(session||route==='settings'||draftTimer||storageConflict||storageBlocked||dirty){storageConflict=true;storageError='另一个标签页修改了进度，已暂停覆盖。导出当前练习后重新载入，可保留两边的记录。';storageBanner();return;}
  try{state=event.newValue?importState(event.newValue):defaultState();lastSaved=event.newValue;rawAtLoad=event.newValue;storageError='';storageBlocked=false;storageConflict=false;dirty=false;reviewSession=null;page();}
  catch{storageBlocked=true;storageError='另一个标签页中的记录无法读取，已暂停写入。请导出当前备份后检查。';storageBanner();}
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(session&&session.runStart!==null){session.activeMs+=performance.now()-session.runStart;session.runStart=null;}pauseTimer();flushDraft();stopSpeech();stopRecording();}
  else if(session){session.runStart=performance.now();updateRecorderUI();}
});
window.addEventListener('pagehide',()=>{if(session)closeSession();stopSpeech();stopRecording({discard:true});releaseRecording();});
if('speechSynthesis' in window)window.speechSynthesis.addEventListener?.('voiceschanged',()=>{
  const el=$('#voice-uri');if(!el)return;const selected=el.value;el.innerHTML='<option value="">自动选择可用的本地备用音色</option>'+localEnglishVoices().map(voice=>`<option value="${escape(voice.voiceURI)}">${escape(voice.name)} · ${escape(voice.lang)}</option>`).join('');el.value=[...el.options].some(o=>o.value===selected)?selected:'';
});
setInterval(()=>{if(!session?.timerRunning||document.hidden)return;if(remainingSeconds()<=0){session.timerRemaining=0;session.timerRunning=false;session.timerStart=null;toast('这一轮时间到了。回听一下，再试着说得更清楚。');}updateTimer();},500);
page();
