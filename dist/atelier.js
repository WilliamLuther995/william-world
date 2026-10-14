/* Original visual studies; localized alongside the existing prologue. */
const atlasCopy = {
  en: {
    worldTitle:'A little wonder.', worldTitleSub:'A world of my own.',
    worldBody:'Somewhere between what is real and what could be. A small place for light, passing seasons, and the stories still taking shape.',
    explore:'Explore the collection', indexLabel:'THREE SMALL WORLDS, ONE OPEN DOOR',
    collectionLabel:'AN ATLAS OF SMALL WONDERS', collectionTitle:'Things worth slowing down for.', collectionNote:'Three visual studies. Open one, stay a while.',
    lightCategory:'LIGHT', lightTitle:'Where the light stays.', lightDescription:'A quiet glow, on the edge of evening.',
    rainCategory:'RAIN', rainTitle:'Notes from a rainy day.', rainDescription:'Let the outside world become a little softer.',
    snowCategory:'WINTER', snowTitle:'A letter from winter.', snowDescription:'A little distance. A little room to dream.',
    closing:'There is no hurry here.\nEvery world begins with a little wonder.', footerNote:'MADE OF LITTLE MOMENTS',
    dialogLabel:'A VISUAL STUDY', close:'Close visual study', studyNote:'An imaginative scene, created for this little world.',
    lightPoem:'The sun has almost gone.\nBut a little of its warmth stays behind.\n\nPerhaps a beginning is like this:\nnot a grand arrival,\njust a light you decide to keep.',
    rainPoem:'Rain writes on the window.\nThe city blurs into a quieter colour.\n\nFor a moment, there is nothing to finish.\nOnly the sound of passing weather,\nand a little space to listen.',
    snowPoem:'Somewhere, the first snow is falling.\nNo footsteps yet.\nNo direction to follow.\n\nA blank page is not an empty place.\nIt is a place where a story can begin.'
  },
  zh: {
    worldTitle:'一点好奇，', worldTitleSub:'一个自己的世界。',
    worldBody:'在真实与想象之间，留一个小小的地方。收藏光，收藏季节，也收藏那些还在慢慢生长的故事。',
    explore:'看看这里的风景', indexLabel:'三个小世界，一扇敞开的门',
    collectionLabel:'小小奇遇图鉴', collectionTitle:'有些瞬间，值得慢一点。', collectionNote:'三幅视觉习作。打开一幅，停留一会儿。',
    lightCategory:'光', lightTitle:'光停留的地方。', lightDescription:'黄昏的边缘，还有一点温暖。',
    rainCategory:'雨', rainTitle:'雨天的随手记。', rainDescription:'让窗外的世界，变得柔软一点。',
    snowCategory:'冬日', snowTitle:'一封冬日来信。', snowDescription:'留一点远方，也留一点想象。',
    closing:'在这里，不必着急。\n每一个世界，都始于一点好奇。', footerNote:'由微小的瞬间组成',
    dialogLabel:'一幅视觉习作', close:'关闭视觉习作', studyNote:'为这个小世界创作的一幕想象。',
    lightPoem:'太阳快要离开了，\n却把一点温暖留在这里。\n\n也许开始就是这样：\n不必盛大登场，\n只要留住一束自己喜欢的光。',
    rainPoem:'雨在玻璃上写字，\n城市慢慢晕成安静的颜色。\n\n这一刻，没有必须完成的事。\n只有路过的天气，\n和一点可以倾听的空白。',
    snowPoem:'某个地方，第一场雪正在落下。\n还没有脚印，\n也没有一定要去的方向。\n\n空白的一页，并不空。\n它是故事可以开始的地方。'
  },
  ja: {
    worldTitle:'小さな好奇心。', worldTitleSub:'私だけの世界。',
    worldBody:'現実と想像のあいだに、小さな場所を。光と季節、そしてまだ育っている物語を集めて。',
    explore:'この世界を見てみる', indexLabel:'三つの小さな世界、ひとつの扉',
    collectionLabel:'小さな不思議の図鑑', collectionTitle:'ゆっくり眺めたい瞬間。', collectionNote:'三つのビジュアル習作。ひとつ開いて、ひと休み。',
    lightCategory:'光', lightTitle:'光がとどまる場所。', lightDescription:'夕暮れのふちに、少しのぬくもり。',
    rainCategory:'雨', rainTitle:'雨の日のノート。', rainDescription:'窓の向こうの世界が、少しやわらかくなる。',
    snowCategory:'冬', snowTitle:'冬から届いた手紙。', snowDescription:'少しの遠さ。夢を見る余白。',
    closing:'ここでは、急がなくていい。\nすべての世界は、小さな好奇心から。', footerNote:'小さな瞬間を集めて',
    dialogLabel:'ビジュアル習作', close:'習作を閉じる', studyNote:'この小さな世界のために描いた、想像の風景。',
    lightPoem:'太陽はもうすぐ沈む。\nでも、ぬくもりは少し残っている。\n\nはじまりも、きっとそんなもの。\n華やかでなくてもいい。\n好きな光を、ひとつ残せば。',
    rainPoem:'雨が窓に文字を書く。\n街は静かな色ににじんでいく。\n\n今は、何も終わらせなくていい。\n通り過ぎる天気の音に、\nそっと耳をすませる。',
    snowPoem:'どこかで、初めての雪が降る。\nまだ足跡はない。\n進む方向も、決まっていない。\n\n白紙は、空っぽではない。\n物語がはじまる場所。'
  }
};
for (const code of Object.keys(atlasCopy)) Object.assign(translations[code], atlasCopy[code]);
const studyDialog = document.querySelector('#study-dialog');
let activeStudy = null, studyOpener = null, dialogScrollY = 0;
function updateStudy() {
  document.querySelectorAll('[data-i18n-label]').forEach(el => el.setAttribute('aria-label', translations[language][el.dataset.i18nLabel]));
  if (!activeStudy) return;
  const copy = translations[language];
  document.querySelector('#study-dialog-title').textContent = copy[activeStudy+'Title'];
  studyDialog.querySelector('.dialog-poem').textContent = copy[activeStudy+'Poem'];
  studyDialog.querySelector('.dialog-number').textContent = `0${['light','rain','snow'].indexOf(activeStudy)+1} / ${copy[activeStudy+'Category']}`;
}
document.querySelectorAll('.study-card').forEach(card => {
  card.addEventListener('click', () => {
    activeStudy = card.dataset.study; studyOpener = card;
    const art = card.querySelector('.study-art').cloneNode(true);
    studyDialog.querySelector('.dialog-art').replaceChildren(art);
    updateStudy(); dialogScrollY = scrollY;
    studyDialog.showModal(); studyDialog.scrollTop=0;
    document.body.style.overflow='hidden';
    studyDialog.querySelector('.dialog-close').focus({preventScroll:true});
  });
  card.addEventListener('pointermove', e => {
    if (reduced.matches || e.pointerType==='touch') return;
    const rect=card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${e.clientX-rect.left}px`);
    card.style.setProperty('--spot-y', `${e.clientY-rect.top}px`);
  });
});
studyDialog.querySelector('.dialog-close').addEventListener('click',()=>studyDialog.close());
studyDialog.addEventListener('click', e => {
  const rect = studyDialog.getBoundingClientRect();
  if (e.target === studyDialog && (e.clientX<rect.left || e.clientX>rect.right || e.clientY<rect.top || e.clientY>rect.bottom)) studyDialog.close();
});
studyDialog.addEventListener('close',()=>{
  document.body.style.overflow='';
  window.scrollTo({top:dialogScrollY,behavior:'instant'});
  studyOpener?.focus({preventScroll:true}); activeStudy=null;
});
addEventListener('william:languagechange',updateStudy);
setLanguage(language);
