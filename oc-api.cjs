const {createStore}=require('./oc-store.cjs');
const protocol={version:1,instructions:'先GET读取项目与revision；只把用户明确确认的内容设为confirmed，并填写evidence（确认原话）及source（对话链接或名称+日期）。推测设为tentative，未知保持open。每次确认后立即PATCH，不要等待对话结束。先根据字段id更新，避免重复创建。409时重新读取并核对，不能盲目覆盖。归档及恢复必须由用户明确要求。',operations:{'project.update':['title?','summary?','category?','tags?'],'entity.add':['kind: world|character|event','name'],'entity.update':['entityId','name?','summary?','image?','links?: entityIds[]'],'field.add':['entityId','label'],'field.set':['entityId','fieldId','value?','status?: confirmed|tentative|open','evidence?','source?'],'snapshot':['name'],'archive':['name'],'restore':[]},writeShape:{expectedRevision:1,requestId:'每批唯一且重试时不变的标识',source:'讨论来源',operations:[{op:'field.set',entityId:'从GET响应读取',fieldId:'从GET响应读取',value:'用户确定的内容',status:'confirmed',evidence:'用户确认原话',source:'对话名称与日期'}]}};
function createHandler({store=createStore()}={}){
  return async function handle(req,res,url,origin){
    if(!url.pathname.startsWith('/api/oc/'))return false;
    const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));return true;};
    try{
      if(req.headers.origin&&req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')return reply(403,{error:'不允许跨站调用；AI请从服务端使用Bearer密钥'});
      if(url.pathname==='/api/oc/guide'&&req.method==='GET')return reply(200,protocol);
      const human=req.headers['x-william-local']==='1'&&!req.headers.authorization;
      const parts=url.pathname.split('/').filter(Boolean),id=parts[3],action=parts[4];
      if(parts.length>5)return reply(404,{error:'接口不存在'});
      const token=(req.headers.authorization||'').match(/^Bearer (\S+)$/)?.[1];
      if(!human&&(!id||!store.authorize(token,id)))return reply(401,{error:'需要此项目的Bearer密钥'});
      let input;const body=async()=>{if(input)return input;let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>12*1024*1024){const e=new Error('请求超过12MB');e.status=413;throw e;}chunks.push(chunk);}try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new Error('需要有效的JSON请求正文');}if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('请求必须是JSON对象');return input;};
      if(parts[2]!=='projects')return reply(404,{error:'接口不存在'});
      if(!id&&req.method==='GET')return reply(200,{projects:store.list()});
      if(!id&&req.method==='POST')return reply(201,{project:store.create(await body())});
      if(id==='import'&&req.method==='POST'&&human)return reply(201,{project:store.import(await body())});
      if(id&&!action&&req.method==='GET')return reply(200,{project:store.get(id)});
      if(id&&!action&&req.method==='PATCH')return reply(200,store.update(id,await body(),human?'user':'agent'));
      if(action==='export'&&req.method==='GET')return reply(200,store.export(id));
      if(action==='key'&&human&&req.method==='POST')return reply(201,{token:store.key(id)});
      if(action==='key'&&human&&req.method==='DELETE'){store.revoke(id);return reply(200,{revoked:true});}
      return reply(404,{error:'接口不存在或此调用方式未授权'});
    }catch(e){return reply(e.status||400,{error:e.message});}
  };
}
module.exports={createHandler,protocol};
