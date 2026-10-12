/* UI-independent effect state. Future editor surfaces use this same registry. */
(() => {
  const modules = new Map(), events = new EventTarget();
  const clone = value => JSON.parse(JSON.stringify(value));
  let saved = {};
  try { const value=JSON.parse(localStorage.getItem('william-effects-v1')); if(value?.version===1) saved=value.modules||{}; } catch { /* Browser storage is optional. */ }
  function snapshot() { return {version:1,modules:Object.fromEntries([...modules].map(([id,m])=>[id,clone(m.state)]))}; }
  function persist() { try { localStorage.setItem('william-effects-v1',JSON.stringify(snapshot())); } catch {} }
  function emit(id) { events.dispatchEvent(new CustomEvent('change',{detail:{id,state:clone(modules.get(id).state)}})); }
  window.siteEffects = {
    register(id, definition) {
      if(modules.has(id)) throw new Error(`Effect already registered: ${id}`);
      let state;
      try {state=definition.normalize(saved[id]||definition.defaults);} catch {state=definition.normalize(definition.defaults);}
      modules.set(id,{...definition,state});
    },
    get(id) { const m=modules.get(id); if(!m) throw new Error(`Unknown effect: ${id}`); return clone(m.state); },
    update(id, patch) {
      const m=modules.get(id); if(!m) throw new Error(`Unknown effect: ${id}`);
      m.state=m.normalize({...m.state,...clone(patch)}); persist(); emit(id); return clone(m.state);
    },
    list() { return [...modules.keys()]; },
    subscribe(listener) { const handler=e=>listener(e.detail); events.addEventListener('change',handler); return ()=>events.removeEventListener('change',handler); },
    exportConfig: snapshot,
    importConfig(config) {
      if(!config || config.version!==1 || !config.modules || typeof config.modules!=='object') throw new Error('Unsupported effect configuration');
      // Validate every module before changing any state.
      const updates=[...modules].filter(([id])=>Object.hasOwn(config.modules,id)).map(([id,m])=>[id,m.normalize(config.modules[id])]);
      for(const [id,state] of updates) modules.get(id).state=state;
      persist(); for(const [id] of updates) emit(id);
    }
  };
})();
