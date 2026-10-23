import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {COOKIE,verify,equal} from './core.mjs';
export const privateHeaders={'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow, noarchive','Vary':'Cookie','Referrer-Policy':'no-referrer'};
export function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw Error('Storage unavailable');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function owner(){return verify((await cookies()).get(COOKIE)?.value,process.env.APPLICATION_DESK_SESSION_KEY);}
export function worker(request){const key=process.env.APPLICATION_DESK_WORKER_KEY;return !!key&&key.length>=32&&equal(request.headers.get('authorization'),`Bearer ${key}`);}
export function sameOrigin(request){const origin=request.headers.get('origin');const site=process.env.APPLICATION_DESK_ORIGIN||'https://andysantamaria.com';return origin===site;}
export const json=(body,status=200)=>NextResponse.json(body,{status,headers:privateHeaders});
export async function read(id='owner'){const {data,error}=await db().from('application_desk').select('version,data').eq('id',id).single();if(error)throw Error('Unable to load workspace');return data;}
export async function write(row,id='owner'){const {data,error}=await db().from('application_desk').update({data:row.data,version:row.version+1,updated_at:new Date().toISOString()}).eq('id',id).eq('version',row.version).select('version').maybeSingle();if(error)throw Error('Unable to save workspace');if(!data)throw Error('Workspace changed. Reload before saving.');return data.version;}
export async function body(request){const length=Number(request.headers.get('content-length')||0);if(length>100000)throw Error('Request too large');const text=await request.text();if(text.length>100000)throw Error('Request too large');return JSON.parse(text);}
