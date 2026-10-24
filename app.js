import { course } from './content/course.js';
import { pronunciation } from './content/pronunciation.js';
import { kana } from './lib/kana.js';
import { normalizePronunciationText, createPronunciationPlayer } from './lib/pronunciation.js';
import { STORAGE_KEY, defaultState, loadState, saveState, localDate, daysUntil, getStreak, dueCards, reviewCard, recordLesson, recordActivity, recordAssessment, getDailyPlan, getMilestoneDate, importState, exportState, checkAnswer, normalizeAnswer } from './lib/engine.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nl = value => esc(value).replace(/\n/g, '<br>');
const levels = ['foundation', 'N5', 'N4', 'N3', 'N2', 'N1'];
const levelName = level => level === 'foundation' ? '入门' : level === 'consolidation' ? '整合复习' : level;
const levelLabel = level => ['N3','N2','N1'].includes(level) ? `${level} · 导入练习` : `${levelName(level)} · 基础练习`;
const routeTitles = {today:'今日',course:'学习路线',kana:'五十音',scenarios:'旅居会话',review:'记忆复习',progress:'学习记录',settings:'学习设置'};
const icons = { arrow:'M5 12h14m-5-5 5 5-5 5', play:'m9 5 10 7-10 7Z', check:'m5 12 4 4L19 6', sound:'M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14', book:'M12 6c-3-3-7-3-10-1v15c3-2 7-2 10 1m0-15c3-3 7-3 10-1v15c-3-2-7-2-10 1V6Z', time:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z', refresh:'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 14 6M4 12a8 8 0 0 0 14 6', mic:'M8 6a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0V6Zm-3 5v1a7 7 0 0 0 14 0v-1M12 19v3m-4 0h8', globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z', close:'m6 6 12 12M6 18 18 6', flag:'M5 21V4m0 0c5-4 9 4 14 0v10c-5 4-9-4-14 0', spark:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z', download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2'};
function icon(name, size = 20) {return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.spark}"/></svg>`;}
const safeUrl = value => {try { const u = new URL(value); return u.protocol === 'https:' ? u.href : '#'; } catch {return '#';}};
const shuffle = array => {const result = [...array]; for (let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [result[i],result[j]]=[result[j],result[i]];} return result;};
const percent = (a,b) => b ? Math.round(a / b * 100) : 0;
const formatTime = seconds => `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;
const todayKey = () => localDate(new Date(), state.profile.timeZone);
const vocabCatalog = [...new Map(course.lessons.flatMap(l => l.vocab.map(v => [v.id, {...v,kind:'vocab',lessonId:l.id,level:l.level}]))).values()];
const kanaCatalog = kana.flatMap(k => [{id:`kana-h-${k.id}`,jp:k.hiragana,kana:k.hiragana,romaji:k.romaji,zh:`平假名 · ${k.romaji}`,kind:'kana',sourceId:k.id}, {id:`kana-k-${k.id}`,jp:k.katakana,kana:k.katakana,romaji:k.romaji,zh:`片假名 · ${k.romaji}`,kind:'kana',sourceId:k.id}]);
const cardCatalog = [...vocabCatalog, ...kanaCatalog];
let state = loadState();
let route = location.hash.slice(1).split('?')[0] || 'today';
if (!routeTitles[route]) route = 'today';
let lessonFilter = 'all';
let lessonSearch = '';
let kanaMode = 'hiragana';
let kanaGroup = 'basic';
let session = null;
let pendingImport = null;
let toastTimeout;
let lastInteraction = Date.now();
let lastTick = performance.now();
let recorder = null;
let audioStream = null;
let recordingUrl = null;
let recordingPending = false;
let recordingGeneration = 0;
let speechRequest = 0;
let activeSpeechKey = '';
let speechUtterance = null;
const pronunciationPlayer = createSpeechPlayer();
const sessionKey = 'nihongo-path:active-session:v1';
let suspended = null;
try {const candidate=JSON.parse(localStorage.getItem(sessionKey)||'null'); if(candidate?.type === 'lesson' && course.lessons.some(l=>l.id===candidate.lessonId) && Number.isFinite(candidate.seconds) && candidate.seconds>=0 && Array.isArray(candidate.results) && candidate.results.length<100) suspended=candidate;} catch {}

function persist() {
  const ok = saveState(state);
  const status = $('#save-status');
  if (status) status.textContent = ok ? '进度已保存在此浏览器' : '暂时无法保存 · 请导出备份';
  if (!ok) toast('浏览器存储不可用，请在设置中导出进度，避免丢失。');
}
function toast(message) {
  const el=$('#toast'); el.textContent=message; el.classList.add('visible');
  const notice=$('#modal-notice');if($('#modal')?.open&&notice){notice.textContent=message;notice.hidden=false;}
  clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>{el.classList.remove('visible');el.textContent='';},6000);
}
function suspendSession() {
  if (session?.type==='lesson' && session.stage!=='summary') {
    suspended=structuredClone(session);
    try {localStorage.setItem(sessionKey,JSON.stringify(suspended));} catch {}
  }
}
function clearSuspended() {suspended=null; try{localStorage.removeItem(sessionKey);}catch{}}
function activateCards(cards) {
  const now=new Date().toISOString();
  for (const card of cards) if (!state.cards[card.id]) state.cards[card.id]={due:now,intervalDays:0,reps:0,lapses:0,lastReviewed:now};
}
function navigate(next) {
  if (!routeTitles[next]) return;
  stopSpeech();
  closeModal(); route=next;
  if (location.hash !== '#'+next) history.pushState(null,'','#'+next);
  render(); $('#main-content')?.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'});
}
function render() {
  $$('[data-route]').forEach(button=>{
    button.classList.toggle('active', button.dataset.route===route);
    if(button.dataset.route===route) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  });
  const crumb=$('.breadcrumb'); if(crumb) crumb.innerHTML=`我的学习空间 <span> / ${routeTitles[route]}</span>`;
  const views={today:todayView,course:courseView,kana:kanaView,scenarios:scenariosView,review:reviewView,progress:progressView,settings:settingsView};
  $('#app').innerHTML=views[route]();
  document.title=`${routeTitles[route]} · 日々 日本語`;
  $('#app').removeAttribute('aria-busy');
  const target=$('#sidebar-target-date'); if(target)target.textContent=state.profile.targetDate?state.profile.targetDate.replaceAll('-','.'):'设置目标日期';
  const phaseNode=$('#sidebar-phase'); if(phaseNode)phaseNode.textContent=getPhase()==='foundation'?'从第一声「あ」开始':getPhase()==='consolidation'?'继续完整课程与陌生材料测评':`当前内容：${levelName(getPhase())} 阶段导入`;
  const badge=$('#nav-review-count'); if(badge){const count=dueCards(state,cardCatalog).length;badge.textContent=count;badge.hidden=!count;}
}
function heading(eyebrow,title,subtitle,extra='') {
  return `<div class="page-heading"><div><p class="eyebrow">${esc(eyebrow)}</p><h1 class="page-title">${esc(title)}</h1><p class="page-subtitle">${esc(subtitle)}</p></div>${extra?`<div class="heading-actions">${extra}</div>`:''}</div>`;
}
function button(text,action,style='primary',extra='') {return `<button class="btn ${style}" data-action="${action}" ${extra}>${text}</button>`;}
function weekView() {
  const today=todayKey(); const parts=today.split('-').map(Number); const anchor=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
  const weekDay=(anchor.getUTCDay()+6)%7;
  return `<div class="week-grid">${Array.from({length:7},(_,i)=>{
    const d=new Date(anchor); d.setUTCDate(d.getUTCDate()-weekDay+i); const key=d.toISOString().slice(0,10); const row=state.daily[key]; const done=!!(row && (row.seconds>0||row.answered>0||row.reviewed>0));
    return `<div class="day-cell ${key===today?'today':''} ${done?'done':''}" title="${key}${done?' · 已练习':''}"><span>${['一','二','三','四','五','六','日'][i]}</span><strong>${done?icon('check',16):d.getUTCDate()}</strong></div>`;
  }).join('')}</div>`;
}
function getPhase(){return course.lessons.find(l=>!state.lessons[l.id]?.completedAt)?.level || 'consolidation';}
function todayView() {
  const plan=getDailyPlan(state,course); const next=plan.newLesson || course.lessons.find(l=>!state.lessons[l.id]?.completedAt); const daily=state.daily[todayKey()] || {};
  const studied=Math.floor((daily.seconds||0)/60); const due=dueCards(state,cardCatalog).length; const completed=course.lessons.filter(l=>state.lessons[l.id]?.completedAt).length;
  const days=state.profile.targetDate?Math.max(0,daysUntil(state.profile.targetDate,new Date(),state.profile.timeZone)):null;
  const dateLabel=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long',timeZone:state.profile.timeZone}).format(new Date());
  const heroAction=suspended?button(`继续未完成的练习 ${icon('arrow')}`,'resume-lesson'):next?button(`${completed?'继续今天的学习':'开始我的第一课'} ${icon('arrow')}`,'start-lesson','primary',`data-id="${esc(next.id)}"`):button(`开始到期复习 ${icon('arrow')}`,'start-review');
  const tasks=[{title:'唤醒昨天的记忆',detail:due?`${due} 张卡片已经到期，先试着回想。`:'完成第一课后，词卡会进入复习。',time:15,icon:'refresh',action:'start-review'},
    {title:next?next.title:'继续完整课程的学习',detail:next?`${levelName(next.level)} · ${next.canDo}`:'内置导入练习已完成，继续教材和真实语料。',time:next?.minutes||25,icon:'book',action:next?'start-lesson':'focus',id:next?.id},
    {title:'给耳朵一段日语时间',detail:'带着问题听一遍，再核对原文。',time:30,icon:'sound',action:'focus',kind:'listening'},
    {title:'把一句话用在生活里',detail:state.profile.city?`为在${state.profile.city}的生活练一次对话。`:'今天，从咖啡店的一次点单开始。',time:10,icon:'globe',action:'open-scenarios'}];
  return heading('一日、一歩。 / ONE DAY, ONE STEP','今天，也向日本近一点。','从第一声「あ」开始，把听、说、读变成每天的习惯。',`<span class="date-pill">${esc(dateLabel)}</span>`)+
  `<section class="hero"><div class="hero-content"><div class="hero-kicker"><span class="badge green">${completed?`已完成 ${completed} 个微课`:'零基础 · 欢迎开始'}</span><span>你的日本语学习之旅</span></div><h2 class="hero-title">学会今天的一句，<br>走进明天的日常。</h2><p class="hero-description">${next?`今天从「${esc(next.title)}」开始。先听一听，跟着说，再用一个小练习把它记住。`:'把学过的表达拿到真实语境中。今天继续阅读、听力和到期复习。'}</p><div class="hero-actions">${heroAction}${button('查看学习路线','open-course','ghost')}</div><div class="hero-meta"><span>${icon('time',16)} 第一轮约 ${next?.minutes||15} 分钟</span><span>中文引导 · 日语发音 · 自动保存</span></div></div><div class="hero-art"><img src="./assets/journey.svg" alt="日式街角的小店、纸灯笼与窗边的书" width="440" height="330"></div></section>`+
  `<div class="grid-3 stats-grid"><div class="stat-card"><div class="stat-label">今日已记录练习 ${icon('time',18)}</div><div class="stat-value">${studied}<small> / ${state.profile.dailyMinutes} 分钟</small></div><div class="progress-bar" role="progressbar" aria-label="今日学习目标" aria-valuenow="${Math.min(100,percent(studied,state.profile.dailyMinutes))}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(100,percent(studied,state.profile.dailyMinutes))}%"></span></div></div><div class="stat-card"><div class="stat-label">连续练习 ${icon('spark',18)}</div><div class="stat-value">${getStreak(state)}<small> 天</small></div><span class="text-small text-muted">${getStreak(state)?'每一次实际练习，都算向前一步。':'今天可以是你的第一天。'}</span></div><div class="stat-card"><div class="stat-label">等待复习 ${icon('refresh',18)}</div><div class="stat-value">${due}<small> 张卡片</small></div><span class="text-small text-muted">只统计已学过且到期的内容</span></div></div>`+
  `<div class="dashboard-grid"><div class="main-column"><section class="card"><div class="card-header"><div><p class="eyebrow">TODAY'S PRACTICE</p><h2 class="section-title">今天，从这里开始</h2></div><span class="badge neutral">按需选择练习</span></div><div class="task-list">${tasks.map((t,i)=>`<button class="task-row" data-action="${t.action}" ${t.id?`data-id="${esc(t.id)}"`:''} ${t.kind?`data-kind="${t.kind}"`:''}><span class="task-number">0${i+1}</span><span class="task-copy"><span class="task-title">${esc(t.title)}</span><span class="task-detail">${esc(t.detail)}</span></span><span class="task-time">约 ${t.time} 分钟 ${icon('arrow',16)}</span></button>`).join('')}</div></section><section class="card"><div class="card-header"><div><p class="eyebrow">A LITTLE MORE, EVERY DAY</p><h2 class="section-title">完整学习日 · ${state.profile.dailyMinutes} 分钟</h2></div>${button('开启专注','focus','secondary small')}</div><p class="section-subtitle">小练习之外，给完整课程、阅读和原声材料留出时间。计时结束后按实际用时记录。</p><div class="chip-row">${plan.blocks.map(b=>`<span class="chip">${esc(b.title)} <b>${b.minutes} 分</b></span>`).join('')}</div><p class="text-small text-muted">${esc(plan.warning||'每日时长是排程预算，不是 N1 达标承诺。每两周用测评调整进度。')}</p></section></div><div class="side-column"><section class="card"><div class="card-header"><h2 class="section-title">这周的脚印</h2><span class="text-small text-muted">${getStreak(state)} 天连续</span></div>${weekView()}<p class="text-small text-muted">练习或专注记录会点亮当天。</p></section><section class="journey-card"><p class="eyebrow">YOUR NORTH STAR</p><div class="journey-meta"><h2>N1</h2><span>目标路线</span></div><p>${state.profile.targetDate?esc(state.profile.targetDate.replaceAll('-','.'))+' 前':'请设置你的目标日期'}</p><div class="big-number">${days??'—'}<small> 天</small></div><p class="text-small">从零开始的挑战目标。先扎实练习，再用完整测评判断距离。</p>${button((days===null?'设置学习目标 ':'查看阶段与测评 ')+icon('arrow',16),days===null?'settings':'open-progress','ghost small')}</section><div class="note"><strong>先把一句话说出来</strong><p lang="ja" class="japanese">はじめまして。</p><p class="text-small">初次见面。${state.profile.showRomaji?'Hajimemashite.':''}</p>${speechButtons('はじめまして。')}</div></div></div>`;
}
function courseView() {
  const filtered=course.lessons.filter(l=>(lessonFilter==='all'||l.level===lessonFilter)&&(!lessonSearch||`${l.title} ${l.subtitle} ${l.canDo} ${l.level}`.toLowerCase().includes(lessonSearch.toLowerCase())));
  return heading('YOUR LEARNING PATH','从「あ」到更远的世界。','先打好基础，再逐步读懂更长的文章、听懂更自然的日语。')+
  `<div class="note note-warning"><strong>N1 是能力目标，课程完成度是练习记录。</strong><p>内置 ${course.lessons.length} 个原创微课用于入门和各阶段导入，并非覆盖 N1 的完整教材或题库。每一阶段都配有官方学习材料与测评入口。</p></div><div class="filter-bar"><div class="chip-row">${['all',...levels].map(l=>`<button class="filter-button ${lessonFilter===l?'active':''}" data-action="filter-lessons" data-level="${l}" aria-pressed="${lessonFilter===l}">${l==='all'?'全部课程':levelName(l)}</button>`).join('')}</div><label class="search-field"><span class="sr-only">搜索课程</span><input id="lesson-search" type="search" value="${esc(lessonSearch)}" placeholder="搜索场景或语法…"></label></div><div class="lesson-grid" id="lesson-results">${filtered.map(l=>{const p=state.lessons[l.id];return `<button class="lesson-card" data-action="start-lesson" data-id="${esc(l.id)}"><div class="lesson-level"><span class="badge ${p?.completedAt?'green':'neutral'}">${p?.completedAt?'本课已通过':levelLabel(l.level)}</span><span class="lesson-number">${String(l.order).padStart(2,'0')}</span></div><h2 class="lesson-title">${esc(l.title)}</h2><p class="lesson-description">${esc(l.canDo)}</p><div class="lesson-footer"><span>${icon('time',15)} ${l.minutes} 分钟 · ${l.questions.length} 题</span><span>${p?`最高 ${Math.round(p.bestScore)}%`:icon('arrow',18)}</span></div></button>`;}).join('')||'<div class="empty-state">没有找到这类课程。试试其他关键词。</div>'}</div><section class="card"><div class="card-header"><div><p class="eyebrow">GO DEEPER</p><h2 class="section-title">把微课接到完整学习中</h2></div></div>${resourceList(lessonFilter==='all'?getPhase():lessonFilter)}</section>`;
}
function kanaGroupFor(k) {
  if ((k.hiragana?.length||0)>1) return 'yoon';
  if (/[がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゔ]/.test(k.hiragana)) return 'voiced';
  return 'basic';
}
function kanaView() {
  const pool=kana.filter(k=>kanaGroupFor(k)===kanaGroup);
  return heading('THE FIRST SOUNDS','先认识日语的声音。','平假名、片假名成对记。点一下听发音，再用短测验巩固。',button(icon('play',16)+' 练习 10 题','kana-quiz'))+
    `<div class="filter-bar"><div class="chip-row"><button class="filter-button ${kanaMode==='hiragana'?'active':''}" data-action="kana-mode" data-mode="hiragana" aria-pressed="${kanaMode==='hiragana'}">あ 平假名</button><button class="filter-button ${kanaMode==='katakana'?'active':''}" data-action="kana-mode" data-mode="katakana" aria-pressed="${kanaMode==='katakana'}">ア 片假名</button></div><div class="chip-row">${[['basic','清音'],['voiced','浊音 / 半浊音'],['yoon','拗音']].map(([value,label])=>`<button class="filter-button ${kanaGroup===value?'active':''}" data-action="kana-group" data-group="${value}" aria-pressed="${kanaGroup===value}">${label}</button>`).join('')}</div></div><section class="card"><div class="card-header"><h2 class="section-title">${kanaGroup==='basic'?'清音 · 46 个基础假名':kanaGroup==='voiced'?'浊音与半浊音':'拗音 · 两个字，读成一拍'}</h2><span class="text-small text-muted">点卡片查看与跟读</span></div><div class="kana-grid">${pool.map(k=>`<button class="kana-cell" data-action="kana-detail" data-id="${esc(k.id)}" aria-label="${esc(k[kanaMode])}，查看发音"><span class="kana-char" lang="ja">${esc(k[kanaMode])}</span><span class="kana-reading">${state.profile.showRomaji?esc(k.romaji):'点按学习'}</span></button>`).join('')}</div></section><div class="grid-2"><div class="note"><strong>汉字熟悉，发音仍要单独学。</strong><p>先用罗马音搭桥，再在设置中关闭提示。不要用中文谐音代替日语的发音。</p></div><div class="note"><strong>长音、促音和拗音也会改变词义。</strong><p>例如 おばさん / おばあさん，きて / きって。它们在入门微课里有专门练习。</p>${button('回到入门课程','foundation-course','ghost small')}</div></div>`;
}
function scenariosView() {
  const symbols=['☕','◇','↗','⌂','▦','✚','▤','◌'];
  return heading('JAPANESE, IN REAL LIFE','把日语带进生活里。',state.profile.city?`为在${state.profile.city}的生活练习：先听对方，再选择合适的回应。`:'点餐、问路、入住、找人帮忙——每次练习一个具体的小场景。')+
  `<div class="note"><strong>带分支的情境练习</strong><p>这是预先编写的对话练习；选择不同回应会得到提示。可以听示范、自己录音并回放。录音只供自我对照，不生成发音分数。</p></div><div class="scenario-grid">${course.scenarios.map((s,i)=>`<button class="scenario-card" data-action="start-scenario" data-id="${esc(s.id)}"><span class="scenario-icon" aria-hidden="true">${symbols[i%symbols.length]}</span><div class="lesson-level"><span class="badge ${state.scenarioCompletions[s.id]?'green':'neutral'}">${state.scenarioCompletions[s.id]?'已练习':esc(levelName(s.level))}</span><span class="text-small text-muted">${esc(s.place)}</span></div><h2 class="lesson-title">${esc(s.title)}</h2><p class="lesson-description">${esc(s.goal)}</p><span class="lesson-footer">进入情境 ${icon('arrow')}</span></button>`).join('')}</div>`;
}
function reviewView() {
  const mistakes=getMistakes();
  const due=dueCards(state,cardCatalog); const known=cardCatalog.filter(c=>state.cards[c.id]);
  const stable=known.filter(c=>(state.cards[c.id]?.intervalDays||0)>=7).length;
  return heading('MAKE IT STICK','在忘记之前，再见一次。','先回想，再翻卡。根据真实感觉选择难度，系统会安排下一次。')+
  `<div class="grid-3 stats-grid"><div class="stat-card"><span class="stat-label">现在到期</span><div class="stat-value">${due.length}<small> 张</small></div></div><div class="stat-card"><span class="stat-label">已加入复习</span><div class="stat-value">${known.length}<small> 张</small></div></div><div class="stat-card"><span class="stat-label">间隔达到 7 天</span><div class="stat-value">${stable}<small> 张</small></div></div></div><section class="card review-start"><p class="eyebrow">RECALL, THEN REVEAL</p><h2 class="section-title">${due.length?'给记忆一点主动练习。':'现在没有到期的卡片。'}</h2><p class="section-subtitle">${due.length?`本轮最多复习 ${Math.min(20,due.length)} 张。一次记不住也没关系，选“再来”就好。`:known.length?'你可以学习下一课；已学卡片到期后会出现在这里。':'完成一个微课，或做一次五十音练习，内容就会进入你的复习队列。'}</p>${due.length?button(icon('play',17)+' 开始复习','start-review'):button('去学习一课 '+icon('arrow'),'open-course')}</section><section class="card"><div class="card-header"><div><h2 class="section-title">错题回看</h2><p class="section-subtitle">未独立答对的题会保留，答对后从这份列表移除。</p></div><span class="badge orange">${mistakes.length} 题</span></div>${mistakes.length?button('练习待巩固的题目','mistake-practice','secondary'):'<p class="text-small text-muted">目前没有待巩固的题目。完成练习后，这里会自动更新。</p>'}</section><section class="card"><div class="card-header"><h2 class="section-title">我的卡片</h2><span class="text-small text-muted">${known.length} 张</span></div>${known.length?`<div class="table-wrap"><table class="table"><thead><tr><th>日语</th><th>意思 / 读法</th><th>下次复习</th></tr></thead><tbody>${known.slice(0,80).map(c=>`<tr><td lang="ja">${esc(c.jp)}</td><td>${esc(c.zh)}</td><td>${esc(localDate(new Date(state.cards[c.id].due),state.profile.timeZone))}</td></tr>`).join('')}</tbody></table></div>${known.length>80?'<p class="text-small">此处显示前 80 张，所有到期卡片都会参与排程。</p>':''}`:'<div class="empty-state">记忆卡片会从你的实际学习中慢慢积累。</div>'}</section><p class="text-small text-muted">复习采用透明的间隔规则；“再来”约 10 分钟，“困难”约 1 天，“记住了”逐步延长。不是能力等级判定。</p>`;
}
function resourceList(level) {
  if(level==='consolidation') level='N1';
  let resources=course.resources.filter(r=>r.level==='all'||r.level===level||(Array.isArray(r.level)&&r.level.includes(level)));
  if(resources.length<2)resources=course.resources.slice(0,4);
  return `<div class="resource-list">${resources.map(r=>`<a class="resource-link" href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer"><span>${icon(r.type==='audio'?'sound':'book',20)}</span><span><strong>${esc(r.title)}</strong><small>${esc(r.description)}</small></span><span aria-hidden="true">↗</span></a>`).join('')}</div>`;
}
function progressView() {
  const rows=Object.values(state.daily); const seconds=rows.reduce((n,d)=>n+(d.seconds||0),0); const answered=rows.reduce((n,d)=>n+(d.answered||0),0); const correct=rows.reduce((n,d)=>n+(d.correct||0),0);
  const completed=course.lessons.filter(l=>state.lessons[l.id]?.completedAt).length; const phase=getPhase();
  const external=state.assessments.filter(a=>a.kind==='external').slice().reverse();
  const studyLogs=state.assessments.filter(a=>a.kind==='study-log').slice(-8).reverse();
  const sample=state.assessments.filter(a=>a.kind==='sample'||a.kind==='kana').slice(-5).reverse();
  const days=state.profile.targetDate?Math.max(0,daysUntil(state.profile.targetDate,new Date(),state.profile.timeZone)):null;
  return heading('PROGRESS, WITH EVIDENCE','记录进步，也看清距离。','练习完成、听说能力与 JLPT 测评，各自用自己的证据。',button('记录一次外部测评','add-assessment','secondary'))+
  `<div class="grid-4 stats-grid"><div class="stat-card"><span class="stat-label">已记录学习</span><div class="stat-value">${(seconds/3600).toFixed(1)}<small> 小时</small></div></div><div class="stat-card"><span class="stat-label">实际练习日</span><div class="stat-value">${rows.filter(d=>d.seconds||d.answered||d.reviewed).length}<small> 天</small></div></div><div class="stat-card"><span class="stat-label">完成内置微课</span><div class="stat-value">${completed}<small> / ${course.lessons.length}</small></div></div><div class="stat-card"><span class="stat-label">练习独立正确率</span><div class="stat-value">${answered?percent(correct,answered):'—'}<small>${answered?'%':''}</small></div></div></div>`+
  `<div class="dashboard-grid"><div class="main-column"><section class="card"><div class="card-header"><div><p class="eyebrow">THE ROAD TO N1</p><h2 class="section-title">阶段路线 · ${esc(state.profile.targetDate||'目标日期待设置')}</h2></div><span class="badge orange">挑战计划</span></div><p class="section-subtitle">日期按计划起点与个人目标日安排复盘，并非能力预测。当前从${levelName(phase)}内容继续；调整目标会重新排期，不会自动升级或跳过基础。</p><div class="route-map">${course.milestones.map(m=>{const ls=course.lessons.filter(l=>l.level===m.level);const done=ls.filter(l=>state.lessons[l.id]?.completedAt).length;return `<div class="route-step ${m.level===phase?'current':''} ${done&&done===ls.length?'completed':''}"><span class="route-dot">${m.level==='foundation'?'あ':esc(m.level)}</span><div class="route-body"><div class="route-title"><h3>${esc(m.title)}</h3><span>${esc(getMilestoneDate(state,m)||'待设置目标日期')}</span></div><p class="route-detail">${esc(m.goal)}</p><div class="chip-row"><span class="chip">导入微课 ${done}/${ls.length}</span>${m.level===phase?'<span class="badge green">当前内容</span>':''}</div><details><summary>这个阶段，用什么来检查？</summary><ul>${m.checks.map(c=>`<li>${esc(c)}</li>`).join('')}</ul><p class="text-small text-muted">${esc(m.note||'阶段日期需根据实测调整。')}</p>${button('做一次课程抽测','sample-assessment','secondary small',`data-level="${esc(m.level)}"`)}</details></div></div>`;}).join('')}</div></section><section class="card"><div class="card-header"><h2 class="section-title">完整测评记录</h2>${button('添加记录','add-assessment','ghost small')}</div><p class="section-subtitle">填写实际做过的教材或官方练习册。此处记录原始正确率，不换算 JLPT 标准分，也不自动认证 N1。</p>${external.length?external.map(a=>`<div class="assessment-row"><div><strong>${esc(a.level)} · ${esc(a.source)}</strong><p class="text-small text-muted">${esc(a.date)} · ${a.timed?'计时完成':'未计时'} · ${a.unseen?'首次接触材料':'重复材料'}</p></div><div class="chip-row"><span class="chip">知识 ${esc(a.knowledge)}%</span><span class="chip">阅读 ${esc(a.reading)}%</span><span class="chip">听力 ${esc(a.listening)}%</span></div></div>`).join(''):'<div class="empty-state">尚无完整测评记录。先学基础，后面用新的完整材料做阶段检查。</div>'}</section></div><div class="side-column"><section class="journey-card"><p class="eyebrow">YOUR STUDY BUDGET</p><h2>${state.profile.dailyMinutes}<small> 分钟 / 天</small></h2><p>${days===null?'设置目标后查看时间预算':`目标日前还有 ${days} 天`}</p><div class="big-number">${days===null?'—':Math.round(days*state.profile.dailyMinutes/60)}<small> 小时</small></div><p class="text-small">这是未来每天按预算练习的理论总量，不是已学时长或达标估计。</p>${button('调整学习预算','settings','ghost small')}</section><section class="card"><h2 class="section-title">下一次检查</h2><p>先连续练习 14 天，再检查：</p><ul class="text-small"><li>不看罗马音，能否读出基础假名？</li><li>不看文本，能否听出已经学过的短句？</li><li>每日计划是否能真实持续？</li></ul><p class="text-small text-muted">如果落后，先减少新内容、补弱项，再调整阶段日期。</p></section><section class="card"><h2 class="section-title">最近的课程抽测</h2>${sample.length?sample.map(a=>`<div class="assessment-row"><div><strong>${esc(a.title||levelName(a.level)+' 课程抽测')}</strong><p class="text-small text-muted">${esc(localDate(new Date(a.recordedAt),state.profile.timeZone))}</p></div><b>${percent(a.correct,a.total)}%</b></div>`).join(''):'<p class="text-small text-muted">这里会记录五十音测验和课程熟题抽测。</p>'}<p class="text-small text-muted">熟题表现不能代替陌生材料测评。</p></section></div></div><section class="card"><div class="card-header"><h2 class="section-title">最近的专注记录</h2></div>${studyLogs.length?studyLogs.map(log=>`<div class="assessment-row"><div><strong>${esc(log.source||log.title)}</strong><p class="text-small text-muted">${esc(localDate(new Date(log.recordedAt),state.profile.timeZone))} · ${formatTime(log.seconds||0)}</p>${log.note?`<p>${nl(log.note)}</p>`:''}</div></div>`).join(''):'<p class="text-small text-muted">开始一段专注后，使用过的材料和心得会保留在这里。</p>'}</section><section class="card"><div class="card-header"><h2 class="section-title">官方材料与评价依据</h2></div>${resourceList(phase)}</section>`;
}
function settingsView() {
  return heading('MAKE IT YOURS','让计划，适合你的生活。','随时调整学习时间和旅居信息；每天打开后从上次的进度继续。')+
  `<form id="settings-form" class="card"><div class="card-header"><h2 class="section-title">目标与节奏</h2></div><div class="form-grid"><label class="field">目标日期<input type="date" name="targetDate" value="${esc(state.profile.targetDate)}" min="2026-01-01" max="2035-12-31"><small>选择个人能力目标日，仅保存在此浏览器；它不代表正式考试日期。</small></label><label class="field">每日学习预算<select name="dailyMinutes">${[15,30,60,90,120,180,240,300,360,480].map(v=>`<option value="${v}" ${state.profile.dailyMinutes===v?'selected':''}>${v} 分钟${v===30?' · 通用起点':''}</option>`).join('')}</select><small>零基础到 N1 是高强度目标。时长只是预算，需要用实际测评调整。</small></label><label class="field">计划旅居城市<input name="city" value="${esc(state.profile.city)}" placeholder="还没确定也可以留空" maxlength="80"><small>选填，仅保存在当前浏览器。</small></label><label class="field">计划出发日期<input type="date" name="departureDate" value="${esc(state.profile.departureDate)}" min="2026-01-01" max="2035-12-31"><small>仅用于显示旅居准备信息，不改变能力评级。</small></label><label class="field">学习日时区<select name="timeZone">${[['Asia/Singapore','新加坡 / 香港 / 中国内地'],['Asia/Tokyo','日本'],['America/New_York','美国东部'],['America/Los_Angeles','美国西部'],['Etc/UTC','UTC']].map(([v,t])=>`<option value="${v}" ${state.profile.timeZone===v?'selected':''}>${t}</option>`).join('')}</select></label><label class="field">示范语速<select name="speechRate">${[[0.65,'慢速 · 0.65'],[0.85,'学习 · 0.85'],[1,'原速 · 1.0（建议）']].map(([v,t])=>`<option value="${v}" ${Number(state.profile.speechRate)===v?'selected':''}>${t}</option>`).join('')}</select></label></div><label class="checkbox-field"><input type="checkbox" name="showRomaji" ${state.profile.showRomaji?'checked':''}> 显示罗马音提示（熟悉假名后可以关闭）</label><div class="form-actions"><button class="btn primary" type="submit">保存设置 ${icon('check',17)}</button></div></form>`+
  `<section class="card"><div class="card-header"><div><h2 class="section-title">进度与备份</h2><p class="section-subtitle">学习记录保存在当前浏览器。换设备时先导出，再在新设备导入。</p></div></div><div class="form-actions">${button(icon('download',17)+' 导出学习进度','export','secondary')}<label class="btn secondary" for="import-file">导入已有进度<input id="import-file" type="file" accept=".json,application/json" class="sr-only"></label></div><p class="text-small text-muted">当前版本没有账号云同步。清除浏览器数据会删除本地进度；定期导出可以保留你的学习记录。</p></section><section class="card"><h2 class="section-title">发音与录音</h2><p>优先播放随课程提供的真人发音或预生成神经合成语音；每条示范旁会显示来源。听整体节奏时建议选择 1.0 原速，需要拆开练习时再用慢速。</p>${speechButtons('こんにちは。いっしょに日本語を勉強しましょう。')}<p class="text-small text-muted">没有对应素材或素材暂时不可用时，使用设备已安装的日语声线作为备用；不会把输入文字发送到语音服务。真人音频、合成示范与自己的录音会分别标明。</p><p class="text-small text-muted">录音仅在你点击“开始录音”后请求麦克风，留在当前页面供回听，切到后台时停止采集，关闭练习后清除。不会上传、转写或自动评分。</p></section><section class="card"><h2 class="section-title">跟着真人听一小段</h2><p>IRODORI 官方入门课程：先听问候和请求重复，再模仿语气与停顿。以下链接在官方页面播放，适合与本应用的短句示范搭配练习。</p><div class="form-actions"><a class="btn secondary" href="https://www.irodori.jpf.go.jp/en/starter/audio/lesson01.html" target="_blank" rel="noopener noreferrer">第 1 课 · 日常问候 ↗</a><a class="btn secondary" href="https://www.irodori.jpf.go.jp/en/starter/audio/lesson02.html" target="_blank" rel="noopener noreferrer">第 2 课 · 听不懂时怎么办 ↗</a></div></section><section class="card"><h2 class="section-title">内容边界</h2><p>课程例句、练习和情境对话为原创。内置微课是日常练习与阶段导入；完整课程及原声输入通过官方材料补充。N1 目标不能由打卡或微课正确率直接确认。</p><p class="text-small text-muted">版本 1.2 · 目标与旅居设置由你决定 · 资料核对日期 2026-10-24</p></section>`;
}

function openModal(title, body, footer = '') {
  stopSpeech();
  $('#modal-content').innerHTML=`<div class="modal-header"><div><p class="eyebrow">日々 · PRACTICE</p><h2 class="modal-title" id="modal-title">${esc(title)}</h2></div><button class="close-button" data-action="close-modal" aria-label="关闭练习">${icon('close')}</button></div><div class="modal-body"><div id="modal-notice" class="note note-warning" role="status" hidden></div>${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}`;
  $('#modal').setAttribute('aria-labelledby','modal-title');
  if(!$('#modal').open) $('#modal').showModal();
  $('#modal-title').tabIndex=-1; $('#modal-title').focus({preventScroll:true}); $('#modal').scrollTop=0;
  lastInteraction=Date.now();
}
function closeModal() {
  stopSpeech();
  if (!$('#modal')?.open) return;
  suspendSession();
  if(session?.type==='focus'&&!session.saved&&session.seconds>0) saveFocus(false);
  if(session?.type==='review'&&session.seconds>0){state=recordActivity(state,{seconds:Math.floor(session.seconds)});persist();}
  if(session?.type==='scenario'&&!session.saved&&session.seconds>0){state=recordActivity(state,{seconds:Math.floor(session.seconds)});persist();}
  stopRecording(true);
  $('#modal').close(); session=null; pendingImport=null;
  render();
}
function setSession(value) {
  if($('#modal').open) closeModal();
  session={seconds:0,nonce:`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,...value}; lastTick=performance.now(); lastInteraction=Date.now();
}
function speechButtons(text) {return `<div class="example-actions">${button(icon('sound',17)+' 听示范','speak','ghost small',`data-text="${esc(text)}"`)}${button('原速','speak','ghost small',`data-text="${esc(text)}" data-speed="1"`)}${button('慢速','speak','ghost small',`data-text="${esc(text)}" data-speed="0.65"`)}${button('停止','stop-speech','ghost small')}<span class="text-small text-muted" data-speech-key="${esc(normalizePronunciationText(text))}" role="status" aria-live="polite">${esc(pronunciationLabel(text))} · ${Number(state.profile.speechRate)===1?'原速':`${esc(state.profile.speechRate)}×（当前设置）`}</span></div>`;}
function startLesson(id) {
  const lesson=course.lessons.find(l=>l.id===id); if(!lesson)return;
  if(suspended?.lessonId===id){resumeLesson();return;}
  setSession({type:'lesson',lessonId:id,title:lesson.title,level:lesson.level,mode:'full',stage:'intro',questions:lesson.questions,index:0,results:[],correct:0,feedback:null,assisted:false,showTranscript:false});
  showLessonIntro(); suspendSession();
}
function resumeLesson() {
  if(!suspended)return;
  const old=structuredClone(suspended),lesson=course.lessons.find(l=>l.id===old.lessonId);
  if(!lesson){clearSuspended();return;}
  const questions=old.mode==='mistakes'?lesson.questions.filter(q=>old.questions?.some(p=>p.id===q.id)):lesson.questions;
  if(!questions.length||!Number.isInteger(old.index)||old.index<0||old.index>=questions.length||old.results.length>questions.length){clearSuspended();toast('未完成练习无法恢复，请重新开始这一课。');return;}
  setSession({...old,questions,seconds:Math.min(old.seconds,86400),correct:old.results.filter(r=>r.correct).length});
  if(session.stage==='intro')showLessonIntro();else renderQuestion();
}
function showLessonIntro() {
  const lesson=course.lessons.find(l=>l.id===session.lessonId);
  const body=`<div class="chip-row"><span class="badge green">${levelLabel(lesson.level)}</span><span class="text-small text-muted">${lesson.minutes} 分钟 · ${lesson.questions.length} 道练习</span></div><h3 class="section-title">这一课，你将能……</h3><p>${esc(lesson.canDo)}</p><div class="reading-block">${lesson.explanation.map(p=>`<p>${nl(p)}</p>`).join('')}</div><h3 class="section-title">先听，再跟着说</h3>${lesson.examples.map(ex=>`<div class="example-card"><p class="japanese" lang="ja">${nl(ex.jp)}</p>${ex.kana&&ex.kana!==ex.jp?`<p class="text-small" lang="ja">${esc(ex.kana)}</p>`:''}${state.profile.showRomaji&&ex.romaji?`<p class="romaji">${esc(ex.romaji)}</p>`:''}<p class="translation">${esc(ex.zh)}</p>${ex.note?`<p class="text-small text-muted">${esc(ex.note)}</p>`:''}${speechButtons(ex.jp)}</div>`).join('')}<div class="note"><strong>听完后，把目光移开，试着再说一遍。</strong><p>下一步会做 ${lesson.questions.length} 道题。听力题先播放声音；看过原文后作答，会记录为辅助练习。</p></div>`;
  openModal(lesson.title,body,button('开始练习 '+icon('arrow'),'begin-questions'));
}
function renderQuestion() {
  if(!session)return;
  const q=session.questions[session.index];
  const audio=q.type==='listen'; const result=session.feedback;
  const options=q.choices||[];
  const answerBody=q.type==='input'?`<form id="answer-form"><label class="field">你的回答<input id="answer-input" name="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="按题目要求输入答案" ${result?'disabled':''} value="${esc(result?.answer||'')}"></label>${!result?'<button class="btn primary" type="submit">检查回答</button>':''}</form>`:
    `<div class="question-options">${options.map((o,i)=>`<button class="answer-option ${result&&(String(o.id)===String(q.answer))?'correct':''} ${result&&String(o.id)===String(result.answer)&&!result.rawCorrect?'incorrect':''} ${result&&String(o.id)===String(result.answer)?'selected':''}" data-action="answer" data-value="${esc(o.id)}" ${result?'disabled':''}><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${nl(o.text)}</span>${result&&String(o.id)===String(q.answer)?icon('check',18):''}</button>`).join('')}</div>`;
  let right=q.answer;
  if(options.length)right=options.find(o=>String(o.id)===String(q.answer))?.text||q.answer;
  const feedback=result?`<div class="feedback ${result.correct?'correct':'incorrect'}" role="status"><strong>${result.correct?'答对了。':result.rawCorrect&&result.assisted?'答对了，这次有原文辅助。':'这题先记下来，下一次再见。'}</strong><p>参考答案：${esc(right)}</p><p>${esc(q.explanation)}</p>${result.assisted?'<p class="text-small">本题看过原文，不计入独立答对率。</p>':''}${audio?`<details ${session.showTranscript?'open':''}><summary>听力原文</summary><p lang="ja" class="japanese">${nl(q.audio)}</p></details>`:''}</div>`:'';
  const body=`<div class="step-progress"><span>${session.type==='sample'?'课程熟题抽测':session.type==='mistake-bank'?'错题回看':session.type==='kana'?'五十音练习':session.mode==='mistakes'?'错题再练':'随堂练习'}</span><span>${session.index+1} / ${session.questions.length}</span></div><div class="progress-bar"><span style="width:${percent(session.index,session.questions.length)}%"></span></div><h3 class="question-prompt">${nl(q.prompt)}</h3>${audio?`<div class="listening-box">${speechButtons(q.audio)}${!result?button(session.showTranscript?'原文已显示':'需要帮助：查看原文','reveal-transcript','ghost small'):''}<p class="text-small text-muted">先听后答。若素材与本地备用都不可用，可看原文完成辅助练习。</p></div>${session.showTranscript&&!result?`<div class="reading-block" lang="ja">${nl(q.audio)}</div>`:''}`:q.jp?`<div class="question-jp japanese" lang="ja">${nl(q.jp)}</div>`:''}${answerBody}${feedback}`;
  const footer=result?button(session.index+1===session.questions.length?'查看本轮结果':'下一题 '+icon('arrow'),'next-question'):button('还不会，看看解析','skip-question','ghost');
  openModal(session.title,body,footer); suspendSession();
}
function answerQuestion(value,skip=false) {
  if(!session||session.feedback)return;
  const q=session.questions[session.index];
  const rawCorrect=!skip&&checkAnswer(q,value); const correct=rawCorrect&&!session.assisted;
  const result={questionId:q.id,index:session.index,answer:String(value||''),rawCorrect,correct,assisted:!!session.assisted};
  session.results.push(result); if(correct)session.correct++;
  session.feedback=result; renderQuestion();
}
function nextQuestion(){
  if(!session?.feedback)return;
  session.index++;
  if(session.index>=session.questions.length){finishQuestions();return;}
  session.feedback=null; session.assisted=false;session.showTranscript=false;renderQuestion();
}
function finishQuestions(){
  if(!session)return;
  session.stage='summary';
  if(!session.saved){
    const data={correct:session.correct,total:session.questions.length,seconds:Math.floor(session.seconds)};
    if(session.type==='lesson'&&session.mode==='full'){
      state=recordLesson(state,{lessonId:session.lessonId,...data});
      if(data.correct/data.total>=0.8)activateCards(course.lessons.find(l=>l.id===session.lessonId).vocab);
    }else{
      state=recordActivity(state,{seconds:data.seconds,answered:data.total,correct:data.correct});
      if(session.type==='sample'||session.type==='kana')state=recordAssessment(state,{kind:session.type==='kana'?'kana':'sample',level:session.level,title:session.title,...data});
      if(session.type==='kana')activateCards(session.questions.map(q=>cardCatalog.find(c=>c.id===q.cardId)).filter(Boolean));
    }
    if(session.type!=='kana')state=recordAssessment(state,{kind:'drill',title:session.title,results:session.results.map(r=>({questionId:r.questionId,correct:!!r.correct}))});
    session.saved=true; persist(); if(session.type==='lesson')clearSuspended();
  }
  const score=percent(session.correct,session.questions.length);const wrong=session.results.filter(r=>!r.correct);
  let title=score>=80?'这一步，走得很扎实。':'已经开始，就是进步。';
  const description=session.type==='sample'?'这是学过内容的抽测，不代表 JLPT 等级。请用新的完整材料继续检查。':session.type==='kana'?'练过的假名已加入复习，之后会再和你见面。':session.type==='mistake-bank'?'独立答对的题已从待巩固列表移除；还不熟的题会继续保留。':session.mode==='mistakes'?'本轮只练了错题；不会替代整课的完成记录。':score>=80?'本课练习已通过，词卡已经加入复习。下一次从回想开始。':(state.lessons[session.lessonId]?.completedAt?'这次还有需要巩固的地方；保留此前的通过记录，目标是再次独立答对至少 80%。':'先回看解析，再练一次。本课尚未标记通过，目标是独立答对至少 80%。');
  openModal('本轮练习完成',`<div class="session-summary"><span class="badge ${score>=80?'green':'orange'}">${session.questions.length} 题已完成</span><div class="big-number">${score}<small>%</small></div><h3 class="section-title">${title}</h3><p>${description}</p><div class="chip-row"><span class="chip">独立答对 ${session.correct}/${session.questions.length}</span><span class="chip">练习计时 ${formatTime(session.seconds)}</span></div></div>${wrong.length?`<div class="reading-block"><strong>再看一眼这 ${wrong.length} 个点</strong>${wrong.map(r=>{const q=session.questions[r.index];return `<p><b>${esc(q.prompt)}</b><br>${esc(q.explanation)}</p>`;}).join('')}</div>`:''}`,`${wrong.length&&session.type==='lesson'?button('只练本轮错题','redo-mistakes','secondary'):''}${button('回到学习空间','close-modal')}`);
}
function redoMistakes(){
  if(!session)return;
  const previous=session;
  const questions=previous.results.filter(r=>!r.correct).map(r=>previous.questions[r.index]);
  if(!questions.length)return;
  setSession({type:'lesson',lessonId:previous.lessonId,title:`${previous.title} · 错题`,level:previous.level,mode:'mistakes',stage:'questions',questions,index:0,results:[],correct:0,feedback:null,assisted:false,showTranscript:false});renderQuestion();
}
function startSample(level){
  const candidates=course.lessons.filter(l=>l.level===level).flatMap(l=>l.questions);
  if(!candidates.length){toast('这个阶段暂时没有内置抽测，请使用官方材料。');return;}
  setSession({type:'sample',title:`${levelName(level)} · 课程熟题抽测`,level,stage:'questions',questions:shuffle(candidates).slice(0,10),index:0,results:[],correct:0,feedback:null,assisted:false,showTranscript:false});renderQuestion();
}
function getMistakes(){
  const results=new Map();
  for(const assessment of state.assessments){
    if(assessment.kind==='drill'&&Array.isArray(assessment.results))for(const r of assessment.results)if(typeof r?.questionId==='string'&&typeof r.correct==='boolean')results.set(r.questionId,r.correct);
  }
  return course.lessons.flatMap(l=>l.questions).filter(q=>results.get(q.id)===false);
}
function startMistakes(){
  const questions=shuffle(getMistakes()).slice(0,10);
  if(!questions.length){toast('当前没有待巩固的错题。');return;}
  setSession({type:'mistake-bank',title:'错题回看 · 再试一次',level:getPhase(),stage:'questions',questions,index:0,results:[],correct:0,feedback:null,assisted:false,showTranscript:false});renderQuestion();
}
function startKanaQuiz(){
  const pool=kana.filter(k=>kanaGroupFor(k)===kanaGroup);
  const questions=shuffle(pool).slice(0,10).map(k=>{
    const readings=shuffle([...new Set(pool.map(c=>c.romaji))].filter(r=>normalizeAnswer(r)!==normalizeAnswer(k.romaji))).slice(0,3);
    const answer=k.romaji;
    return {id:`quiz-${k.id}-${kanaMode}`,cardId:`kana-${kanaMode==='hiragana'?'h':'k'}-${k.id}`,type:'choice',prompt:'这个假名怎么读？',jp:k[kanaMode],choices:shuffle([answer,...readings]).map(r=>({id:r,text:r})),answer,explanation:`${k.hiragana} / ${k.katakana} 的读法是 ${k.romaji}。${k.note||''}`};
  });
  setSession({type:'kana',title:kanaMode==='hiragana'?'平假名 · 短练习':'片假名 · 短练习',level:'foundation',stage:'questions',questions,index:0,results:[],correct:0,feedback:null,assisted:false});renderQuestion();
}
function openKana(id){
  const k=kana.find(x=>x.id===id); if(!k)return;
  setSession({type:'kana-detail',kanaId:id});
  openModal('认识一个声音',`<div class="kana-detail"><div class="review-front japanese" lang="ja">${esc(k.hiragana)} <span class="text-muted">/</span> ${esc(k.katakana)}</div><p class="romaji">${esc(k.romaji)}</p>${speechButtons(k[kanaMode])}<p>${esc(k.note||'听一次示范，然后看着假名读，再移开目光说一次。')}</p></div><div class="note"><p>同一个声音有平假名、片假名两种写法。罗马音只是一座临时的桥。</p></div>`,button('把这个声音加入复习','add-kana','primary',`data-id="${esc(id)}"`));
}
function startReview(){
  const queue=dueCards(state,cardCatalog).slice(0,20);
  if(!queue.length){setSession({type:'info'});openModal('现在没有到期卡片',`<div class="empty-state"><h3>先学一点，记忆就有了起点。</h3><p>学完一课或练习假名后，卡片会进入你的复习队列。</p></div>`,button('去学习一课','open-course'));return;}
  setSession({type:'review',queue,index:0,revealed:false,reviewed:0});renderReview();
}
function renderReview(){
  if(session.index>=session.queue.length){session.stage='summary';openModal('本轮复习完成',`<div class="session-summary"><span class="badge green">REVIEW COMPLETE</span><div class="big-number">${session.reviewed}<small> 张</small></div><h3 class="section-title">给记忆留一点生长的时间。</h3><p>卡片已按你选择的难度安排下一次。“再来”的内容约 10 分钟后会重新到期。</p></div>`,button('回到学习空间','close-modal'));return;}
  const c=session.queue[session.index];
  const front=c.kind==='kana'?c.jp:c.zh;
  const body=`<div class="step-progress"><span>主动回想</span><span>${session.index+1} / ${session.queue.length}</span></div><div class="review-card"><p class="eyebrow">${c.kind==='kana'?'试着读出这个声音':'这句话 / 这个词，用日语怎么说？'}</p><div class="review-front" ${c.kind==='kana'?'lang="ja"':''}>${esc(front)}</div>${session.revealed?`<div class="review-answer"><p lang="ja" class="japanese">${esc(c.jp)}</p><p lang="ja">${esc(c.kana)}</p>${state.profile.showRomaji?`<p class="romaji">${esc(c.romaji)}</p>`:''}<p class="translation">${esc(c.zh)}</p>${speechButtons(c.jp)}</div>`:'<p class="text-small text-muted">给自己几秒钟，不急着翻面。</p>'}</div>`;
  const footer=session.revealed?`<div class="rating-grid">${[['again','再来','10 分钟'],['hard','有点难','约 1 天'],['good','记住了','延长间隔'],['easy','很轻松','更长间隔']].map(([value,label,hint])=>`<button class="btn ${value==='good'?'primary':'secondary'}" data-action="rate-card" data-grade="${value}"><span>${label}<small>${hint}</small></span></button>`).join('')}</div>`:button('翻开答案','reveal-card');
  openModal('记忆复习',body,footer);
}
function rateCard(grade){
  if(session?.type!=='review'||!session.revealed||!['again','hard','good','easy'].includes(grade))return;
  const card=session.queue[session.index];
  state=reviewCard(state,card.id,grade);state=recordActivity(state,{seconds:Math.floor(session.seconds),reviewed:1});persist();
  session.seconds=0;session.index++;session.reviewed++;session.revealed=false;renderReview();
}
function startScenario(id){
  const s=course.scenarios.find(x=>x.id===id);if(!s)return;
  setSession({type:'scenario',scenarioId:id,nodeId:'start',history:[],feedback:null,showTranslation:true,choices:0,retries:0});renderScenario();
}
function recordingControls(){return `<div class="recording-box"><div class="example-actions">${button(icon('mic',17)+' 开始录音','record','secondary small')}${button('停止录音','stop-record','ghost small','disabled')}<span id="recording-status" class="text-small text-muted">录下自己，听听与示范的区别。</span></div><audio id="mic-playback" controls hidden></audio><p class="text-small text-muted">仅在本页回听，不上传，不自动评分；关闭练习后清除。</p></div>`;}
function renderScenario(){
  const s=course.scenarios.find(x=>x.id===session.scenarioId); const node=s.nodes.find(n=>n.id===session.nodeId);
  if(!node){toast('这个对话节点暂时不可用。');closeModal();return;}
  if(node.end&&!session.saved){state=recordActivity(state,{seconds:Math.floor(session.seconds),scenarioId:s.id});session.saved=true;persist();}
  const history=session.history.slice(-6).map(h=>`<div class="chat-row ${h.speaker==='你'?'self':''}"><span class="chat-speaker">${esc(h.speaker)}</span><div class="speech-bubble"><p lang="ja">${esc(h.jp)}</p>${h.speaker==='你'?speechButtons(h.jp):''}</div></div>`).join('');
  const current=`<div class="chat-row"><span class="chat-speaker">${esc(node.speaker)}</span><div class="speech-bubble"><p lang="ja" class="japanese">${nl(node.jp)}</p>${node.kana?`<p lang="ja" class="text-small">${esc(node.kana)}</p>`:''}${state.profile.showRomaji&&node.romaji?`<p class="romaji">${esc(node.romaji)}</p>`:''}${session.showTranslation?`<p class="translation">${esc(node.zh)}</p>`:''}${speechButtons(node.jp)}</div></div>`;
  const options=node.end?`<div class="note note-success"><strong>这个场景，你已经练完了。</strong><p>${esc(s.goal)} · 本轮 ${session.choices} 次选择，${session.retries} 次提示。再读一遍自己的回应，然后试着录音复述。</p></div>`:session.feedback?`<div class="feedback ${session.feedback.quality==='good'?'correct':'incorrect'}" role="status"><strong>${session.feedback.quality==='good'?'这句很合适。':'换一种说法试试。'}</strong><p>${esc(session.feedback.text)}</p></div>`:`<h3 class="section-title">轮到你回应</h3><div class="question-options">${node.options.map(o=>`<button class="answer-option" data-action="scenario-answer" data-id="${esc(o.id)}"><span><span lang="ja" class="japanese">${esc(o.jp)}</span>${o.kana?`<small lang="ja">${esc(o.kana)}</small>`:''}${state.profile.showRomaji&&o.romaji?`<small class="romaji">${esc(o.romaji)}</small>`:''}${session.showTranslation?`<small>${esc(o.zh)}</small>`:''}</span></button>`).join('')}</div>`;
  const footer=node.end?`${button('再练一次','start-scenario','secondary',`data-id="${esc(s.id)}"`)}${button('完成','close-modal')}`:session.feedback?button('继续对话 '+icon('arrow'),'scenario-next'):button(session.showTranslation?'隐藏中文，试着理解':'显示中文提示','toggle-translation','ghost');
  stopRecording(true);
  openModal(s.title,`<div class="chip-row"><span class="badge green">${esc(s.place)}</span><span class="text-small text-muted">${esc(levelName(s.level))}</span></div><p class="section-subtitle">${esc(s.intro)}</p><div class="chat-history">${history}${current}</div>${options}${recordingControls()}`,footer);
}
function scenarioAnswer(id){
  if(session?.type!=='scenario'||session.feedback)return;
  const s=course.scenarios.find(x=>x.id===session.scenarioId);const node=s.nodes.find(n=>n.id===session.nodeId);const option=node.options.find(o=>o.id===id);if(!option)return;
  session.history.push({speaker:node.speaker,jp:node.jp},{speaker:'你',jp:option.jp});session.choices++;
  if(option.quality==='retry')session.retries++;
  session.feedback={quality:option.quality,text:option.feedback,next:option.next};renderScenario();
}
function startFocus(kind='course'){
  const names={listen:'听力输入',listening:'听力输入',reading:'阅读练习',speaking:'跟读与表达',course:'完整课程学习'};
  setSession({type:'focus',kind,title:names[kind]||'完整课程学习',seconds:0,targetMinutes:25,running:false});renderFocus();
}
function renderFocus(){
  const body=`<div class="focus-timer"><p class="eyebrow">ONE THING AT A TIME</p><h3 class="section-title">${esc(session.title)}</h3><div class="timer-display" id="timer-display" role="timer" aria-label="专注计时">${formatTime(session.seconds)}</div><p class="text-small text-muted" id="timer-status">${session.running?'计时中 · 离开学习时请暂停':'准备好后开始，按实际计时记录。'}</p><div class="timer-controls">${button(session.running?'暂停计时':'开始 / 继续','toggle-focus')}${button('记录并结束','finish-focus','secondary')}</div></div><div class="form-grid"><label class="field">正在使用的材料<input id="focus-source" maxlength="200" placeholder="例如：IRODORI 入门第 1 课"></label><label class="field">今天发现的一点<textarea id="focus-note" maxlength="1500" placeholder="记一句新表达，或一个还没听懂的地方。"></textarea></label></div><p class="text-small text-muted">计时会在后台继续，方便你打开材料学习。离开学习时请暂停；这里记录的是你确认的练习时间，不推断掌握程度。</p><h3 class="section-title">当前阶段可以用的材料</h3>${resourceList(getPhase())}`;
  openModal('一段专注的时间',body,button('关闭并保存已计时时间','close-modal','ghost'));
}
function saveFocus(showMessage=true){
  if(session?.type!=='focus'||session.saved)return;
  const seconds=Math.floor(session.seconds);session.running=false;session.saved=true;
  if(seconds>0){state=recordActivity(state,{seconds});state=recordAssessment(state,{kind:'study-log',title:session.title,seconds,source:$('#focus-source')?.value?.trim()||session.title,note:$('#focus-note')?.value?.trim()||''});persist();if(showMessage)toast(`已记录 ${formatTime(seconds)} 的练习时间。`);}else if(showMessage)toast('还没有开始计时，没有增加学习时长。');
}
function assessmentForm(){
  setSession({type:'assessment-form'});
  const phase=getPhase();
  openModal('记录一次真实测评',`<p class="section-subtitle">记录新材料的各科原始正确率。官方 JLPT 使用标准分，本工具不把正确率换算成“通过分数”。</p><form id="assessment-form"><div class="form-grid"><label class="field">材料级别<select name="level">${levels.filter(l=>l!=='foundation').map(l=>`<option ${l===(phase==='foundation'?'N5':phase==='consolidation'?'N1':phase)?'selected':''}>${l}</option>`).join('')}</select></label><label class="field">完成日期<input type="date" name="date" value="${todayKey()}" max="${todayKey()}" required></label><label class="field span-2">材料名称<input name="source" maxlength="200" placeholder="填写实际做过的练习册、套题及回次" required></label><label class="field">语言知识正确率（%）<input type="number" name="knowledge" min="0" max="100" step="0.1" required></label><label class="field">阅读正确率（%）<input type="number" name="reading" min="0" max="100" step="0.1" required></label><label class="field">听力正确率（%）<input type="number" name="listening" min="0" max="100" step="0.1" required></label></div><label class="checkbox-field"><input type="checkbox" name="timed"> 按材料规定的时间完整作答</label><label class="checkbox-field"><input type="checkbox" name="unseen"> 第一次做这份材料，未提前看答案</label><label class="field">复盘备注<textarea name="note" maxlength="1500" placeholder="最容易卡在哪里？下周准备补什么？"></textarea></label><div class="form-actions"><button class="btn primary" type="submit">保存测评记录</button></div></form>`);
}
function pronunciationLabel(text){
  const key=normalizePronunciationText(text),entry=Object.hasOwn(pronunciation.entries,key)?pronunciation.entries[key]:null;
  return entry?(typeof entry==='string'?pronunciation.label:entry.label)||'预生成神经合成语音':'系统本地备用';
}
function setSpeechStatus(message){
  for(const label of $$('[data-speech-key]'))if(label.dataset.speechKey===activeSpeechKey)label.textContent=message;
}
function createSpeechPlayer(){
  return createPronunciationPlayer({
    manifest:pronunciation,baseURL:document.baseURI,createAudio:()=>new Audio(),isHidden:()=>document.hidden,
    stopFallback:()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();speechUtterance=null;},
    onStatus:event=>{
      if(event.state==='loading')setSpeechStatus(`正在载入 · ${event.label}`);
      else if(event.state==='playing')setSpeechStatus(`正在播放 · ${event.label} · ${event.rate===1?'原速':`${event.rate}×`}`);
      else if(event.state==='ended')setSpeechStatus(`${event.label} · 播放完成`);
      else if(event.state==='fallback')setSpeechStatus('系统本地备用 · 正在准备声线');
      else if(event.state==='unavailable')setSpeechStatus('暂无可用发音 · 可打开官方真人音频');
      else if(event.state==='cancelled')setSpeechStatus(`${event.source==='local'?'系统本地备用':pronunciationLabel(activeSpeechKey)} · 已停止`);
    },
  });
}
function stopSpeech(){
  speechRequest++;pronunciationPlayer.stop();speechUtterance=null;activeSpeechKey='';
}
async function speak(text,rate){
  if(!text||document.hidden)return;
  stopSpeech();activeSpeechKey=normalizePronunciationText(text);
  const request=speechRequest,playbackRate=Number(rate||state.profile.speechRate||1);
  return pronunciationPlayer.play(text,{rate:playbackRate,fallback:({text:phrase,rate:speed,isCurrent})=>
    speakLocal(phrase,speed,()=>isCurrent()&&request===speechRequest)});
}
async function speakLocal(text,rate,isCurrent){
  if(!isCurrent()||document.hidden)return false;
  if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){toast('这段示范音频暂不可用，此浏览器也不支持本地备用发音。可使用设置中的官方真人音频入口。');return false;}
  const synth=window.speechSynthesis;
  let voices=synth.getVoices();
  if(!voices.length){await new Promise(resolve=>{let timer;const done=()=>{clearTimeout(timer);synth.removeEventListener?.('voiceschanged',done);resolve();};synth.addEventListener?.('voiceschanged',done);timer=setTimeout(done,800);});voices=synth.getVoices();}
  if(!isCurrent()||document.hidden)return false;
  const voice=voices.find(v=>v.localService===true&&/^ja(?:[-_]|$)/i.test(v.lang));
  if(!voice){toast('这段素材暂不可用，也未找到本地日语声线。请在系统设置中下载日语语音后重试，或打开官方真人音频。不会切换到远程语音。');return false;}
  const utterance=new SpeechSynthesisUtterance(text);utterance.lang=voice.lang||'ja-JP';utterance.voice=voice;utterance.rate=rate;utterance.pitch=1;speechUtterance=utterance;
  setSpeechStatus(`系统本地备用 · ${voice.name||'日语声线'} · ${rate===1?'原速':`${rate}×`}`);
  utterance.onend=()=>{if(!isCurrent())return;speechUtterance=null;setSpeechStatus('系统本地备用 · 播放完成');};
  utterance.onerror=event=>{if(!isCurrent()||['interrupted','canceled'].includes(event.error))return;speechUtterance=null;setSpeechStatus('系统本地备用 · 播放失败');toast('本地备用语音未能播放，请重试或使用官方真人音频。');};
  if(!isCurrent()||document.hidden)return false;
  synth.speak(utterance);return true;
}
async function startRecording(){
  if(document.hidden||recordingPending||recorder?.state==='recording')return;
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){toast('此浏览器不支持录音回放，请使用设备自带录音工具跟读。');return;}
  stopSpeech();
  const generation=++recordingGeneration,nonce=session?.nonce;
  recordingPending=true;
  const startButton=$('[data-action="record"]');if(startButton)startButton.disabled=true;
  const label=$('#recording-status');if(label)label.textContent='正在请求麦克风…';
  let stream=null;
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:true});
    if(generation!==recordingGeneration||document.hidden||!$('#modal').open||session?.nonce!==nonce){stream.getTracks().forEach(t=>t.stop());return;}
    if(recordingUrl){URL.revokeObjectURL(recordingUrl);recordingUrl=null;}
    const chunks=[],activeRecorder=new MediaRecorder(stream),ownedStream=stream;
    recorder=activeRecorder;audioStream=ownedStream;activeRecorder.discard=false;
    activeRecorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    activeRecorder.onstop=()=>{
      ownedStream.getTracks().forEach(t=>t.stop());
      if(audioStream===ownedStream)audioStream=null;
      if(recorder===activeRecorder)recorder=null;
      if(!activeRecorder.discard&&generation===recordingGeneration&&$('#modal').open&&session?.nonce===nonce){
        recordingUrl=URL.createObjectURL(new Blob(chunks,{type:activeRecorder.mimeType||'audio/webm'}));
        const player=$('#mic-playback');if(player){player.src=recordingUrl;player.hidden=false;}
        const label=$('#recording-status');if(label)label.textContent='录音已就绪，点播放回听。';
      }
      chunks.length=0;
    };
    activeRecorder.start();
    $('#recording-status').textContent='正在录音…';
    const stop=$('[data-action="stop-record"]');if(stop)stop.disabled=false;
  }catch{
    stream?.getTracks().forEach(t=>t.stop());
    if(generation===recordingGeneration){toast('没有取得麦克风权限。仍可听示范并自行跟读。');const label=$('#recording-status');if(label)label.textContent='录音未开始，可以继续听示范。';}
  }finally{
    if(generation===recordingGeneration){recordingPending=false;const start=$('[data-action="record"]');if(start)start.disabled=recorder?.state==='recording';}
  }
}
function stopRecording(discard=false){
  if(discard||recordingPending){recordingGeneration++;recordingPending=false;}
  const activeRecorder=recorder,ownedStream=audioStream;
  recorder=null;audioStream=null;
  if(activeRecorder?.state==='recording'){activeRecorder.discard=discard;activeRecorder.stop();}
  ownedStream?.getTracks().forEach(t=>t.stop());
  if(discard&&recordingUrl){URL.revokeObjectURL(recordingUrl);recordingUrl=null;}
  const start=$('[data-action="record"]'),stop=$('[data-action="stop-record"]');if(start)start.disabled=false;if(stop)stop.disabled=true;
}
function exportProgress(){
  const blob=new Blob([exportState(state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`nihongo-progress-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('学习进度已导出。请保留这份 JSON 备份。');
}
async function previewImport(file){
  if(!file)return;
  try{
    if(file.size>5*1024*1024)throw new Error('备份文件过大，请选择本应用导出的 JSON 文件。');
    const candidate=importState(await file.text());
    setSession({type:'import'});pendingImport=candidate;
    openModal('确认导入学习进度',`<div class="note note-warning"><strong>这会替换当前浏览器里的学习记录。</strong><p>建议先导出当前记录作备份。导入文件的内容已通过格式检查。</p></div><div class="stat-list"><p>复习卡片：${Object.keys(candidate.cards).length} 张</p><p>课程记录：${Object.keys(candidate.lessons).length} 项</p><p>学习日记录：${Object.keys(candidate.daily).length} 天</p><p>目标日期：${esc(candidate.profile.targetDate)}</p></div>`,`${button('先导出当前记录','export','secondary')}${button('确认替换并导入','apply-import')}`);
  }catch(error){toast(`未导入：${error.message}`);}
}

const actions={
  'settings':()=>navigate('settings'),'open-course':()=>navigate('course'),'open-progress':()=>navigate('progress'),'open-scenarios':()=>navigate('scenarios'),
  'foundation-course':()=>{lessonFilter='foundation';navigate('course');},
  'close-modal':closeModal,'start-lesson':el=>startLesson(el.dataset.id),'resume-lesson':resumeLesson,
  'begin-questions':()=>{session.stage='questions';renderQuestion();},
  'answer':el=>answerQuestion(el.dataset.value),'skip-question':()=>answerQuestion('',true),'next-question':nextQuestion,
  'reveal-transcript':()=>{session.assisted=true;session.showTranscript=true;renderQuestion();},'redo-mistakes':redoMistakes,
  'filter-lessons':el=>{lessonFilter=el.dataset.level;render();},'kana-mode':el=>{kanaMode=el.dataset.mode;render();},'kana-group':el=>{kanaGroup=el.dataset.group;render();},
  'kana-detail':el=>openKana(el.dataset.id),'kana-quiz':startKanaQuiz,
  'add-kana':el=>{const cards=kanaCatalog.filter(c=>c.sourceId===el.dataset.id);activateCards(cards);persist();toast('平假名和片假名已加入你的复习队列。');},
  'speak':el=>speak(el.dataset.text,el.dataset.speed),'stop-speech':stopSpeech,'start-review':startReview,'mistake-practice':startMistakes,'reveal-card':()=>{session.revealed=true;renderReview();},'rate-card':el=>rateCard(el.dataset.grade),
  'start-scenario':el=>startScenario(el.dataset.id),'scenario-answer':el=>scenarioAnswer(el.dataset.id),
  'scenario-next':()=>{session.nodeId=session.feedback.next;session.feedback=null;renderScenario();},
  'toggle-translation':()=>{session.showTranslation=!session.showTranslation;renderScenario();},
  'focus':el=>startFocus(el?.dataset?.kind||'course'),
  'toggle-focus':()=>{session.running=!session.running;lastTick=performance.now();const el=$('[data-action="toggle-focus"]');el.textContent=session.running?'暂停计时':'开始 / 继续';$('#timer-status').textContent=session.running?'计时中 · 离开学习时请暂停':'已暂停，准备好后继续。';},
  'finish-focus':()=>{saveFocus();closeModal();},'add-assessment':assessmentForm,'sample-assessment':el=>startSample(el.dataset.level),
  'record':startRecording,'stop-record':()=>stopRecording(false),'export':exportProgress,
  'apply-import':()=>{if(!pendingImport)return;const candidate=pendingImport;state=candidate;clearSuspended();persist();closeModal();render();toast('学习进度已导入。');}
};
document.addEventListener('click',event=>{
  lastInteraction=Date.now();
  const nav=event.target.closest('[data-route]');if(nav){navigate(nav.dataset.route);return;}
  const button=event.target.closest('[data-action]');if(button&&!button.disabled){const action=actions[button.dataset.action];if(action){try{const result=action(button);if(result?.catch)result.catch(()=>toast('这个操作没有完成，请重试。'));}catch(error){console.error(error);toast('这个操作没有完成，请重试。');}}}
});
document.addEventListener('keydown',()=>{lastInteraction=Date.now();});
document.addEventListener('input',event=>{
  lastInteraction=Date.now();
  if(event.target.id==='lesson-search'){const position=event.target.selectionStart;lessonSearch=event.target.value;render();const input=$('#lesson-search');input.focus();if(input.type==='search')input.setSelectionRange(position,position);}
});
document.addEventListener('change',event=>{if(event.target.id==='import-file')previewImport(event.target.files?.[0]);});
document.addEventListener('submit',event=>{
  if(event.target.id==='answer-form'){event.preventDefault();const answer=$('#answer-input').value.trim();if(!answer){toast('先输入回答，或选择“还不会”。');return;}answerQuestion(answer);}
  if(event.target.id==='settings-form'){
    event.preventDefault();const data=new FormData(event.target);
    const profile={...state.profile,targetDate:data.get('targetDate'),dailyMinutes:Number(data.get('dailyMinutes')),city:String(data.get('city')).trim(),departureDate:String(data.get('departureDate')),timeZone:data.get('timeZone'),speechRate:Number(data.get('speechRate')),showRomaji:data.has('showRomaji')};
    try{state=importState(JSON.stringify({...state,profile}));persist();render();toast('设置已保存。下一轮学习会使用新的节奏。');}catch(error){toast(`未保存：${error.message}`);}
  }
  if(event.target.id==='assessment-form'){
    event.preventDefault();const data=new FormData(event.target);const source=String(data.get('source')).trim();
    const result={kind:'external',level:String(data.get('level')),date:String(data.get('date')),source,knowledge:Number(data.get('knowledge')),reading:Number(data.get('reading')),listening:Number(data.get('listening')),timed:data.has('timed'),unseen:data.has('unseen'),note:String(data.get('note')).trim()};
    if(!source||result.date>todayKey()||!['knowledge','reading','listening'].every(k=>Number.isFinite(result[k])&&result[k]>=0&&result[k]<=100)){toast('请填写有效的材料名称、完成日期和 0–100 的正确率。');return;}
    state=recordAssessment(state,result);persist();closeModal();toast('测评记录已保存，各科表现已分别保留。');
  }
});
$('#modal').addEventListener('cancel',event=>{event.preventDefault();closeModal();});
window.addEventListener('popstate',()=>{const next=location.hash.slice(1);if(routeTitles[next]){closeModal();route=next;render();}});
function prepareToLeave(){
  suspendSession();
  if(session?.type==='focus'&&!session.saved)saveFocus(false);
  if(session?.type==='review'&&session.stage!=='summary'&&session.seconds>0){state=recordActivity(state,{seconds:Math.floor(session.seconds)});session.seconds=0;persist();}
  stopRecording(true);stopSpeech();
}
window.addEventListener('beforeunload',prepareToLeave);
window.addEventListener('pagehide',prepareToLeave);
window.addEventListener('pageshow',event=>{if(event.persisted&&session?.type==='focus'&&session.saved){closeModal();toast('上次专注已保存，可以开始新一段练习。');}});
window.addEventListener('storage',event=>{
  if(event.key!==STORAGE_KEY||!event.newValue)return;
  try{state=importState(event.newValue);if(!$('#modal').open)render();toast('已同步另一个标签页的最新学习记录。');}catch{toast('另一个标签页的更新无法读取，当前记录保持原样。');}
});
document.addEventListener('visibilitychange',()=>{
  if(session?.type!=='focus')lastTick=performance.now();
  suspendSession();
  if(document.hidden)stopSpeech();
  if(document.hidden&&(recordingPending||recorder?.state==='recording')){
    const wasPending=recordingPending;
    stopRecording(false);
    const message=wasPending?'页面进入后台，录音请求已取消。返回后请重新开始。':'页面进入后台，录音已停止。返回后可回听或重新开始。';
    const label=$('#recording-status');if(label)label.textContent=message;
    toast(message);
  }
});
setInterval(()=>{
  const now=performance.now(),delta=(now-lastTick)/1000;lastTick=now;
  if(!session||!$('#modal').open||session.saved||session.stage==='summary')return;
  const active=session.type==='focus'?session.running:!document.hidden&&Date.now()-lastInteraction<120000;
  if(active)session.seconds+=session.type==='focus'?Math.max(0,delta):Math.min(2,Math.max(0,delta));
  if(session.type==='focus'&&$('#timer-display'))$('#timer-display').textContent=formatTime(session.seconds);
  if(session.type==='lesson'&&Math.floor(session.seconds)%5===0)suspendSession();
},1000);
render();
$('#app').removeAttribute('aria-busy');
if(loadState.lastError)toast(loadState.lastError+' 原始记录尚未覆盖，请先检查备份。');
