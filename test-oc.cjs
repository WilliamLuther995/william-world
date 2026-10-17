const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {createStore}=require('./oc-store.cjs'),{createHandler}=require('./oc-api.cjs');
const archiveHtml=fs.readFileSync(path.join(__dirname,'dist/oc-archive.html'),'utf8');
for(const match of archiveHtml.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|html))"/g))assert(fs.existsSync(path.join(__dirname,'dist',match[1])),`页面资源缺失：${match[1]}`);
async function run(){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'william-oc-test-'));let server;try{
const store=createStore(directory),p=store.create({title:'测试世界',category:'测试'}),other=store.create({title:'另一个项目'}),e=p.entities[0],f=e.fields[0];
const patch=(operations,extra={})=>({expectedRevision:store.get(p.id).revision,operations,...extra});
assert.throws(()=>store.update(p.id,patch([{op:'field.set',entityId:e.id,fieldId:f.id,value:'已定环境',status:'confirmed'}]),'agent'),/确认原话/);
assert.equal(store.get(p.id).revision,1);
assert.throws(()=>store.create({title:'bad',category:{}}));
assert.throws(()=>store.update(p.id,patch([{op:'entity.add',kind:'toString',name:'bad'}]),'user'));
assert.throws(()=>store.update(p.id,patch([{op:'entity.update',entityId:e.id,image:'javascript:alert(1)'}]),'user'));
assert.throws(()=>store.update(p.id,patch([{op:'project.update',title:'不应保存'},{op:'field.set',entityId:'missing',fieldId:f.id,value:'错误'}]),'user'));
assert.equal(store.get(p.id).title,'测试世界','批次失败应完整回滚');
store.update(p.id,patch([{op:'field.set',entityId:e.id,fieldId:f.id,value:'环绕海洋的群岛',status:'confirmed',evidence:'就定为群岛',source:'测试讨论 / 2026-10-17'}],{requestId:'test-confirm'}),'agent');
assert.equal(createStore(directory).get(p.id).entities[0].fields[0].value,'环绕海洋的群岛','重启后持久保存');
assert.throws(()=>store.update(p.id,patch([{op:'field.set',entityId:e.id,fieldId:f.id,value:'偷偷改动'}]),'agent'),/确认原话/,'确认设定的后续修改不能复用旧依据');
assert.throws(()=>store.update(p.id,{expectedRevision:1,operations:[{op:'project.update',title:'过时修改'}]},'user'),e=>e.status===409);
assert.equal(store.update(p.id,{expectedRevision:1,requestId:'test-confirm',operations:[{op:'project.update',title:'重复请求'}]},'agent').replayed,true);
store.update(p.id,patch([{op:'snapshot',name:'第一阶段'},{op:'entity.add',kind:'character',name:'测试角色'}]),'user');
const now=store.get(p.id);assert.equal(now.versions[0].document.entities.length,1);assert.equal(now.entities.length,2);
store.update(p.id,patch([{op:'archive'}]),'user');assert.throws(()=>store.update(p.id,patch([{op:'entity.add',kind:'event',name:'不应创建'}]),'agent'),e=>e.status===409);
store.update(p.id,patch([{op:'restore'}]),'user');const imported=store.import(store.export(p.id));assert.notEqual(imported.id,p.id);assert.equal(imported.entities.length,2);assert.equal(imported.entities[0].fields[0].status,'confirmed');
const key=store.key(p.id);assert(store.authorize(key,p.id));assert(!store.authorize(key,other.id));assert(!fs.readFileSync(path.join(directory,'archive.json'),'utf8').includes(key),'磁盘不能保存明文密钥');
const handler=createHandler({store});server=http.createServer(async(req,res)=>{await handler(req,res,new URL(req.url,'http://127.0.0.1'),`http://127.0.0.1:${server.address().port}`)||res.end();});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
async function call(route,options={}){const response=await fetch(origin+'/api/oc/'+route,options);return {status:response.status,data:await response.json()};}
assert.equal((await call('projects')).status,401);assert.equal((await call('guide')).status,200);
assert.equal((await call('projects/'+p.id,{headers:{Authorization:'Bearer '+key}})).status,200);
assert.equal((await call('projects/'+other.id,{headers:{Authorization:'Bearer '+key}})).status,401);
assert.equal((await call('projects/'+p.id+'/key',{method:'POST',headers:{Authorization:'Bearer '+key}})).status,404);
assert.equal((await call('projects',{headers:{'X-William-Local':'1',Origin:'https://elsewhere.example'}})).status,403);
assert.equal((await call('projects',{headers:{'X-William-Local':'1'}})).data.projects.length,3);
const live=store.get(p.id),character=live.entities[1],op={op:'field.set',entityId:character.id,fieldId:character.fields[0].id,value:'女性',status:'confirmed',evidence:'确定她是女性',source:'HTTP模拟讨论'};
const response=await call('projects/'+p.id,{method:'PATCH',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:live.revision,requestId:'http-agent',operations:[op],source:'HTTP模拟讨论'})});assert.equal(response.status,200);assert.equal(response.data.project.history[0].actor,'agent');assert.equal(response.data.project.entities[1].fields[0].value,'女性');
store.key(p.id);assert.equal((await call('projects/'+p.id,{headers:{Authorization:'Bearer '+key}})).status,401,'密钥轮换应撤销旧连接');store.revoke(p.id);
console.log('OC archive: persistence, atomic edits, revisions, idempotency, evidence, versions, import, API authorization and cross-project isolation passed.');
}finally{if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(directory,{recursive:true,force:true});}}
run().catch(e=>{console.error(e);process.exitCode=1;});
