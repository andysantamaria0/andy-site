-- Brown Glove waitlist signups
-- Additive: new isolated table, no references to existing schema.

create table if not exists brown_glove_waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  neighborhood text,
  role text,
  note text,
  source text not null default 'brown-glove-waitlist',
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists brown_glove_waitlist_email_idx on brown_glove_waitlist (lower(email));
create index if not exists brown_glove_waitlist_created_idx on brown_glove_waitlist (created_at desc);
