/* Three physical depth planes share the atmosphere's animation loop. */
(() => {
  const layers = [
    { depth:'far', count:16, size:[6,12], speed:[10,17], opacity:.32, blur:.35, parallax:2 },
    { depth:'middle', count:10, size:[13,23], speed:[22,35], opacity:.68, blur:0, parallax:8 },
    { depth:'near', count:4, size:[31,48], speed:[42,62], opacity:.72, blur:1.25, parallax:22 }
  ];
  const shapes = [
    new Path2D('M0 -1 L.16 -.55 .42 -.72 .37 -.31 .82 -.4 .56 -.02 1 .14 .5 .36 .56 .65 .12 .53 0 .84 -.13 .53 -.55 .67 -.48 .36 -1 .14 -.57 -.02 -.81 -.4 -.37 -.31 -.44 -.72 -.16 -.55 Z'),
    new Path2D('M0 -1 C.63 -.68 .78 -.04 .38 .45 L0 .83 C-.64 .42 -.75 -.31 0 -1 Z')
  ];
  let width=1, height=1, previous=0;
  let pointerX=0, pointerY=0, viewX=0, viewY=0;
  const random=(min,max) => min+Math.random()*(max-min);
  function createLeaf(layer) {
    return {x:Math.random(), y:random(-.12,1.05), size:random(...layer.size), speed:random(...layer.speed),
      phase:random(0,Math.PI*2), spin:random(-.65,.65), angle:random(-Math.PI,Math.PI),
      sway:random(10,32), frequency:random(.55,1.15), shape:Math.random()<.65?0:1};
  }
  for(const layer of layers) {
    layer.canvas=document.querySelector(`[data-depth="${layer.depth}"]`);
    layer.ctx=layer.canvas.getContext('2d');
    layer.leaves=Array.from({length:layer.count},()=>createLeaf(layer));
  }
  function resize(w,h) {
    width=w; height=h; const d=Math.min(devicePixelRatio||1,1.5);
    for(const layer of layers) {
      layer.canvas.width=Math.round(w*d); layer.canvas.height=Math.round(h*d);
      layer.ctx.setTransform(d,0,0,d,0,0);
    }
    previous=0;
  }
  function draw(now,still=false) {
    const dt=previous?Math.min((now-previous)/1000,.05):0;
    previous=now;
    if(!still) { viewX+=(pointerX-viewX)*Math.min(dt*3,1); viewY+=(pointerY-viewY)*Math.min(dt*3,1); }
    const time=still?0:now/1000;
    for(const layer of layers) {
      const ctx=layer.ctx; ctx.clearRect(0,0,width,height);
      const count=width<600?Math.ceil(layer.count*.55):layer.count;
      for(let i=0;i<count;i++) {
        const leaf=layer.leaves[i];
        if(!still) {
          leaf.y+=leaf.speed*dt/height; leaf.x+=dt*4/width; leaf.angle+=leaf.spin*dt;
          if(leaf.y*height>height+leaf.size*2) { leaf.y=-leaf.size*2/height; leaf.x=Math.random(); }
          if(leaf.x*width>width+leaf.size*2) leaf.x=-leaf.size*2/width;
        }
        const phase=time*leaf.frequency+leaf.phase;
        const x=leaf.x*width+Math.sin(phase)*leaf.sway+(still?0:viewX*layer.parallax);
        const y=leaf.y*height+Math.cos(phase*.75)*5+(still?0:viewY*layer.parallax);
        // Moving edge-on and back gives each leaf a turning plane rather than a flat sprite.
        const turn=Math.cos(phase*.85); const face=(turn<0?-1:1)*(.22+.78*Math.abs(turn));
        ctx.save(); ctx.translate(x,y); ctx.rotate(leaf.angle+Math.sin(phase)*.35);
        ctx.scale(face,1); ctx.filter=layer.blur?`blur(${layer.blur}px)`:'none';
        ctx.globalAlpha=layer.opacity*(.8+.2*Math.abs(turn)); ctx.fillStyle='#050504';
        ctx.scale(leaf.size*.6,leaf.size); ctx.fill(shapes[leaf.shape]);
        ctx.strokeStyle='#050504'; ctx.lineWidth=.055;
        ctx.beginPath(); ctx.moveTo(0,.46); ctx.quadraticCurveTo(.03,.85,.12,1.12); ctx.stroke();
        ctx.restore();
      }
    }
  }
  document.querySelector('.intro').addEventListener('pointermove',e=>{
    pointerX=(e.clientX/width-.5)*2; pointerY=(e.clientY/height-.5)*2;
  },{passive:true});
  document.querySelector('.intro').addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
  document.addEventListener('visibilitychange',()=>{previous=0;});
  window.autumnLeaves={resize,draw};
})();
