create table if not exists public.application_desk (
 id text primary key, version bigint not null default 1, data jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.application_desk enable row level security;
revoke all on public.application_desk from anon, authenticated;
grant all on public.application_desk to service_role;
create table if not exists public.application_desk_login_attempts (
 key text primary key, attempts integer not null, window_start timestamptz not null
);
alter table public.application_desk_login_attempts enable row level security;
revoke all on public.application_desk_login_attempts from anon, authenticated;
grant all on public.application_desk_login_attempts to service_role;
create or replace function public.application_desk_login_limit(attempt_key text) returns boolean
 language plpgsql security definer set search_path=public as $$
declare total integer;
begin
 delete from application_desk_login_attempts where window_start < now()-interval '1 day';
 insert into application_desk_login_attempts(key,attempts,window_start) values(attempt_key,1,now())
 on conflict(key) do update set
 attempts=case when application_desk_login_attempts.window_start < now()-interval '15 minutes' then 1 else application_desk_login_attempts.attempts+1 end,
 window_start=case when application_desk_login_attempts.window_start < now()-interval '15 minutes' then now() else application_desk_login_attempts.window_start end
 returning attempts into total;
 return total <= 10;
end $$;
revoke all on function public.application_desk_login_limit(text) from public,anon,authenticated;
grant execute on function public.application_desk_login_limit(text) to service_role;
insert into storage.buckets(id,name,public) values('application-desk-private','application-desk-private',false) on conflict(id) do update set public=false;

notify pgrst, 'reload schema';
