import {initialState,runCommand,HOME,shortPath,children,commandNames,resolvePath} from './shell.js';
import {lessons} from './lessons.js';
import {createAccounts} from './accounts.js';
const $=s=>document.querySelector(s);
const STORAGE='linux-mastery-v1';
function readGuestProgress() {
  try {const value=JSON.parse(localStorage.getItem(STORAGE));if(value&&Array.isArray(value.completed)&&value.sessions&&typeof value.sessions==='object')return {completed:[...new Set(value.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<lessons.length))],sessions:value.sessions};}catch{}
  return {completed:[],sessions:{}};
}
let saved=readGuestProgress();
let active=-2,session=null,historyIndex=0,draft='',toastTimer;
const xp=()=>saved.completed.reduce((sum,i)=>sum+lessons[i].xp,0);
const nextLesson=()=>lessons.findIndex((_,i)=>!saved.completed.includes(i));
function persist(){if(accounts.isSignedIn()){accounts.save();return;}try{localStorage.setItem(STORAGE,JSON.stringify(saved));}catch{toast('Browser storage is unavailable. Progress will last for this visit.');}}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
function renderProgress(){
  const count=saved.completed.length;$('#header-xp').textContent=xp()+' XP';$('#total-xp').textContent=xp();$('#completed-count').innerHTML=count+'<span>/10</span>';$('#progress-percent').textContent=count*10+'%';$('#progress-fill').style.width=count*10+'%';$('#chapter-count').textContent=count+' / 10 complete';
  $('#rank-title').textContent=count===10?'At home in the terminal':count>=5?'Curious explorer':'Terminal newcomer';
  $('#rank-description').textContent=count===10?'A whole new world is waiting at your prompt.':count>=5?'Look how far a little curiosity has taken you.':'Every expert started with a first command.';
  $('#continue-button').innerHTML=(count===10?'Play again':count?'Continue playing':'Start playing')+' <span>↗</span>';
  const groups=[
    {title:'Find your way',description:'Get your bearings. Learn to look around and move with confidence.',ids:[0,1,2],symbol:'⌖'},
    {title:'Make it yours',description:'Create folders, make files, and leave your first message.',ids:[3,4,5],symbol:'⊞'},
    {title:'Work with files',description:'Read, copy, rename, and clear a little space.',ids:[6,7,8,9],symbol:'⧉'}
  ];
  const next=nextLesson();$('#hud-level').textContent=next===-1?'✓':String(next+1).padStart(2,'0');
  const map=$('#mission-map');map.replaceChildren();
  groups.forEach((group,stage)=>{
    const complete=group.ids.filter(i=>saved.completed.includes(i)).length;
    const current=group.ids.includes(next);
    const row=document.createElement('section');row.className='stage-row'+(current?' current-stage':'')+(complete===group.ids.length?' stage-cleared':'');
    const marker=document.createElement('span');marker.className='stage-marker';marker.setAttribute('aria-hidden','true');marker.textContent=complete===group.ids.length?'✓':group.symbol;
    const summary=document.createElement('div');summary.className='stage-summary';
    const meta=document.createElement('div');meta.className='stage-meta';const ordinal=document.createElement('span');ordinal.textContent=String(stage+1).padStart(2,'0');meta.append(ordinal);if(current){const tag=document.createElement('span');tag.className='you-are-here';tag.textContent='YOU ARE HERE';meta.append(tag);}const count=document.createElement('span');count.textContent=complete+' / '+group.ids.length;meta.append(count);
    const heading=document.createElement('h3');heading.textContent=group.title;const description=document.createElement('p');description.textContent=group.description;const progress=document.createElement('div');progress.className='stage-progress';progress.setAttribute('role','progressbar');progress.setAttribute('aria-label',group.title+' completion');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax',String(group.ids.length));progress.setAttribute('aria-valuenow',String(complete));const fill=document.createElement('span');fill.style.width=(complete/group.ids.length*100)+'%';progress.append(fill);summary.append(meta,heading,description,progress);
    const levels=document.createElement('div');levels.className='stage-levels';
    group.ids.forEach(i=>{const done=saved.completed.includes(i);const button=document.createElement('button');button.className='mission-tile'+(done?' done':i===next?' current':'');button.textContent=String(i+1);button.setAttribute('aria-label',`Mission ${i+1}: ${lessons[i].title}${done?', completed':i===next?', up next':''}`);if(i===next)button.setAttribute('aria-current','step');button.title=lessons[i].title+' · '+lessons[i].xp+' XP';button.onclick=()=>navigate(i);if(done){const badge=document.createElement('span');badge.className='node-check';badge.setAttribute('aria-hidden','true');badge.textContent='✓';button.append(badge);}levels.append(button);});
    row.append(marker,summary,levels);map.append(row);
  });
}
function newSession(i){return {shell:initialState(i),history:[],logs:[{text:i===-1?'Welcome to your playground.\nTry help for commands, or make a little mess.\nReset whenever you want a fresh start.':'A fresh workspace, just for this mission.\nType help if you get curious.',type:'info'}],hints:0,count:0,cleared:false};}
function validSession(value){return value&&value.shell?.fs&&typeof value.shell.cwd==='string'&&value.shell.fs[value.shell.cwd]?.type==='dir'&&Array.isArray(value.logs)&&Array.isArray(value.history)&&Number.isInteger(value.count);}
function navigate(i){const hash=i===-2?'#':i===-1?'#playground':'#mission-'+(i+1);if(location.hash===hash||(!location.hash&&i===-2))open(i);else location.hash=hash;}
function renderSteps() {
  const steps=$('#lesson-steps');steps.replaceChildren();steps.hidden=active<0;
  lessons.forEach((lesson,i)=>{const step=document.createElement('button');step.className='step-dot'+(saved.completed.includes(i)?' done':'')+(i===active?' active':'');step.setAttribute('aria-label',`Mission ${i+1}: ${lesson.title}`);if(i===active)step.setAttribute('aria-current','step');step.title=lesson.title;step.onclick=()=>navigate(i);steps.append(step);});
}
function celebrate() {
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const burst=document.createElement('div');burst.className='celebration';burst.setAttribute('aria-hidden','true');
  const colors=['#ff9565','#d2f78b','#a989e8','#9ae1e6','#ffd477'];
  for(let i=0;i<28;i++){const piece=document.createElement('i');piece.style.setProperty('--x',(i*3.6)+'%');piece.style.setProperty('--delay',(i%7)*45+'ms');piece.style.setProperty('--confetti-color',colors[i%colors.length]);burst.append(piece);}
  document.body.append(burst);setTimeout(()=>burst.remove(),1800);
}
function open(i){
  document.querySelectorAll('.celebration').forEach(burst=>burst.remove());
  active=i;$('#home').hidden=i!==-2;$('#workspace').hidden=i===-2;document.body.classList.toggle('lesson-open',i!==-2);document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',i===-1?b.dataset.action==='playground':b.dataset.action==='learn'));renderProgress();
  if(i===-2){window.scrollTo(0,0);return;}
  renderSteps();
  session=saved.sessions[String(i)];if(!validSession(session)){session=newSession(i);saved.sessions[String(i)]=session;}historyIndex=session.history.length;draft='';$('#command-input').value='';
  const l=lessons[i];
  const scenario=l?.scenario;
  $('#mission-context').hidden=!scenario;
  if(scenario){
    $('#story-number').textContent=String(i+1).padStart(2,'0')+' / 10';
    $('#story-title').textContent=scenario.title;
    $('#lesson-story').textContent=scenario.story;
    $('#scenario-setting').textContent=scenario.setting;
    $('#scenario-use').textContent=scenario.useCase;
  }
  $('#workspace-mode').textContent=l?'MISSION '+String(i+1).padStart(2,'0')+' / 10':'FREE EXPLORATION';$('#lesson-category').textContent=l?'CHAPTER 01 · FIND YOUR FEET':'NO OBJECTIVES. ALL POSSIBILITY.';$('#lesson-title').textContent=l?.title||'Go where curiosity takes you.';$('#lesson-description').textContent=l?.description||'Your own little Linux neighborhood. Create something, read something, move things around. This space is yours.';$('#lesson-objective').textContent=l?.objective||'Explore at your own pace. Type help to see what’s possible, or open the field guide for a few ideas.';$('#lesson-concept').innerHTML=l?.concept||'<code>ls</code> is a good place to start. Try <code>cd Documents</code>, then <code>cat welcome.txt</code>. Your commands change the filesystem beside you.';$('#hint-area').hidden=!l;$('#lesson-xp').textContent=(l?.xp||0)+' XP';$('.lesson-reward').hidden=!l;
  renderHint();renderLogs();renderShell();renderCompletion();persist();window.scrollTo(0,0);
}
function renderLogs(){const output=$('#terminal-output');output.replaceChildren();for(const log of session.logs){const line=document.createElement('div');line.className='terminal-line '+log.type;if(log.type==='command'){const path=document.createElement('span');path.className='command-path';path.textContent=log.path;const prompt=document.createElement('span');prompt.className='command-prompt';prompt.textContent='❯';line.append(path,prompt,document.createTextNode(log.text));}else line.textContent=log.text;output.append(line);}output.scrollTop=output.scrollHeight;}
function renderShell(){const {cwd,fs}=session.shell;$('#terminal-path').textContent=shortPath(cwd);$('#input-path').textContent=shortPath(cwd);$('#command-count').textContent=session.count+' command'+(session.count===1?'':'s')+' explored';const tree=$('#file-tree');tree.replaceChildren();const root=document.createElement('div');root.className='tree-root';root.textContent='/home';tree.append(root);
  function renderNode(path,depth){const node=fs[path];if(!node)return;const row=document.createElement('button');row.className='tree-row '+(node.type==='file'?'file':'directory')+(path===cwd?' current':'');row.style.paddingLeft=(7+depth*12)+'px';row.title=path;const icon=document.createElement('span');icon.className='tree-icon';icon.textContent=node.type==='dir'?'▱':'·';const name=document.createElement('span');name.textContent=path.split('/').pop()+(node.type==='dir'?'/':'');row.append(icon,name);row.onclick=()=>inspectFile(path);row.setAttribute('aria-label','Inspect '+path);tree.append(row);if(node.type==='dir')for(const child of children(fs,path))renderNode(child,depth+1);}
  renderNode(HOME,0);$('#file-detail').replaceChildren();const label=document.createElement('span');label.textContent='LIVE VIEW';const note=document.createElement('p');note.textContent='Click a file to peek inside. Highlight shows your working directory.';$('#file-detail').append(label,note);
}
function inspectFile(path){const node=session.shell.fs[path];const detail=$('#file-detail');detail.replaceChildren();const label=document.createElement('span');label.textContent=node.type==='dir'?'DIRECTORY':'FILE';const title=document.createElement('p');title.textContent=shortPath(path);const mode=document.createElement('p');mode.textContent='Permissions: '+node.mode;detail.append(label,title,mode);const content=document.createElement('pre');content.textContent=node.type==='dir'?children(session.shell.fs,path).length+' items':node.content||'(empty file)';detail.append(content);}
function renderHint(){const l=lessons[active];if(!l)return;$('#hint-text').hidden=!session.hints;$('#hint-text').textContent=l.hints[Math.max(0,session.hints-1)];$('#hint-button').textContent=session.hints===0?'✳ A little nudge':session.hints===1?'✳ Show an example':'✳ Example shown';$('#hint-button').disabled=session.hints>=l.hints.length;}
function renderCompletion(){const lesson=lessons[active];$('#completion').hidden=!lesson||!session.cleared;if(!lesson)return;$('#completion-copy').textContent=lesson.success;$('#next-button').innerHTML=(active===9?'Back to your path':'Next mission')+' <span>→</span>';}
$('#hint-button').onclick=()=>{if(!session)return;session.hints=Math.min(2,session.hints+1);renderHint();persist();};
$('#reset-button').onclick=()=>{if(active===-2)return;saved.sessions[String(active)]=newSession(active);open(active);toast('Fresh workspace. Your earned XP is safe.');$('#command-input').focus();};
$('#next-button').onclick=()=>navigate(active===9?-2:active+1);
$('#terminal-form').addEventListener('submit',event=>{event.preventDefault();const input=$('#command-input');const command=input.value.trim();if(!command)return;const before=shortPath(session.shell.cwd);const result=runCommand(session.shell,command);session.history.push(command);session.history=session.history.slice(-100);historyIndex=session.history.length;draft='';session.count++;session.shell=result.state;if(result.clear){session.logs=[];}else{session.logs.push({type:'command',path:before,text:command});if(result.output)session.logs.push({type:result.ok?'result':'error',text:result.output.replace(/\n$/,'')});}
  const lesson=lessons[active];if(result.ok&&lesson&&!session.cleared&&lesson.check(result.state,result.event)){session.cleared=true;const already=saved.completed.includes(active);if(!already)saved.completed.push(active);session.logs.push({type:'success',text:already?'✓ Mission cleared again. Nicely done.':'✓ Mission cleared! +'+lesson.xp+' XP\n'+lesson.success});renderProgress();renderSteps();renderCompletion();celebrate();}
  session.logs=session.logs.slice(-180);input.value='';renderLogs();renderShell();persist();input.focus();
});
$('#command-input').addEventListener('keydown',event=>{
  const input=event.currentTarget;if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();if(historyIndex===session.history.length)draft=input.value;if(event.key==='ArrowUp')historyIndex=Math.max(0,historyIndex-1);else historyIndex=Math.min(session.history.length,historyIndex+1);input.value=historyIndex===session.history.length?draft:session.history[historyIndex]||'';input.setSelectionRange(input.value.length,input.value.length);}
  if(event.key==='l'&&event.ctrlKey){event.preventDefault();session.logs=[];renderLogs();persist();}
  if(event.key==='c'&&event.ctrlKey&&!window.getSelection()?.toString()){event.preventDefault();input.value='';}
  if(event.key==='Tab'){
    if(event.shiftKey)return;const text=input.value;if(!text||input.selectionStart!==text.length||/["']/.test(text))return;
    const word=text.split(/\s+/).pop();const prefix=text.slice(0,text.length-word.length);let choices;
    if(!prefix)choices=commandNames.filter(c=>c.startsWith(word));else {const slash=word.lastIndexOf('/');const parent=slash===-1?'.':word.slice(0,slash+1);const base=word.slice(slash+1);choices=children(session.shell.fs,resolvePath(parent,session.shell.cwd)).map(p=>({name:p.split('/').pop(),dir:session.shell.fs[p].type==='dir'})).filter(n=>n.name.startsWith(base)&&!n.name.includes(' ')).map(n=>(slash===-1?'':word.slice(0,slash+1))+n.name+(n.dir?'/':''));}
    if(choices.length){event.preventDefault();if(choices.length===1)input.value=prefix+choices[0]+(choices[0].endsWith('/')?'':' ');else{session.logs.push({type:'info',text:choices.join('  ')});renderLogs();}}
  }
});
document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{const action=button.dataset.action;if(action==='learn')navigate(-2);else if(action==='continue'){const next=nextLesson();navigate(next===-1?0:next);}else if(action==='playground')navigate(-1);else if(action==='reference')$('#guide-dialog').showModal();}));
$('.site-header .brand').addEventListener('click',event=>{event.preventDefault();navigate(-2);});$('.footer-brand').addEventListener('click',event=>{event.preventDefault();navigate(-2);});
$('#close-guide').onclick=()=>$('#guide-dialog').close();$('#guide-dialog').addEventListener('click',event=>{if(event.target===$('#guide-dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close();}});
const guide=[['Get your bearings',[['pwd','Print the working directory'],['ls [-a] [-l] [path]','List files; -a includes hidden files, -l shows details'],['cd [path]','Change directory; cd .. goes up, cd ~ goes home'],['whoami','Print your current username']]],['Make yourself at home',[['mkdir [-p] path','Create a directory; -p creates missing parents'],['touch file','Create an empty file'],['cp source target','Copy a file'],['mv source target','Move or rename a file or directory'],['rm file','Remove a file'],['rmdir directory','Remove an empty directory']]],['Read, write, and explore',[['echo "text"','Print a message; -n omits the final newline'],['echo "text" > file','Write a message to a file, replacing its contents'],['echo "text" >> file','Append a message to a file'],['cat file','Print file contents'],['head [-n 5] file','Read the first lines of a file'],['tail [-n 5] file','Read the last lines of a file'],['grep [-i] pattern file','Find matching lines; -i ignores letter case'],['wc [-l] file','Count lines, words, bytes; -l shows only lines'],['find . -name "*.txt"','Find paths by name; * matches any characters'],['chmod 755 file','Change permissions; +x adds execute permission'],['clear','Clear terminal output'],['help','Show available commands']]]];
for(const [title,rows] of guide){const group=document.createElement('section');group.className='guide-group';const heading=document.createElement('h3');heading.textContent=title;group.append(heading);for(const [cmd,meaning] of rows){const row=document.createElement('div');row.className='guide-row';const code=document.createElement('code');code.textContent=cmd;const description=document.createElement('span');description.textContent=meaning;row.append(code,description);group.append(row);}$('#guide-content').append(group);}
function route(){const match=location.hash.match(/^#mission-(\d+)$/);if(match&&Number(match[1])>=1&&Number(match[1])<=10)open(Number(match[1])-1);else if(location.hash==='#playground')open(-1);else open(-2);}
const accounts=createAccounts({
  getProgress:()=>saved,
  getGuestProgress:readGuestProgress,
  applyProgress:progress=>{saved=progress;open(active);},
  restoreGuest:()=>{saved=readGuestProgress();open(active);},
  notify:toast,
});
window.addEventListener('hashchange',route);
accounts.init().then(route);
