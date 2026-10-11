const intro = document.querySelector('.intro');
const world = document.querySelector('.world');
const welcome = document.querySelector('.welcome');
const enter = document.querySelector('#enter');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const translations = {
  en: {
    language:'Language', universe:'A PERSONAL UNIVERSE', skip:'Skip intro', dream:'SOMEWHERE BETWEEN DREAM & REALITY',
    welcome:'Welcome to my world', welcomeSub:'A little wonder awaits.', enter:'Enter my world', click:'CLICK ANYWHERE TO BEGIN',
    prologue:'THE PROLOGUE', replay:'Replay intro', wonder:'EVERY WORLD BEGINS WITH A LITTLE WONDER.', back:'Back to the prologue',
    chapter:'CHAPTER ONE · THE BEGINNING', worldTitle:'A world,', worldTitleSub:'beginning here.',
    worldBody:'You\'ve stepped into WILLIAM’s world.', worldBodySub:'The next story is slowly taking shape.', continued:'TO BE CONTINUED',
    palette:'Color palette', sage:'Original · sage and yellow', ember:'Ember · orange and red', introLabel:'WILLIAM opening animation', worldLabel:'My world'
  },
  zh: {
    language:'语言', universe:'一个属于我的世界', skip:'跳过序幕', dream:'在梦境与现实之间',
    welcome:'欢迎光临我的世界', welcomeSub:'很高兴，在这里遇见你。', enter:'走进我的世界', click:'点击任意位置，开启故事',
    prologue:'序幕', replay:'重播序幕', wonder:'每一个世界，都始于一点好奇。', back:'返回序幕',
    chapter:'第一章 · 开始', worldTitle:'世界，', worldTitleSub:'从这里开始。',
    worldBody:'你已经走进 WILLIAM 的世界。', worldBodySub:'下一段故事，正在慢慢生长。', continued:'未完待续',
    palette:'配色方案', sage:'初始配色 · 青黄', ember:'实验配色 · 橙红', introLabel:'WILLIAM 开场动画', worldLabel:'我的世界'
  },
  ja: {
    language:'言語', universe:'私だけの世界', skip:'イントロをスキップ', dream:'夢と現実のあいだに',
    welcome:'私の世界へようこそ', welcomeSub:'ここで出会えて、うれしいです。', enter:'私の世界へ', click:'クリックして、物語をはじめる',
    prologue:'プロローグ', replay:'もう一度見る', wonder:'すべての世界は、小さな好奇心から。', back:'プロローグへ戻る',
    chapter:'第一章 · はじまり', worldTitle:'世界は、', worldTitleSub:'ここから始まる。',
    worldBody:'WILLIAM の世界へようこそ。', worldBodySub:'次の物語が、ゆっくりと育っています。', continued:'つづく',
    palette:'カラーパレット', sage:'初期カラー · 青と黄', ember:'新しいカラー · オレンジと赤', introLabel:'WILLIAM オープニングアニメーション', worldLabel:'私の世界'
  }
};
function readPreference(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
function savePreference(key, value) { try { localStorage.setItem(key, value); } catch { /* Optional persistence. */ } }
let language = 'en';
function setLanguage(code) {
  language = translations[code] ? code : 'en';
  const copy = translations[language];
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = copy[el.dataset.i18n]; });
  document.querySelectorAll('.language-select').forEach(el => { el.value = language; el.setAttribute('aria-label', copy.language); });
  document.querySelector('.themes').setAttribute('aria-label', copy.palette);
  document.querySelectorAll('[data-palette]').forEach(el => { el.setAttribute('aria-label', copy[el.dataset.palette]); el.title = copy[el.dataset.palette]; });
  intro.setAttribute('aria-label', copy.introLabel); world.setAttribute('aria-label', copy.worldLabel);
  document.title = `WILLIAM · ${copy.welcome}`;
  document.querySelector('meta[name="description"]').content = `WILLIAM · ${copy.welcome}. ${copy.dream}`;
  savePreference('william-language', language);
}
document.querySelectorAll('.language-select').forEach(el => el.addEventListener('change', e => setLanguage(e.target.value)));
const palettes = {
  sage: { base:'#111816', fog:['#8491810b','#acb0950d','#73847308'], glow:'#e9e7ba0d', mote:'#cbd3b529', meta:'#101514' },
  ember: { base:'#211211', fog:['#bc5e350f','#de8b5814','#a943300b'], glow:'#ff945520', mote:'#ffd0aa30', meta:'#1c1010' }
};
let palette = 'ember';
function setPalette(name) {
  palette = palettes[name] ? name : 'ember'; document.documentElement.dataset.theme = palette;
  document.querySelectorAll('[data-palette]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.palette === palette)));
  document.querySelector('meta[name="theme-color"]').content = palettes[palette].meta;
  savePreference('william-palette', palette); draw();
}
document.querySelectorAll('[data-palette]').forEach(el => el.addEventListener('click', () => setPalette(el.dataset.palette)));
let timer, ready = false, leaving = false, transitionTimer, startTime = 0;
function finish() {
  clearTimeout(timer); ready=true; intro.classList.add('ready');
  welcome.setAttribute('aria-hidden','false'); enter.disabled=false; document.querySelector('#skip').hidden=true;
}
function start() {
  clearTimeout(timer); clearTimeout(transitionTimer); ready=false; leaving=false;
  world.hidden=true; intro.hidden=false; intro.classList.remove('ready','running','leaving');
  welcome.setAttribute('aria-hidden','true'); enter.disabled=true; document.querySelector('#skip').hidden=false;
  dust.length=0; lastStep=-1;
  void intro.offsetWidth; startTime=performance.now(); intro.classList.add('running'); updateTitleMask();
  timer=setTimeout(finish,reduced.matches ? 0 : 8900); draw();
}
function go() {
  if(!ready || leaving) return;
  leaving=true; intro.classList.add('leaving');
  transitionTimer=setTimeout(() => {
    intro.hidden=true; world.hidden=false; cancelAnimationFrame(anim); document.querySelector('#back').focus({preventScroll:true});
  },reduced.matches ? 0 : 850);
}
intro.addEventListener('click',e => { if(!e.target.closest('header,footer')) go(); });
enter.addEventListener('click',go);
document.querySelector('#skip').addEventListener('click',() => { intro.classList.remove('running'); finish(); enter.focus(); });
document.querySelector('#replay').addEventListener('click',start);
for(const id of ['back','return']) document.querySelector('#'+id).addEventListener('click',() => { start(); document.querySelector('#skip').focus(); });

// Continuous articulated stride: opposing arms/legs, knee recovery, soft double bounce.
const limbs = Object.fromEntries(['leg-rear','leg-front','boot-rear','boot-front','arm-rear','arm-front','boy-pose','scarf'].map(id => [id,document.getElementById(id)]));
function pose(time) {
  const phase=time/680*Math.PI*2;
  const point=(x,y) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  limbs['boy-pose'].setAttribute('transform',`translate(0 ${(-3+3*Math.cos(phase*2)).toFixed(2)})`);
  for(const [side,offset] of [['front',0],['rear',Math.PI]]) {
    const p=phase+offset, thigh=Math.sin(p)*.8, bend=.2+1.2*((1+Math.cos(p))/2)**2;
    const hipX=side==='front'?74:60;
    const kneeX=hipX+Math.sin(thigh)*23,kneeY=105+Math.cos(thigh)*23;
    const ankleX=kneeX+Math.sin(thigh-bend)*24,ankleY=kneeY+Math.cos(thigh-bend)*24;
    limbs['leg-'+side].setAttribute('d',`M${point(hipX,105)} L${point(kneeX,kneeY)} L${point(ankleX,ankleY)}`);
    limbs['boot-'+side].setAttribute('d',`M${point(ankleX-7,ankleY-4)} L${point(ankleX+6,ankleY-4)} Q${point(ankleX+19,ankleY)} ${point(ankleX+18,ankleY+7)} L${point(ankleX-8,ankleY+7)} Z`);
    const armAngle=-Math.sin(p)*.65,sx=side==='front'?79:53,sy=67;
    const ex=sx+Math.sin(armAngle)*21,ey=sy+Math.cos(armAngle)*21;
    const hx=ex+Math.cos(armAngle+.15)*18,hy=ey-Math.sin(armAngle+.7)*18;
    limbs['arm-'+side].setAttribute('d',`M${point(sx,sy)} L${point(ex,ey)} L${point(hx,hy)}`);
  }
  limbs.scarf.setAttribute('d',`M49 57 L22 ${60+Math.sin(phase)*2} L16 ${54+Math.sin(phase)*2} L43 51 Z`);
}
const canvas=document.querySelector('#atmosphere'),ctx=canvas.getContext('2d');
const runnerWindow=document.querySelector('.runner-window'), runner=document.querySelector('.runner');
const dustCanvas=document.querySelector('#foot-dust'), dustCtx=dustCanvas.getContext('2d');
const titleMask=document.createElement('canvas'), maskCtx=titleMask.getContext('2d');
const dust=[]; let lastStep=-1;
// Use the browser's loaded title font for a pixel-accurate letter mask, including letter holes.
function updateTitleMask() {
  const scene=document.querySelector('.scene').getBoundingClientRect();
  const scale=Math.min(devicePixelRatio||1,1.5);
  titleMask.width=Math.round(scene.width*scale); titleMask.height=Math.round(scene.height*scale);
  maskCtx.setTransform(scale,0,0,scale,0,0); maskCtx.fillStyle='#fff'; maskCtx.textBaseline='alphabetic';
  let glyphBottom=0;
  for(const letter of document.querySelectorAll('.title>span')) {
    const box=letter.getBoundingClientRect(), css=getComputedStyle(letter);
    maskCtx.font=`${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
    const m=maskCtx.measureText(letter.textContent);
    const ascent=m.fontBoundingBoxAscent??m.actualBoundingBoxAscent;
    const descent=m.fontBoundingBoxDescent??m.actualBoundingBoxDescent;
    const baseline=box.top-scene.top+(box.height-ascent-descent)/2+ascent;
    maskCtx.fillText(letter.textContent,box.left-scene.left,baseline);
    glyphBottom=Math.max(glyphBottom,baseline+m.actualBoundingBoxDescent);
  }
  const mask=`url("${titleMask.toDataURL()}")`;
  runnerWindow.style.maskImage=mask; runnerWindow.style.webkitMaskImage=mask;
  runnerWindow.style.visibility='visible';
  runner.style.top=`${glyphBottom-runner.getBoundingClientRect().height*.93-2}px`;
  dustCanvas.width=Math.round(scene.width*scale); dustCanvas.height=Math.round(scene.height*scale);
  dustCtx.setTransform(scale,0,0,scale,0,0);
}
function drawFootDust(elapsed) {
  dustCtx.clearRect(0,0,w,h);
  const running=!reduced.matches && intro.classList.contains('running') && elapsed>=4000 && elapsed<=8800;
  if(!running) { dust.length=0; lastStep=-1; return; }
  const now=performance.now(), cycle=elapsed-4000;
  const step=Math.floor(cycle/340);
  if(step!==lastStep) {
    lastStep=step;
    const box=runner.getBoundingClientRect();
    const scene=runnerWindow.getBoundingClientRect();
    // Short, soft puffs on each alternating footfall; no persistent ground line.
    for(let i=0;i<10;i++) dust.push({x:box.left-scene.left+box.width*.48,y:box.top-scene.top+box.height*.89,
      born:now,life:380+Math.random()*220,vx:-15-Math.random()*55,vy:-9-Math.random()*20,r:1+Math.random()*2.8,spark:i%4===0});
  }
  for(let i=dust.length-1;i>=0;i--) {
    const p=dust[i], age=now-p.born, progress=age/p.life;
    if(progress>=1) { dust.splice(i,1); continue; }
    const seconds=age/1000;
    dustCtx.globalAlpha=(1-progress)*(p.spark?.65:.32); dustCtx.fillStyle=p.spark?'#fff6e3':'#120a08';
    const radius=p.spark?p.r*.4:p.r*(1+progress*1.8);
    dustCtx.beginPath(); dustCtx.ellipse(p.x+p.vx*seconds,p.y+p.vy*seconds,radius,radius*(.45+progress*.3),0,0,Math.PI*2); dustCtx.fill();
  }
  dustCtx.globalAlpha=1;
}
let w,h,frame=0,anim;
const motes=Array.from({length:45},() => ({x:Math.random(),y:Math.random(),r:Math.random()*1.2+.25,s:Math.random()*.12+.02}));
function resize() {
  const d=Math.min(devicePixelRatio||1,1.5); w=innerWidth; h=innerHeight;
  canvas.width=w*d; canvas.height=h*d; ctx.setTransform(d,0,0,d,0,0); if(reduced.matches) draw();
  updateTitleMask();
}
addEventListener('resize',resize);
function draw() {
  cancelAnimationFrame(anim); if(intro.hidden) return;
  frame++; const colors=palettes[palette]; ctx.fillStyle=colors.base; ctx.fillRect(0,0,w,h);
  const t=reduced.matches?0:frame*.0015;
  for(let i=0;i<7;i++) {
    const x=w*(.12+i*.14)+Math.sin(t+i*2)*w*.12,y=h*(.38+Math.sin(t*.5+i)*.14);
    const g=ctx.createRadialGradient(x,y,0,x,y,w*.35);
    g.addColorStop(0,colors.fog[i%2]); g.addColorStop(.5,colors.fog[2]); g.addColorStop(1,'#00000000'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  }
  const glow=ctx.createRadialGradient(w*.5,h*.47,0,w*.5,h*.47,w*.48);
  glow.addColorStop(0,colors.glow); glow.addColorStop(1,'#00000000'); ctx.fillStyle=glow; ctx.fillRect(0,0,w,h);
  for(const p of motes) {
    if(!reduced.matches) { p.x+=p.s/w; p.y-=.025/h; if(p.x>1)p.x=0; if(p.y<0)p.y=1; }
    ctx.beginPath(); ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2); ctx.fillStyle=colors.mote; ctx.fill();
  }
  const elapsed=performance.now()-startTime;
  if(!reduced.matches && elapsed>=4000 && elapsed<=8800 && intro.classList.contains('running')) pose(elapsed-4000);
  drawFootDust(elapsed);
  if(!reduced.matches && !document.hidden) anim=requestAnimationFrame(draw);
}
document.addEventListener('visibilitychange',() => { if(document.hidden) cancelAnimationFrame(anim); else if(!intro.hidden) draw(); });
reduced.addEventListener('change',() => { if(reduced.matches) { intro.classList.remove('running'); finish(); } draw(); });
resize(); pose(0); setLanguage(readPreference('william-language','en')); setPalette(readPreference('william-palette','ember')); start();
document.fonts.ready.then(updateTitleMask);
