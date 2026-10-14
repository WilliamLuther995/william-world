const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8');
const app=fs.readFileSync('dist/app.js','utf8');
const atlas=fs.readFileSync('dist/atelier.js','utf8');
const base=vm.runInNewContext(app.slice(app.indexOf('const translations ='),app.indexOf('function readPreference'))+';translations');
const extra=vm.runInNewContext(atlas.slice(0,atlas.indexOf('for (const code'))+';atlasCopy');
const keys=[...html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)].map(m=>m[1]);
for(const code of ['en','zh','ja']) {
  const dict={...base[code],...extra[code]};
  for(const key of keys) assert.equal(typeof dict[key],'string',`${code}: missing ${key}`);
  for(const study of ['light','rain','snow']) assert.ok(dict[study+'Poem'].length>30);
}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate HTML IDs');
for(const target of html.matchAll(/(?:aria-labelledby|href)="#?([\w-]+)"/g)) assert.ok(ids.includes(target[1]),`Missing target ${target[1]}`);
for(const ref of html.matchAll(/(?:src|href)="([^"#:]+\.(?:js|css))"/g)) assert.ok(fs.existsSync('dist/'+ref[1]),`Missing asset ${ref[1]}`);
assert.equal((html.match(/data-study=/g)||[]).length,3);
assert.ok(html.includes('aria-haspopup="dialog"')&&html.includes('<dialog'));
console.log('PASS: three languages, three study texts, IDs, navigation and all script/style references.');
