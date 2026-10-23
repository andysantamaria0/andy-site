import {NextResponse} from 'next/server';
import {db,json,sameOrigin,body,privateHeaders} from '../../../../lib/applications/server';
import {COOKIE,TTL,checkPassword,session,hash} from '../../../../lib/applications/core.mjs';
export const runtime='nodejs';
export async function POST(request){
 if(!sameOrigin(request))return json({error:'Origin rejected'},403);
 try{
  const ip=request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'local';
  const key=hash(ip.split(',')[0]+(process.env.APPLICATION_DESK_SESSION_KEY||''));
  const {data:allowed,error}=await db().rpc('application_desk_login_limit',{attempt_key:key});
  if(error||!allowed)return json({error:'Too many attempts. Try again in 15 minutes.'},429);
  const input=await body(request);
  if(!checkPassword(input.password,process.env.APPLICATION_DESK_PASSWORD_HASH))return json({error:'Incorrect password'},401);
  const response=NextResponse.json({ok:true},{headers:privateHeaders});response.cookies.set(COOKIE,session(process.env.APPLICATION_DESK_SESSION_KEY),{httpOnly:true,secure:process.env.APPLICATION_DESK_ORIGIN?.startsWith('https:')!==false,sameSite:'strict',path:'/',maxAge:TTL});return response;
 }catch{return json({error:'Sign-in is temporarily unavailable'},503);}
}
export async function DELETE(request){if(!sameOrigin(request))return json({error:'Origin rejected'},403);const response=json({ok:true});response.cookies.set(COOKIE,'',{httpOnly:true,secure:process.env.APPLICATION_DESK_ORIGIN?.startsWith('https:')!==false,sameSite:'strict',path:'/',maxAge:0});return response;}
