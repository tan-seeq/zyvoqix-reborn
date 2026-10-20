import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import catalog from '../public/library-catalog.json' with {type:'json'};
import {config,openSession,verifyCredentials,authenticated,sameOrigin,equal,SESSION_SECONDS,createLoginLimiter,loginPath,safeNext} from '../server/admin-auth.mjs';
import {adminPage} from '../server/admin-pages.mjs';
const take=createLoginLimiter();let activeLogins=0;
function privateHeaders(res){for(const [k,v]of Object.entries({'Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store','Pragma':'no-cache','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','X-Robots-Tag':'noindex, nofollow, noarchive','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}))res.setHeader(k,v);}
const fail=(res,status,code)=>res.status(status).json({ok:false,code});
async function metadata(file){try{return JSON.parse(await readFile(path.join(process.cwd(),'public',file),'utf8'));}catch{return null;}}
export default async function handler(req,res){
 privateHeaders(res);
 try{
  const cfg=config(),u=new URL(req.url,'https://'+req.headers.host),lang=u.searchParams.get('lang')==='ar'?'ar':'en';
  if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return fail(res,405,'METHOD');}
  if(req.method==='POST'&&!sameOrigin(req))return fail(res,403,'ORIGIN');
  const session=await openSession(req,res,cfg);
  if(req.method==='GET'){
   const view=u.searchParams.get('view');
   if(!authenticated(session,cfg)){
    if(view==='dashboard'||view==='backup'){res.setHeader('Location',loginPath(lang,view));return res.status(302).end();}
    return fail(res,401,'UNAUTHENTICATED');
   }
   if(view){if(!['dashboard','backup'].includes(view))return fail(res,404,'NOT_FOUND');res.setHeader('Content-Type','text/html; charset=utf-8');return res.status(200).send(adminPage(lang,view,cfg.email));}
   const operation=u.searchParams.get('operation')||'session';
   if(operation==='session')return res.status(200).json({ok:true,role:'super-admin',csrf:session.csrf,email:cfg.email,expiresAt:session.expiresAt});
   if(operation==='status')return res.status(200).json({ok:true,games:catalog.length,touch:catalog.filter(g=>!g.desktop).length,desktop:catalog.filter(g=>g.desktop).length,localizedGamePages:catalog.length*2,release:await metadata('source-release.json'),pageBuild:await metadata('page-build.json'),libraryBuild:await metadata('library-build.json'),cloudSaves:Boolean(process.env.BLOB_READ_WRITE_TOKEN||(process.env.BLOB_STORE_ID&&process.env.VERCEL_OIDC_TOKEN)),backupScope:'this-browser-localStorage',checkedAt:new Date().toISOString()});
   if(operation==='catalog')return res.status(200).json({ok:true,games:catalog.map(g=>({id:g.id,name:g.name,desktop:!!g.desktop,runtimeMB:g.runtimeMB,categories:g.categories,device:g.device,i18n:g.i18n,entry:g.entry}))});
   return fail(res,404,'NOT_FOUND');
  }
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return fail(res,415,'CONTENT_TYPE');
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return fail(res,400,'BODY');}
  if(!body||Array.isArray(body)||typeof body!=='object'||Buffer.byteLength(JSON.stringify(body))>4096)return fail(res,400,'BODY');
  if(body.action==='login'){
   const ip=String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].slice(0,100);
   if(!take(ip)){res.setHeader('Retry-After','600');return fail(res,429,'RATE_LIMIT');}
   if(activeLogins>=4){res.setHeader('Retry-After','3');return fail(res,503,'BUSY');}
   let valid;activeLogins++;try{valid=await verifyCredentials(body.email,body.password,cfg);}finally{activeLogins--;}
   if(!valid)return fail(res,401,'CREDENTIALS');
   for(const key of Object.keys(session))delete session[key];session.role='super-admin';session.email=cfg.email;session.version=cfg.version;session.csrf=randomBytes(24).toString('base64url');session.expiresAt=Date.now()+SESSION_SECONDS*1000;
   await session.save();return res.status(200).json({ok:true,next:safeNext(body.next,body.lang),expiresAt:session.expiresAt});
  }
  if(!authenticated(session,cfg))return fail(res,401,'UNAUTHENTICATED');
  if(!equal(req.headers['x-csrf-token'],session.csrf))return fail(res,403,'CSRF');
  if(body.action==='logout'){session.destroy();return res.status(200).json({ok:true});}
  return fail(res,404,'NOT_FOUND');
 }catch{return fail(res,503,'ADMIN_UNAVAILABLE');}
}
