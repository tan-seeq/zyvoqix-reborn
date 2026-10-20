import {scrypt, timingSafeEqual, createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {getIronSession} from 'iron-session';
const derive=promisify(scrypt);
export const SESSION_SECONDS=4*60*60;
export const cookieName='__Host-zyvoqix_admin';
export function config(env=process.env){
 const account=JSON.parse(env.ZYVOQIX_ADMIN_ACCOUNT||'null');
 if(!account||typeof account.email!=='string'||!account.email.includes('@')||!/^\w{32}$/.test(account.salt)||!/^[a-f0-9]{128}$/.test(account.hash)||typeof env.ZYVOQIX_ADMIN_SESSION_SECRET!=='string'||env.ZYVOQIX_ADMIN_SESSION_SECRET.length<48)throw Error('ADMIN_UNCONFIGURED');
 return {...account,email:account.email.trim().toLowerCase(),secret:env.ZYVOQIX_ADMIN_SESSION_SECRET,version:createHash('sha256').update(account.email.toLowerCase()+account.hash).digest('hex')};
}
export function equal(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export async function verifyCredentials(email,password,cfg){
 if(typeof email!=='string'||email.length>254||typeof password!=='string'||password.length>128||password.length<1)return false;
 const candidate=await derive(password,cfg.salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 return equal(candidate.toString('hex'),cfg.hash)&&email.trim().toLowerCase()===cfg.email;
}
export function openSession(req,res,cfg){return getIronSession(req,res,{password:cfg.secret,cookieName,ttl:SESSION_SECONDS,cookieOptions:{secure:true,httpOnly:true,sameSite:'strict',path:'/'}});}
export function authenticated(s,cfg,now=Date.now()){return s?.role==='super-admin'&&s.email===cfg.email&&s.version===cfg.version&&typeof s.csrf==='string'&&s.csrf.length===32&&Number.isFinite(s.expiresAt)&&s.expiresAt>now&&s.expiresAt<=now+SESSION_SECONDS*1000;}
export function sameOrigin(req){try{return req.headers.origin===new URL('https://'+req.headers.host).origin&&req.headers['sec-fetch-site']!=='cross-site';}catch{return false;}}
export function adminPath(lang='en',view='dashboard'){return (lang==='ar'?'/ar':'')+'/super-admin/'+(view==='backup'?'backup/':'');}
export function loginPath(lang='en',view='dashboard'){return (lang==='ar'?'/ar':'')+'/admin/login/?next='+encodeURIComponent(adminPath(lang,view));}
export function safeNext(value,lang='en'){return ['/super-admin/','/super-admin/backup/','/ar/super-admin/','/ar/super-admin/backup/'].includes(value)?value:adminPath(lang);}
// Per-instance backstop: no external store is provisioned. Never trust client-supplied IP lists.
export function createLoginLimiter({windowMs=10*60*1000,limit=8,totalLimit=80,maxKeys=2000}={}){
 const entries=new Map();let total={start:0,count:0};
 return function take(key,now=Date.now()){
  for(const [k,v]of entries)if(now-v.start>=windowMs)entries.delete(k);
  if(now-total.start>=windowMs)total={start:now,count:0};
  if(!entries.has(key)&&entries.size>=maxKeys)return false;
  const item=entries.get(key)||{start:now,count:0};entries.set(key,item);
  if(item.count>=limit||total.count>=totalLimit)return false;
  item.count++;total.count++;return true;
 };
}
