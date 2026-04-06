-- Growity Creative Analyzer — Supabase Schema
-- Supabase dashboard > SQL Editor'da çalıştır

create table if not exists analyses (
  id            uuid default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  creative_name text not null,
  client_name   text,
  notes         text,
  file_type     text,
  roi_scores    jsonb,
  n_timesteps   integer,
  processing_seconds numeric,
  status        text
);

-- Dashboard için index
create index on analyses (created_at desc);
create index on analyses (client_name);

-- RLS: herkese okuma/yazma (geliştirme için, sonra kısıtla)
alter table analyses enable row level security;
create policy "allow all" on analyses for all using (true);
