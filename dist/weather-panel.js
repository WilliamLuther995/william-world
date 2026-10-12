/* An editor surface for the weather module, not an owner of effect state. */
(() => {
  const hub=window.siteEffects,weather=window.weatherSystem;
  const copy={
    en:{button:'Weather',title:'Weather studio',subtitle:'THE PROLOGUE · ATMOSPHERE',close:'Close panel',mode:'Weather effect',leaves:'Autumn leaves','light-rain':'Light rain','heavy-rain':'Heavy rain','light-snow':'Light snow','heavy-snow':'Heavy snow',none:'Off',count:'Particle count',speed:'Fall speed',wind:'Wind',size:'Particle size',opacity:'Opacity',depth:'Depth',reset:'Reset this effect',export:'Export settings',import:'Import settings',hint:'Live preview · saved in this browser',active:'Visible particles',mobile:'Mobile uses 60% of the configured count.',reduced:'Reduced motion is enabled. Particles stay still.',off:'Choose an effect to adjust its parameters.',success:'Settings imported.',error:'Unable to import this configuration.',unit:'px/s'},
    zh:{button:'天气',title:'天气工作室',subtitle:'序幕 · 氛围设置',close:'关闭面板',mode:'天气效果',leaves:'秋叶','light-rain':'小雨','heavy-rain':'大雨','light-snow':'小雪','heavy-snow':'大雪',none:'关闭',count:'粒子数量',speed:'下落速度',wind:'风力',size:'粒子大小',opacity:'不透明度',depth:'空间层次',reset:'重置当前效果',export:'导出配置',import:'导入配置',hint:'实时预览 · 自动保存到当前浏览器',active:'实际粒子数',mobile:'手机使用设定数量的 60%。',reduced:'已启用减少动态效果，粒子保持静止。',off:'选择一种天气后可调整参数。',success:'配置已导入。',error:'无法导入此配置，请检查文件。',unit:'像素/秒'},
    ja:{button:'天気',title:'天気スタジオ',subtitle:'プロローグ · 雰囲気',close:'パネルを閉じる',mode:'天気エフェクト',leaves:'秋の葉','light-rain':'小雨','heavy-rain':'大雨','light-snow':'小雪','heavy-snow':'大雪',none:'オフ',count:'粒子の数',speed:'落下速度',wind:'風',size:'粒子の大きさ',opacity:'不透明度',depth:'奥行き',reset:'この効果をリセット',export:'設定を書き出す',import:'設定を読み込む',hint:'ライブプレビュー · このブラウザに保存',active:'表示中の粒子',mobile:'スマートフォンでは設定数の60%を表示します。',reduced:'動きを減らす設定により、粒子は静止します。',off:'天気を選択してパラメータを調整できます。',success:'設定を読み込みました。',error:'設定ファイルを読み込めません。',unit:'px/秒'}
  };
  const button=document.createElement('button');button.id='weather-toggle';button.className='quiet weather-toggle';button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','weather-panel');
  document.querySelector('.footer-controls').prepend(button);
  const panel=document.createElement('section');panel.id='weather-panel';panel.className='weather-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','weather-title');
  panel.innerHTML=`<div class="weather-heading"><div><p data-weather-copy="subtitle"></p><h2 id="weather-title" data-weather-copy="title"></h2></div><button type="button" class="weather-close">×</button></div>
    <label class="weather-mode"><span data-weather-copy="mode"></span><select id="weather-preset"></select></label>
    <div class="weather-params"></div><p class="weather-meta"></p><p class="weather-motion"></p>
    <button type="button" class="weather-reset" data-weather-copy="reset"></button>
    <div class="weather-files"><button type="button" id="weather-export" data-weather-copy="export"></button><button type="button" id="weather-import" data-weather-copy="import"></button><input type="file" id="weather-file" accept=".json,application/json" hidden></div>
    <p class="weather-hint" data-weather-copy="hint"></p><p class="weather-status" role="status"></p>`;
  document.querySelector('.intro').append(panel);
  const select=panel.querySelector('select'),params=panel.querySelector('.weather-params'),motion=matchMedia('(prefers-reduced-motion: reduce)');
  for(const [key,range] of Object.entries(weather.schema)) {
    const label=document.createElement('label');label.className='weather-param';
    label.innerHTML=`<span><span data-weather-copy="${key}"></span><output for="weather-${key}"></output></span><input id="weather-${key}" type="range" min="${range.min}" max="${range.max}" step="${range.step}" data-param="${key}">`;
    label.querySelector('input').addEventListener('input',e=>weather.update({[key]:Number(e.target.value)}));params.append(label);
  }
  const currentCopy=()=>copy[document.documentElement.lang]||copy.en;
  function render() {
    const text=currentCopy(),state=hub.get('weather'),off=state.preset==='none';
    button.textContent=`◌  ${text.button}`;panel.querySelector('.weather-close').setAttribute('aria-label',text.close);
    panel.querySelectorAll('[data-weather-copy]').forEach(el=>el.textContent=text[el.dataset.weatherCopy]);
    const ids=['none',...weather.presets()];
    if(select.options.length!==ids.length) select.replaceChildren(...ids.map(id=>new Option(text[id]||id,id)));
    for(const option of select.options) option.textContent=text[option.value]||option.value;
    select.value=state.preset;panel.querySelector('.weather-reset').disabled=off;
    for(const input of params.querySelectorAll('input')) {
      const key=input.dataset.param,value=(state.profiles[state.preset]||state.profiles.leaves)[key];input.value=value;input.disabled=off;
      const display=key==='opacity'||key==='depth'?`${Math.round(value*100)}%`:key==='size'?`${value.toFixed(2).replace(/0$/,'')}×`:key==='speed'||key==='wind'?`${value} ${text.unit}`:String(value);
      input.setAttribute('aria-valuetext',display);input.closest('label').querySelector('output').textContent=display;
    }
    panel.querySelector('.weather-meta').textContent=off?text.off:`${text.active}: ${weather.stats().activeCount}${innerWidth<600?' · '+text.mobile:''}`;
    panel.querySelector('.weather-motion').textContent=motion.matches?text.reduced:'';
  }
  function close() {panel.hidden=true;button.setAttribute('aria-expanded','false');button.focus({preventScroll:true});}
  button.addEventListener('click',()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){render();select.focus({preventScroll:true});}});
  panel.querySelector('.weather-close').addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close();}});
  select.addEventListener('change',()=>{status.textContent='';weather.select(select.value);});
  panel.querySelector('.weather-reset').addEventListener('click',()=>{status.textContent='';weather.reset();});
  panel.querySelector('#weather-export').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(hub.exportConfig(),null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='william-effects.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  const file=panel.querySelector('#weather-file'),status=panel.querySelector('.weather-status');
  panel.querySelector('#weather-import').addEventListener('click',()=>file.click());
  file.addEventListener('change',async()=>{const selected=file.files[0];if(!selected)return;try{if(selected.size>100000)throw new Error('Configuration too large');hub.importConfig(JSON.parse(await selected.text()));status.textContent=currentCopy().success;}catch{status.textContent=currentCopy().error;}file.value='';});
  hub.subscribe(({id})=>{if(id==='weather')render();});
  addEventListener('william:languagechange',render);addEventListener('resize',render);motion.addEventListener('change',render);render();
})();
