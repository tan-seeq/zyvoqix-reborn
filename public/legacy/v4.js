/* Zyvoqix Professional v4.0. Additive upgrade: never changes or clears v3 player save keys. */
(() => {
'use strict';
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
const clean = value => String(value == null ? '' : value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const homepage = 'https://gamezone-play-rank-rise.vercel.app';
const pick = array => array[Math.floor(Math.random()*array.length)];
const shuffle = array => array.slice().sort(()=>Math.random()-.5);
const GAME_META = [
 {id:'quiz',art:'ICT',name:'ICT Quiz Master',desc:'Answer eight questions about computers, coding and internet safety.',record:'Best / 8'},
 {id:'typing',art:'WPM',name:'Typing Sprint',desc:'Practice accurate keyboard skills in a 30-second typing challenge.',record:'Best WPM'},
 {id:'simon',art:'1-4',name:'Pattern Pulse',desc:'Watch the coloured signals and repeat the growing pattern.',record:'Best level'},
 {id:'code',art:'123',name:'Code Breaker',desc:'Crack a secret three-digit code using clues in eight tries.',record:'Best tries'}
];
const ICT_QUESTIONS = [
 ['What does HTML mainly describe?',['The structure of a web page','A computer battery','A programming keyboard','An image format'],0],
 ['Which technology is used to style a web page?',['DNS','CSS','Bluetooth','USB'],1],
 ['What is JavaScript commonly used for on websites?',['Powering interactions','Replacing all computers','Making paper copies','Charging a battery'],0],
 ['What does a browser do?',['Runs only games','Opens websites','Repairs a computer fan','Stores electricity'],1],
 ['What does URL stand for?',['Universal Remote Link','Uniform Resource Locator','User Report Log','Unified Reading Language'],1],
 ['Which is the safer web address prefix?',['ftp://','http://','https://','file://'],2],
 ['Which of these is an input device?',['Monitor','Speaker','Keyboard','Printer'],2],
 ['Which of these is an output device?',['Mouse','Monitor','Microphone','Touchpad'],1],
 ['What is RAM used for?',['Temporary working memory','Printing documents','Cooling the screen','Making Wi-Fi signals'],0],
 ['What is an algorithm?',['A step-by-step set of instructions','A screen size','A type of printer','An email address'],0],
 ['What is a database?',['An organised collection of data','A button on a controller','A computer cable','An antivirus alert'],0],
 ['Why is a strong password important?',['It makes games louder','It protects an account','It improves screen brightness','It fixes internet speed'],1],
 ['What should you do with a suspicious link?',['Open it quickly','Send it to friends','Avoid it and ask a trusted adult','Enter your password'],2],
 ['What should you do before editing an important file?',['Delete the original','Make a backup','Switch off the monitor','Share your password'],1],
 ['What is an example of an operating system?',['Windows','HDMI','Keyboard','JPEG'],0],
 ['What is localStorage used for in a website?',['Saving browser data on this device','Publishing global rankings','Selling game accounts','Replacing the internet'],0],
 ['What does responsive design mean?',['Works only on a desktop','Adapts to different screen sizes','Runs without a CPU','Uses a single colour'],1],
 ['Which is good online behaviour?',['Share private information','Be respectful and kind','Guess other passwords','Post threats'],1],
 ['What makes a website interactive?',['Buttons and actions that respond','Only static text','An unplugged computer','A printed screenshot'],0],
 ['Which coding language can run in the browser?',['JavaScript','Spreadsheet formulas only','SQL server only','Printer firmware only'],0]
];
const TYPING_PHRASES = [
 'Great games reward patience and practice.',
 'Learning to code unlocks creative ideas.',
 'A secure password protects your account.',
 'Zyvoqix makes learning fun and interactive.',
 'Always be kind to other players online.',
 'Small improvements lead to better results.'
];
let active = null, timers = [], typedTicker=null, stagedPrompt=null;
const later = (fn,ms) => {const id=setTimeout(fn,ms);timers.push(id);return id};
function stop(){timers.forEach(clearTimeout);timers=[];if(typedTicker){clearInterval(typedTicker);typedTicker=null}active=null;}
function getRecord(id){
 if(!state.arcade || typeof state.arcade!=='object')state.arcade={};
 if(!state.arcade.extras || typeof state.arcade.extras!=='object')state.arcade.extras={};
 if(!state.arcade.extras[id] || typeof state.arcade.extras[id]!=='object')state.arcade.extras[id]={best:0,plays:0,wins:0,game:null};
 return state.arcade.extras[id];
}
function save(){persist();updateScores()}
function once(id){const key='arcade-'+id;if(!state.done.includes(key)){state.done.push(key);addXP(20,GAME_META.find(x=>x.id===id)?.name||'Skill Arcade')}else save()}
function finished(id,value,{low=false,win=false}={}){
 const rec=getRecord(id);rec.plays=(rec.plays||0)+1;if(win)rec.wins=(rec.wins||0)+1;
 if(Number.isFinite(value))rec.best=low?(rec.best?Math.min(rec.best,value):value):Math.max(rec.best||0,value);
 once(id);updateScores();
}
function bestFor(game){const r=getRecord(game.id);return game.id==='code'?(r.best ? r.best + ' tries' : 'Not played'):(r.best||0).toString()}
function card(game){return `<article class="gz-game-card"><div class="gz-art" aria-hidden="true">${game.art}</div><h3>${game.name}</h3><p>${game.desc}</p><div class="best" data-v4best="${game.id}">${game.record}: ${bestFor(game)}</div><button class="btn primary" type="button" data-v4game="${game.id}">Play / Resume &rarr;</button></article>`}
function updateScores(){for(const game of GAME_META)$$(`[data-v4best="${game.id}"]`).forEach(el=>el.textContent=game.record+': '+bestFor(game));}
function score(items){return '<div class="gz-game-score">'+items.map(([key,value])=>`<span>${clean(key)} <strong>${clean(value)}</strong></span>`).join('')+'</div>'}
function stage(title,instructions,content){const el=$('#arcadeStage');if(!el)return;
 el.innerHTML=`<div class="gz-game-panel"><div class="gz-game-top"><h2>${title}</h2><button class="btn small" type="button" data-v4back>All games &larr;</button></div><p class="hint">${instructions}</p>${content}<div class="gz-game-message" id="gzGameMessage" role="status" aria-live="polite"></div></div>`;
}
function message(text){const el=$('#gzGameMessage');if(el)el.textContent=text;}
function openGame(id){if(!GAME_META.some(x=>x.id===id))return;
 stop();const nav=$('#nav [data-page="arcade"]');if(nav)nav.click();else go('arcade');
 active=id;drawGame();$('#arcadeStage')?.scrollIntoView({block:'start',behavior:'smooth'});
}
function drawGame(){switch(active){case 'quiz':drawQuiz();break;case 'typing':drawTyping();break;case 'simon':drawSimon();break;case 'code':drawCode();break;}}
function startQuiz(){const r=getRecord('quiz');r.game={questions:shuffle(Array.from({length:ICT_QUESTIONS.length},(_,i)=>i)).slice(0,8),round:0,correct:0,finished:false};save();drawQuiz()}
function drawQuiz(){const r=getRecord('quiz');if(!r.game?.questions){startQuiz();return}
 const g=r.game;
 if(g.finished){stage('ICT Quiz Master','Eight questions about computers and online safety.',score([['Correct answers',g.correct+'/8'],['Personal best',r.best+'/8'],['Completed',r.plays]])+`<div class="gz-quiz-q">Quiz complete. ${g.correct>=6?'Excellent knowledge!':'Great effort. Keep learning!'}</div><div class="gz-cta-actions"><button class="btn primary" data-v4-quiz-restart>Try another quiz</button></div>`);return;}
 const q=ICT_QUESTIONS[g.questions[g.round]];
 stage('ICT Quiz Master','Choose the best answer. Your progress saves after every question.',score([['Question',g.round+1+'/8'],['Correct',g.correct],['Personal best',r.best+'/8']])+`<div class="gz-progress" aria-label="Question progress"><span style="width:${g.round/8*100}%"></span></div><div class="gz-quiz-q">${clean(q[0])}</div><div class="gz-quiz-options">${q[1].map((opt,index)=>`<button type="button" data-v4-answer="${index}">${String.fromCharCode(65+index)}. ${clean(opt)}</button>`).join('')}</div>`);
}
function quizAnswer(n){const r=getRecord('quiz'),g=r.game;if(!g||g.finished||!Number.isInteger(n)||n<0||n>3)return;
 const q=ICT_QUESTIONS[g.questions[g.round]];if(n===q[2])g.correct++;g.round++;
 if(g.round>=g.questions.length){g.finished=true;finished('quiz',g.correct,{win:g.correct>=6})}else save();drawQuiz();
}
function prepareTyping(){const r=getRecord('typing');r.game={text:pick(TYPING_PHRASES),draft:'',remaining:30000,running:false,finished:false};save();drawTyping()}
function drawTyping(){const r=getRecord('typing');if(!r.game)r.game={text:pick(TYPING_PHRASES),draft:'',remaining:30000,running:false,finished:false};
 const g=r.game;
 if(g.running){g.remaining=Math.max(0,(g.deadline||Date.now())-Date.now());g.running=false;save()}
 if(g.finished){stage('Typing Sprint','Speed is measured in words per minute using five characters per word.',score([['Last WPM',g.wpm||0],['Accuracy',(g.accuracy||0)+'%'],['Best WPM',r.best||0]])+`<div class="gz-quiz-q">Session complete! Your result is saved.</div><button class="btn primary" data-v4-type-new>New typing challenge</button>`);return;}
 stage('Typing Sprint','Type the sentence shown. The timer pauses when you leave this game.',score([['Time left',Math.ceil((g.remaining||30000)/1000)+'s'],['Best WPM',r.best||0],['Sessions',r.plays||0]])+`<div class="gz-typing-text" id="gzTypingTarget">${clean(g.text)}</div><label class="sr-only" for="gzTypeInput">Type the sentence</label><input class="gz-typing-input" id="gzTypeInput" type="text" spellcheck="false" autocomplete="off" maxlength="180" placeholder="Type here..." value="${clean(g.draft||'')}" ${!g.running?'disabled':''}><div class="gz-progress" aria-label="Time remaining"><span id="gzTypeProgress" style="width:${(g.remaining||30000)/300}%"></span></div><div class="gz-cta-actions"><button class="btn primary" id="gzTypeStart">${g.draft?'Resume':'Start'} typing</button><button class="btn" id="gzTypeFinish" disabled>Finish early</button><button class="btn" data-v4-type-new>New sentence</button></div>`);
}
function startTyping(){if(active!=='typing')return;const g=getRecord('typing').game;if(!g||g.finished)return;
 if(g.running)return;g.remaining=Math.max(1000,Number(g.remaining)||30000);g.deadline=Date.now()+g.remaining;g.running=true;
 const input=$('#gzTypeInput'),btn=$('#gzTypeStart');if(input){input.disabled=false;input.addEventListener('paste',e=>{e.preventDefault();message('Paste is disabled in Typing Sprint - type the sentence yourself.');});input.focus()}if(btn)btn.disabled=true;
 const finish=$('#gzTypeFinish');if(finish)finish.disabled=false;
 typedTicker=setInterval(()=>{if(active!=='typing')return;g.remaining=Math.max(0,g.deadline-Date.now());const el=$('#arcadeStage .gz-game-score strong');if(el)el.textContent=Math.ceil(g.remaining/1000)+'s';const bar=$('#gzTypeProgress');if(bar)bar.style.width=(g.remaining/300)+'%';if(g.remaining===0)completeTyping();},100);
}
function pauseTyping(){if(active!=='typing')return;const g=getRecord('typing').game;if(g?.running){g.remaining=Math.max(0,g.deadline-Date.now());g.running=false;delete g.deadline;if(typedTicker){clearInterval(typedTicker);typedTicker=null}save()}}
function completeTyping(){if(active!=='typing')return;const r=getRecord('typing'),g=r.game;if(!g||g.finished)return;
 if(g.running)g.remaining=Math.max(0,g.deadline-Date.now());
 const input=$('#gzTypeInput');g.draft=String(input?.value??g.draft??'').slice(0,180);
 if(typedTicker){clearInterval(typedTicker);typedTicker=null}
 const elapsed=Math.max(1000,30000-Math.max(0,g.remaining));let matching=0;
 for(let i=0;i<Math.min(g.draft.length,g.text.length);i++)if(g.draft[i]===g.text[i])matching++;
 const accuracy=g.draft.length?Math.round(100*matching/Math.max(g.draft.length,g.text.length)):0;
 const wpm=Math.round((matching/5)/(elapsed/60000));g.wpm=Math.max(0,Math.min(wpm,250));g.accuracy=accuracy;g.finished=true;g.running=false;delete g.deadline;
 finished('typing',g.wpm,{win:accuracy>=80});drawTyping();
}
function freshSimon(){return {sequence:[],index:0,phase:'ready',level:0}}
function drawSimon(){const r=getRecord('simon');if(!r.game)r.game=freshSimon();const g=r.game;
 if(g.phase==='show'||g.phase==='input')g.phase='ready';
 stage('Pattern Pulse','Watch the sequence of numbered lights. Replay it in the same order.',score([['Level',g.level],['Best level',r.best||0],['Games finished',r.plays||0]])+`<div class="gz-simon-grid">${[0,1,2,3].map(i=>`<button class="gz-simon-btn" data-v4-tone="${i}" data-color="${i}" type="button" aria-label="Colour ${i+1}" disabled>${i+1}</button>`).join('')}</div><div class="gz-cta-actions" style="justify-content:center"><button class="btn primary" id="gzSimonShow">${g.sequence.length?'Replay pattern':'Start game'}</button><button class="btn" id="gzSimonNew">New game</button></div>`);
 message(g.phase==='failed'?'Not quite right. Start a new game to try again.':'Watch the lights, then repeat them.');
}
function pulseSequence(){if(active!=='simon')return;const r=getRecord('simon'),g=r.game;
 if(g.phase==='failed'){r.game=freshSimon();return pulseSequence()}
 if(!g.sequence.length){g.sequence=[Math.floor(Math.random()*4)];g.level=1}
 g.phase='show';g.index=0;save();const buttons=$$('[data-v4-tone]');for(const btn of buttons)btn.disabled=true;message('Watch the pattern...');
 $('#gzSimonShow').disabled=true;
 let i=0;function next(){if(active!=='simon')return;if(i>=g.sequence.length){g.phase='input';g.index=0;save();buttons.forEach(btn=>btn.disabled=false);$('#gzSimonShow').disabled=false;message('Your turn! Repeat '+g.sequence.length+' lights.');return;}
 const btn=buttons[g.sequence[i]];btn.classList.add('active');later(()=>{btn.classList.remove('active');i++;later(next,225)},600)}later(next,350);
}
function simonChoose(n){if(active!=='simon')return;const r=getRecord('simon'),g=r.game;if(!g||g.phase!=='input'||n<0||n>3)return;
 if(g.sequence[g.index]!==n){g.phase='failed';r.plays=(r.plays||0)+1;save();$$('[data-v4-tone]').forEach(b=>b.disabled=true);message('That was not the next light. You reached level '+g.level+'.');return;}
 g.index++;if(g.index===g.sequence.length){r.best=Math.max(r.best||0,g.level);if(g.level===1)once('simon');else save();
 g.level++;g.sequence.push(Math.floor(Math.random()*4));g.index=0;g.phase='ready';$$('[data-v4-tone]').forEach(b=>b.disabled=true);const b=$('#gzSimonShow');if(b)b.textContent='Next level: '+g.level;message('Perfect! Now try a longer sequence.');}
 else{save();message(g.sequence.length-g.index+' light(s) left.');}
}
function freshCode(){const code=shuffle(Array.from({length:10},(_,i)=>String(i))).slice(0,3).join('');return {secret:code,guesses:[],finished:false,won:false}}
function drawCode(){const r=getRecord('code');if(!r.game?.secret)r.game=freshCode();const g=r.game;
 const list=(g.guesses||[]).map((x,i)=>`<div class="gz-guess-row"><code>${clean(x.value)}</code><small>${clean(x.exact)} exact &bull; ${clean(x.misplaced)} misplaced</small></div>`).join('');
 stage('Code Breaker','Find three unique digits. An exact digit is in the right spot; a misplaced digit is in the code but in the wrong spot.',score([['Attempts',(g.guesses||[]).length+'/8'],['Best',r.best?r.best+' tries':'-'],['Wins',r.wins||0]])+
 `<p class="gz-quiz-q" style="text-align:center">${g.finished?(g.won?'Code cracked! '+clean(g.secret):'Game over. The code was '+clean(g.secret)):'???  -  three different digits'}</p>${list||'<p class="hint" style="text-align:center">Example: 428</p>'}<div class="gz-code-controls"><input type="text" id="gzCodeInput" inputmode="numeric" pattern="[0-9]{3}" maxlength="3" aria-label="Three digit guess" placeholder="e.g. 428" ${g.finished?'disabled':''}><button class="btn primary" id="gzCodeCheck" ${g.finished?'disabled':''}>Guess</button></div><button class="btn" id="gzCodeNew">New puzzle</button>`);
}
function submitCode(){if(active!=='code')return;const r=getRecord('code'),g=r.game;if(!g||g.finished)return;
 const input=$('#gzCodeInput'),value=String(input?.value||'').trim();if(!/^\d{3}$/.test(value)||new Set(value).size!==3){message('Enter exactly three different digits, such as 428.');return}
 if(g.guesses.some(x=>x.value===value)){message('You already tried those digits.');return}
 let exact=0,misplaced=0;for(let i=0;i<3;i++){if(value[i]===g.secret[i])exact++;else if(g.secret.includes(value[i]))misplaced++}
 g.guesses.push({value,exact,misplaced});if(exact===3){g.finished=true;g.won=true;finished('code',g.guesses.length,{low:true,win:true})}
 else if(g.guesses.length>=8){g.finished=true;g.won=false;r.plays=(r.plays||0)+1;save()}
 else save();drawCode();
 if(!g.finished)message(exact+' exact, '+misplaced+' misplaced. Keep trying.');
}
function gameListener(event){const b=event.target.closest('[data-v4game],[data-v4back],[data-v4-answer],[data-v4-quiz-restart],[data-v4-type-new],[data-v4-tone],[data-v4-stage],[data-v4-install],[data-v4-presentation],[data-v4-close-presentation],[data-v4-share],[data-v4-print],[data-v4-backup],[data-v4-help]');
 if(!b)return;
 if(b.hasAttribute('data-v4game')){event.preventDefault();openGame(b.dataset.v4game);return}
 if(b.hasAttribute('data-v4back')){event.preventDefault();stop();$('#arcadeStage').innerHTML='<div class="empty">Choose a Zyvoqix game above to start playing.</div>';$('#gzNewGames')?.scrollIntoView({block:'start'});return}
 if(b.hasAttribute('data-v4-answer')){quizAnswer(Number(b.dataset.v4Answer));return}
 if(b.hasAttribute('data-v4-quiz-restart')){startQuiz();return}
 if(b.hasAttribute('data-v4-type-new')){if(active==='typing'){pauseTyping();getRecord('typing').game=null;prepareTyping()}return}
 if(b.hasAttribute('data-v4-tone')){simonChoose(Number(b.dataset.v4Tone));return}
 if(b.hasAttribute('data-v4-presentation')){showPresentation(true);return}
 if(b.hasAttribute('data-v4-close-presentation')){showPresentation(false);return}
 if(b.hasAttribute('data-v4-install')){install();return}
 if(b.hasAttribute('data-v4-share')){share();return}
 if(b.hasAttribute('data-v4-print')){window.print();return}
 if(b.hasAttribute('data-v4-backup')){go('community');setTimeout(()=>$('#backupPanelGz')?.scrollIntoView({behavior:'smooth',block:'center'}),150);return}
 if(b.hasAttribute('data-v4-help')){go('help');return}
}
function noMoreGames(){if(active==='typing')pauseTyping();stop()}
function readProfiles(){let saved=[];try{saved=JSON.parse(localStorage.getItem('gz_local_players')||'[]')}catch{}
 if(!Array.isArray(saved))saved=[];
 const names=new Map();for(const name of saved){if(typeof name!=='string'||!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(name))continue;
 try{const data=JSON.parse(localStorage.getItem('gz_local_gamer_'+name.toLowerCase())||'null');if(data&&typeof data==='object')names.set(name.toLowerCase(),{name, xp:Math.max(0,Math.min(20000,Number(data.xp)||0)),math:Math.max(0,Math.min(10,Number(data.arcade?.math?.best)||0)),arcade:data.arcade||{}})}catch{}}
 const name=String(state.profile?.name||'').trim();if(name&&/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(name))names.set(name.toLowerCase(),{name,xp:Math.max(0,Number(state.xp)||0),math:Math.max(0,Number(state.arcade?.math?.best)||0),arcade:state.arcade||{}});
 return Array.from(names.values()).sort((a,b)=>b.xp-a.xp||b.math-a.math||a.name.localeCompare(b.name)).slice(0,15);
}
function renderLocalLeaderboard(){const people=readProfiles();const el=$('#gzLocalLeaderboard');if(!el)return;
 el.innerHTML=people.length?people.map((p,i)=>`<div class="gz-rank"><span class="position">#${i+1}</span><div class="info"><strong>${clean(p.name)}</strong><small>Math ${clean(p.math)}/10 - Played on this browser</small></div><span class="score">${clean(p.xp)} XP</span></div>`).join(''):'<div class="empty">No profiles saved yet. Create a local gamer tag in Community to see your own leaderboard.</div>';
}
async function share(){try{if(navigator.share){await navigator.share({title:'Zyvoqix - Play. Rank. Rise.',url:homepage});return}if(navigator.clipboard){await navigator.clipboard.writeText(homepage);toast('Clean Zyvoqix link copied.');return}}
 catch(err){if(err.name==='AbortError')return}
 const input=document.createElement('textarea');input.value=homepage;document.body.appendChild(input);input.select();try{document.execCommand('copy');toast('Clean Zyvoqix link copied.')}catch{window.prompt('Copy this address:',homepage)}input.remove();
}
function showPresentation(open){const modal=$('#gzClassroom');if(!modal)return;modal.classList.toggle('open',open);modal.setAttribute('aria-hidden',String(!open));document.body.style.overflow=open?'hidden':'';if(open)$('[data-v4-close-presentation]',modal)?.focus()}
async function install(){if(stagedPrompt){stagedPrompt.prompt();const choice=await stagedPrompt.userChoice;stagedPrompt=null;if(choice?.outcome==='accepted')toast('Thank you for installing Zyvoqix.');return}
 toast('Install from your browser menu: Add to Home Screen / Install app.');}
function updateCounters(){const el=$('#statGames');if(el){el.textContent='28';const span=el.parentElement?.querySelector('span');if(span)span.textContent='16 arcade + 12 official links'}
 const label=$('#page-arcade .page-intro');if(label)label.textContent='16 playable browser games. Scores are stored for each local nickname, and unfinished puzzle progress is preserved on this device. Cloud account sync activates after storage is connected.';
 const hero=$('#page-home .hero-trustbar');if(hero){const first=hero.querySelector('span');if(first)first.textContent='16 free playable games'}
 const str=$('#premiumGameSection .section-head [data-page="arcade"]');if(str)str.textContent='Play all 16';
}
function addMeta(name,content,property=false){if($(property?`meta[property="${name}"]`:`meta[name="${name}"]`))return;const el=document.createElement('meta');el.setAttribute(property?'property':'name',name);el.content=content;document.head.appendChild(el)}
function init(){if(!$('#nav')||!$('#page-home')||!$('#playGrid'))return;
 const skip=document.createElement('a');skip.href='#mainContent';skip.className='skip-to-content';skip.textContent='Skip to content';document.body.prepend(skip);
 $('main')?.setAttribute('id','mainContent');$('main')?.setAttribute('tabindex','-1');
 const nav=$('#nav');for(const page of [{id:'about',label:'About'},{id:'help',label:'Help'}]){if(!nav.querySelector(`[data-page="${page.id}"]`)){const btn=document.createElement('button');btn.type='button';btn.dataset.page=page.id;btn.textContent=page.label;nav.appendChild(btn)}}
 nav?.setAttribute('aria-label','Zyvoqix sections');
 const navRight=$('.navright');if(navRight&&!$('#gzShareTop')){const button=document.createElement('button');button.type='button';button.id='gzShareTop';button.className='btn small gz-top-share';button.dataset.v4Share='';button.textContent='Share site';navRight.prepend(button)}
 const intro=document.createElement('div');intro.className='gz-pro-intro';intro.innerHTML=`<div><strong>Build skills. Beat scores. Show what you can do.</strong><p>16 original browser challenges, player profiles, real local records and an ICT project showcase.</p></div><button class="btn primary" type="button" data-page="about">Explore the ICT project &rarr;</button>`;
 const home=$('#page-home');const firstSection=$('#premiumGameSection');if(firstSection)home.insertBefore(intro,firstSection);
 const arcade=$('#extraArcadeSection');if(arcade){const section=document.createElement('section');section.id='gzNewGames';section.className='gz-section';section.innerHTML=`<div class="section-head"><div><div class="kicker">Learn while you play</div><h2>Skill Lab - 4 new challenges</h2></div><span class="new-game-tag">NEW IN VERSION 4</span></div><p class="gz-description">Test your ICT knowledge, keyboard skills, memory and reasoning. These run directly inside Zyvoqix and keep personal records on this device.</p><div class="gz-v4-grid" id="gzV4Grid">${GAME_META.map(card).join('')}</div>`;arcade.after(section);}
 const homeArcade=$('#premiumGameSection');if(homeArcade){const section=document.createElement('section');section.id='gzHomeSkills';section.className='gz-section';section.innerHTML=`<div class="section-head"><div><div class="kicker">Special ICT edition</div><h2>Play. Learn. Improve.</h2></div><button class="btn small" type="button" data-page="arcade">All 16 games &rarr;</button></div><div class="gz-v4-grid">${GAME_META.map(card).join('')}</div>`;homeArcade.after(section)}
 const about=document.createElement('section');about.className='page';about.id='page-about';about.innerHTML=`
 <div class="kicker">ICT school project - interactive showcase</div><h1 class="page-title">Meet Zyvoqix<span style="color:var(--green)">.</span></h1>
 <p class="page-intro">Zyvoqix is an independent, educational gaming website. It combines real playable browser mini-games with game discovery, personal progress, scores, achievements and thoughtful online-safety information.</p>
 <div class="gz-presentation-cta"><div><span class="gz-feature-badge">READY TO PRESENT</span><h2 style="margin:7px 0 0">Zyvoqix: Play. Rank. Rise.</h2><p>Give your teacher a polished tour of the features you built with web technology.</p></div><div class="gz-cta-actions"><button class="btn primary" data-v4-presentation>Presentation mode</button><button class="btn" data-v4-print>Print project overview</button></div></div>
 <div class="gz-section"><h2>What can visitors do?</h2><div class="gz-cards">
 <article class="gz-card"><div class="gz-icon">01</div><h3>Play real games</h3><p>16 interactive arcade challenges run immediately in the browser, no download required.</p></article>
 <article class="gz-card"><div class="gz-icon">02</div><h3>Save your progress</h3><p>Nicknames, earned XP, achievements, puzzles and personal records are saved locally, per gamer.</p></article>
 <article class="gz-card"><div class="gz-icon">03</div><h3>Discover favourites</h3><p>Read about 12 popular games, rate and favourite them, then visit official publisher websites.</p></article>
 <article class="gz-card"><div class="gz-icon">04</div><h3>See real rankings</h3><p>Compare actual records saved on this device. Online rankings require cloud storage.</p></article>
 <article class="gz-card"><div class="gz-icon">05</div><h3>Be creative</h3><p>Build and save tier lists, complete missions and earn reward badges in your profile.</p></article>
 <article class="gz-card"><div class="gz-icon">06</div><h3>Learn online safety</h3><p>Friendly, age-appropriate guidance keeps the school project transparent and responsible.</p></article>
 </div></div>
 <div class="gz-section"><h2>How the website works</h2><p class="gz-description">Built using widely taught ICT and web development principles.</p><div class="gz-steps">
 <div class="gz-step"><h3>HTML - structure</h3><p>Creates headings, buttons, game cards and forms.</p></div>
 <div class="gz-step"><h3>CSS - design</h3><p>Makes a responsive, colourful layout for desktop and mobile.</p></div>
 <div class="gz-step"><h3>JavaScript - logic</h3><p>Controls games, scores, missions, interactions and browser storage.</p></div>
 </div></div>
 <div class="gz-section"><h2>Try the project</h2><div class="gz-cta-actions"><button class="btn primary" data-v4game="quiz">Try the ICT quiz</button><button class="btn" data-v4game="code">Play Code Breaker</button><button class="btn" data-page="community">Set up a player</button><button class="btn" data-v4-share>Share this site</button></div></div>`;
 $('#page-community').after(about);
 const help=document.createElement('section');help.className='page';help.id='page-help';help.innerHTML=`<div class="kicker">Support, fairness and privacy</div><h1 class="page-title">Help & Safety<span style="color:var(--green)">.</span></h1><p class="page-intro">Everything visitors should know about playing, saving and sharing responsibly.</p>
 <div class="gz-section"><h2>Frequently asked questions</h2>
 <details class="gz-faq"><summary>Can I play games directly on Zyvoqix?</summary><p>Yes. The 16 games in Zyvoqix Arcade are original browser mini-games that run here. The 12 popular games in the discovery library are external titles, linked to official websites, and may need their own app, account or purchase.</p></details>
 <details class="gz-faq"><summary>Are scores saved when I close the website?</summary><p>Yes. Zyvoqix stores your current scores and many unfinished puzzles in this browser. Save a separate gamer nickname on the Community page. Clearing browser/site data can erase these local saves, so export a backup.</p></details>
 <details class="gz-faq"><summary>Can I use another phone or computer?</summary><p>Not automatically yet. Until cloud storage is connected, use Export Backup on the Community page and Import Backup on the next device. The account controls are clearly labelled when cloud service is offline.</p></details>
 <details class="gz-faq"><summary>How do player rankings and ratings work?</summary><p>The local leaderboard uses real profiles saved on this device. Game ratings are personal votes, not official publisher reviews. Global rankings and pooled ratings will only appear when a real shared database is active.</p></details>
 <details class="gz-faq"><summary>How is my information handled?</summary><p>Local nicknames, records, favourite games and posts are stored in your browser. No payment details or email are requested. If a cloud service is activated later, signing up will be optional and will involve a gamer tag and password.</p></details>
 <details class="gz-faq"><summary>How do I play on a phone?</summary><p>All original mini-games have touch controls. Snake and 2048 also provide directional buttons. For a quick shortcut, use your browser menu and choose Add to Home Screen.</p></details>
 <details class="gz-faq"><summary>What should younger players remember?</summary><p>Use a nickname instead of a real name, never post phone numbers, school or address details, ask a trusted adult before following unfamiliar links and always treat other players kindly.</p></details>
 </div><div class="gz-section"><h2>Helpful tools</h2><div class="gz-cta-actions"><button class="btn primary" data-v4-backup>Back up my progress</button><button class="btn" data-v4-install>Install / Add to Home Screen</button><button class="btn" data-v4-share>Share Zyvoqix</button></div><p class="gz-accessibility-note">Zyvoqix is a fan-made educational project, not affiliated with the official game publishers. The website is designed for desktop and touch devices.</p></div>`;
 about.after(help);
 const footer=$('.footin');if(footer){const actions=document.createElement('div');actions.className='gz-footer-actions';actions.innerHTML='<button type="button" data-page="about">About</button><button type="button" data-page="help">Help & Privacy</button><button type="button" data-v4-share>Share link</button>';footer.appendChild(actions)}
 const leader=$('#page-rankings');if(leader){const section=document.createElement('div');section.className='gz-section';section.innerHTML=`<div class="section-head"><div><div class="kicker">Real players, no fictional records</div><h2>Local Hall of Fame</h2></div><span class="gz-feature-badge">THIS DEVICE ONLY</span></div><p class="gz-description">Compare the actual nicknames and XP saved in this browser. This is not a worldwide leaderboard; cloud rankings appear only after storage is enabled.</p><div class="gz-local-list" id="gzLocalLeaderboard"></div>`;leader.insertBefore(section,leader.querySelector('.two'))}
 const modal=document.createElement('div');modal.id='gzClassroom';modal.className='gz-classroom';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-hidden','true');modal.setAttribute('aria-label','Zyvoqix classroom presentation');modal.innerHTML=`<div class="stage"><header><img class="gz-classroom-logo" alt="Zyvoqix" src="${$('.brand-image')?.src||''}"><button class="btn" data-v4-close-presentation>Close / Escape</button></header><span class="gz-feature-badge">INTERACTIVE ICT SCHOOL PROJECT</span><h1>PLAY MORE.<br><span class="grad">LEARN MORE.</span></h1><p class="big">Zyvoqix is a responsive gaming hub designed with HTML, CSS and JavaScript. It features 16 interactive arcade games, 12 official game links, profiles, XP, personal records, achievements and a student-friendly ICT challenge.</p><div class="gz-cards"><div class="gz-card"><div class="gz-icon">16</div><h3>Playable games</h3><p>Tap and play instantly.</p></div><div class="gz-card"><div class="gz-icon">12</div><h3>Game discoveries</h3><p>Official external sites.</p></div><div class="gz-card"><div class="gz-icon">100%</div><h3>Responsive</h3><p>Works on desktop and mobile.</p></div></div><p>Live demo: show a game, earn a score and refresh to see it saved.</p><div class="gz-cta-actions"><button class="btn primary" data-v4-close-presentation data-v4-open-quiz>Show the ICT Quiz</button><button class="btn" data-v4-print>Print overview</button></div></div>`;document.body.appendChild(modal);
 for(const meta of GAME_META)getRecord(meta.id);
 updateCounters();updateScores();renderLocalLeaderboard();
 const xp=$('#xpMini');if(xp)new MutationObserver(()=>{renderLocalLeaderboard();updateScores()}).observe(xp,{childList:true,characterData:true,subtree:true});
 if(!$('#backupPanelGz')){const backup=$('#exportProgress')?.closest('.panel');if(backup)backup.id='backupPanelGz'}
 document.addEventListener('click',gameListener);
 document.addEventListener('click',event=>{if(event.target.closest('[data-v4-open-quiz]')){showPresentation(false);openGame('quiz');return}if(event.target.closest('[data-page],[data-play],[data-extra]')&&!event.target.closest('[data-v4game]')){if(active)noMoreGames();}},true);
 document.addEventListener('click',event=>{if(event.target.id==='gzTypeStart')startTyping();if(event.target.id==='gzTypeFinish')completeTyping();if(event.target.id==='gzSimonShow')pulseSequence();if(event.target.id==='gzSimonNew'){getRecord('simon').game=freshSimon();save();drawSimon()}if(event.target.id==='gzCodeCheck')submitCode();if(event.target.id==='gzCodeNew'){getRecord('code').game=freshCode();save();drawCode()}},false);
 document.addEventListener('input',event=>{if(event.target.id==='gzTypeInput'){const g=getRecord('typing').game;if(g){g.draft=String(event.target.value).slice(0,180);save();if(g.draft===g.text)completeTyping()}}});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#gzClassroom')?.classList.contains('open'))showPresentation(false);if(event.key==='Enter'&&event.target.id==='gzCodeInput')submitCode()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseTyping()});
 window.addEventListener('pagehide',()=>{pauseTyping();stop()});
 window.addEventListener('storage',()=>renderLocalLeaderboard());
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();stagedPrompt=event});
 if('serviceWorker' in navigator && location.protocol==='https:'){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{}))}
 if(['about','help','arcade','games','rankings','missions','tiers','community'].includes(location.hash.slice(1))){go(location.hash.slice(1))}
 window.GameZonePro={version:'4.0',games:GAME_META.map(x=>x.id),totalArcade:16,open:openGame,refreshScores:updateScores,localProfiles:readProfiles};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
