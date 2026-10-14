/* Particle simulation and renderers are independent of the control panel. */
(() => {
  const hub=window.siteEffects, presets=new Map(), renderers=new Map();
  const schema={
    count:{min:0,max:900,step:10}, speed:{min:10,max:1000,step:5},
    wind:{min:-250,max:250,step:5}, size:{min:.4,max:2.5,step:.05},
    opacity:{min:.1,max:1,step:.01}, depth:{min:0,max:1,step:.05}
  };
  const planes=[
    {id:'far',weight:.5,scale:.48,velocity:.62,alpha:.42,blur:0,parallax:2},
    {id:'middle',weight:.34,scale:1,velocity:1,alpha:.88,blur:0,parallax:9},
    {id:'near',weight:.16,scale:1.9,velocity:1.6,alpha:1,blur:.8,parallax:23}
  ];
  const random=(a,b)=>a+Math.random()*(b-a);
  const leafShapes=[new Path2D('M0 -1 L.16 -.55 .42 -.72 .37 -.31 .82 -.4 .56 -.02 1 .14 .5 .36 .56 .65 .12 .53 0 .84 -.13 .53 -.55 .67 -.48 .36 -1 .14 -.57 -.02 -.81 -.4 -.37 -.31 -.44 -.72 -.16 -.55 Z'),new Path2D('M0 -1 C.63 -.68 .78 -.04 .38 .45 L0 .83 C-.64 .42 -.75 -.31 0 -1 Z')];
  renderers.set('leaves',(ctx,p,size,time)=>{
    const phase=time*p.frequency+p.phase, turn=Math.cos(phase*.85);
    ctx.rotate(p.angle+Math.sin(phase)*.35); ctx.scale((turn<0?-1:1)*(.2+.8*Math.abs(turn)),1);
    ctx.fillStyle=ctx.strokeStyle='#050504'; ctx.scale(size*.6,size); ctx.fill(leafShapes[p.shape]);
    ctx.lineWidth=.055; ctx.beginPath();ctx.moveTo(0,.46);ctx.quadraticCurveTo(.03,.85,.12,1.12);ctx.stroke();
  });
  renderers.set('rain',(ctx,p,size,time,config,plane)=>{
    const length=size*8, angle=Math.atan2(config.wind,config.speed)*.7;
    ctx.rotate(-angle); ctx.strokeStyle=document.documentElement.dataset.theme==='sky'?'#416d8c':'#d8dce0';ctx.lineWidth=Math.max(.5,size*.13);
    ctx.beginPath();ctx.moveTo(0,-length*.5);ctx.lineTo(0,length*.5);ctx.stroke();
  });
  renderers.set('snow',(ctx,p,size)=>{
    ctx.fillStyle=document.documentElement.dataset.theme==='sky'?'#638ca6':'#f4eee7';ctx.beginPath();ctx.arc(0,0,size*.48,0,Math.PI*2);ctx.fill();
  });
  function registerPreset(id,definition) {
    if(presets.has(id) || !renderers.has(definition.kind)) throw new Error(`Invalid weather preset: ${id}`);
    presets.set(id,{...definition,params:cleanParams(definition.params)});
  }
  function cleanParams(input,base={count:100,speed:100,wind:20,size:1,opacity:.7,depth:.85}) {
    return Object.fromEntries(Object.entries(schema).map(([key,range])=>{
      const v=Number(input?.[key]??base[key]); return [key,Math.max(range.min,Math.min(range.max,Number.isFinite(v)?v:base[key]))];
    }));
  }
  registerPreset('leaves',{kind:'leaves',params:{count:100,speed:100,wind:35,size:1,opacity:.85,depth:1}});
  registerPreset('light-rain',{kind:'rain',params:{count:180,speed:420,wind:25,size:.8,opacity:.38,depth:.8}});
  registerPreset('heavy-rain',{kind:'rain',params:{count:650,speed:820,wind:95,size:1.25,opacity:.65,depth:1}});
  registerPreset('light-snow',{kind:'snow',params:{count:130,speed:55,wind:12,size:.85,opacity:.78,depth:1}});
  registerPreset('heavy-snow',{kind:'snow',params:{count:430,speed:120,wind:50,size:1.35,opacity:.9,depth:1}});
  function normalize(value) {
    if(!value || typeof value!=='object') throw new Error('Invalid weather settings');
    const preset=value.preset==='none'||presets.has(value.preset)?value.preset:'leaves';
    const profiles=Object.fromEntries([...presets].map(([id,p])=>[id,cleanParams(value.profiles?.[id],p.params)]));
    return {scope:'intro',preset,profiles};
  }
  hub.register('weather',{defaults:{preset:'leaves',profiles:{}},normalize});
  let width=1,height=1,previous=0,time=0,pointerX=0,pointerY=0,viewX=0,viewY=0;
  let state=hub.get('weather');
  let kind=presets.get(state.preset)?.kind||'leaves',config=state.profiles[state.preset]||state.profiles.leaves;
  for(const plane of planes) {plane.canvas=document.querySelector(`[data-depth="${plane.id}"]`);plane.ctx=plane.canvas.getContext('2d');plane.particles=[];}
  function createParticle() {
    return {x:Math.random()*width,y:random(-30,height+30),scale:random(.7,1.25),velocity:random(.75,1.25),phase:random(0,Math.PI*2),frequency:random(.55,1.15),spin:random(-.9,.9),angle:random(-Math.PI,Math.PI),shape:Math.random()<.65?0:1};
  }
  function reconcile() {
    const total=state.preset==='none'?0:Math.round(config.count*(width<600?.6:1));
    let remaining=total;
    planes.forEach((plane,i)=>{
      const count=i===planes.length-1?remaining:Math.round(total*plane.weight); remaining-=count;
      while(plane.particles.length<count) plane.particles.push(createParticle());
      plane.particles.length=count;
    });
  }
  hub.subscribe(({id,state:next})=>{
    if(id!=='weather') return;
    const changed=state.preset!==next.preset; state=next;
    if(state.preset!=='none') {kind=presets.get(state.preset).kind; config=state.profiles[state.preset];}
    if(changed) for(const plane of planes) plane.particles=[];
    reconcile(); previous=0;
  });
  function resize(w,h) {
    const oldW=width,oldH=height; width=w;height=h;const d=Math.min(devicePixelRatio||1,1.5);
    for(const plane of planes) {
      plane.canvas.width=Math.round(w*d);plane.canvas.height=Math.round(h*d);plane.ctx.setTransform(d,0,0,d,0,0);
      for(const p of plane.particles) {p.x*=w/oldW;p.y*=h/oldH;}
    }
    reconcile();previous=0;
  }
  function draw(now,still=false) {
    const dt=still?0:(previous?Math.min((now-previous)/1000,.05):0);previous=now;time+=dt;
    viewX+=(pointerX-viewX)*Math.min(dt*3,1);viewY+=(pointerY-viewY)*Math.min(dt*3,1);
    for(const plane of planes) {
      const ctx=plane.ctx;ctx.clearRect(0,0,width,height);
      if(state.preset==='none') continue;
      const depth=config.depth, scale=1+(plane.scale-1)*depth, velocity=1+(plane.velocity-1)*depth;
      ctx.filter=plane.blur&&depth>.4?`blur(${plane.blur*depth}px)`:'none';
      ctx.globalAlpha=config.opacity*(1+(plane.alpha-1)*depth);
      for(const p of plane.particles) {
        const size=(kind==='leaves'?14:kind==='rain'?2.4:3.4)*config.size*scale*p.scale;
        if(!still) {
          p.y+=config.speed*velocity*p.velocity*dt;p.x+=config.wind*velocity*dt;p.angle+=p.spin*dt;
          if(p.y>height+size*12) {p.y=-size*12;p.x=random(-20,width+20);}
          const margin=80; if(p.x>width+margin)p.x=-margin;if(p.x<-margin)p.x=width+margin;
        }
        const phase=(still?0:time)*p.frequency+p.phase;
        const sway=kind==='rain'?0:Math.sin(phase)*(kind==='leaves'?28:18)*scale;
        ctx.save();ctx.translate(p.x+sway+(still?0:viewX*plane.parallax*depth),p.y+(still?0:viewY*plane.parallax*depth));
        renderers.get(kind)(ctx,p,size,still?0:time,config,plane);ctx.restore();
      }
      ctx.globalAlpha=1;ctx.filter='none';
    }
  }
  function select(preset) {if(preset!=='none'&&!presets.has(preset))throw new Error('Unknown weather preset');hub.update('weather',{preset});}
  function update(patch) {if(state.preset==='none')return;hub.update('weather',{profiles:{...state.profiles,[state.preset]:cleanParams({...config,...patch},config)}});}
  function reset() {if(state.preset==='none')return;hub.update('weather',{profiles:{...state.profiles,[state.preset]:presets.get(state.preset).params}});}
  const intro=document.querySelector('.intro');
  intro.addEventListener('pointermove',e=>{pointerX=(e.clientX/width-.5)*2;pointerY=(e.clientY/height-.5)*2;},{passive:true});
  intro.addEventListener('pointerleave',()=>{pointerX=pointerY=0;});
  document.addEventListener('visibilitychange',()=>{previous=0;});
  window.weatherSystem={resize,draw,select,update,reset,schema,
    presets:()=>[...presets.keys()],
    stats:()=>({preset:state.preset,activeCount:planes.reduce((sum,p)=>sum+p.particles.length,0),layers:planes.map(p=>({depth:p.id,count:p.particles.length}))}),
    registerRenderer(id,renderer) {if(renderers.has(id)||typeof renderer!=='function')throw new Error('Invalid weather renderer');renderers.set(id,renderer);},
    registerPreset(id,definition) {registerPreset(id,definition);hub.update('weather',{});}
  };
})();
