create table if not exists public.ms_feeds (
  date date not null,
  theme text not null check (theme in ('ai', 'world', 'gh')),
  items jsonb not null default '[]'::jsonb,
  note text,
  generated_at timestamptz,
  model text,
  item_count integer not null default 0,
  fe_high integer not null default 0,
  fe_picks text[] not null default '{}',
  top_text text,
  updated_at timestamptz not null default now(),
  primary key (date, theme)
);
create table if not exists public.ms_summaries (
  date date primary key,
  headline text not null,
  highlight text,
  updated_at timestamptz not null default now()
);
alter table public.ms_feeds enable row level security;
alter table public.ms_summaries enable row level security;
-- 정책을 두지 않는다: 서비스 롤 키(서버)만 접근한다.
