-- Morning Signal TO-DO 탭 스키마 — Supabase SQL Editor에서 실행한다.
-- 여러 번 실행해도 된다(if not exists · on conflict · create or replace).
-- 설계: docs/superpowers/specs/2026-10-23-morning-signal-todo-design.md §5.1

create table if not exists public.ms_todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text check (body is null or char_length(body) <= 4000),
  link text check (link is null or char_length(link) <= 2000),
  due_date date,
  due_time time,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  attachments jsonb not null default '[]'::jsonb,
  created_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at timestamptz,
  check (due_time is null or due_date is not null)
);
create index if not exists ms_todos_created on public.ms_todos (created_at desc, id desc);
create index if not exists ms_todos_open on public.ms_todos (status) where status <> 'done';

-- 잠금 시도 횟수(행 하나)
create table if not exists public.ms_todo_auth (
  id smallint primary key default 1 check (id = 1),
  fails integer not null default 0,
  locked_until timestamptz
);
insert into public.ms_todo_auth (id) values (1) on conflict do nothing;

alter table public.ms_todos enable row level security;
alter table public.ms_todo_auth enable row level security;
-- 정책을 두지 않는다: 서비스 롤 키(서버)만 접근한다.
grant select, insert, update, delete on public.ms_todos, public.ms_todo_auth to service_role;

-- 틀린 PIN 한 번 — 횟수 올리기와 잠금 걸기를 한 번의 update로 한다(동시 요청에도 어긋나지 않는다).
-- 5번째 실패면 횟수를 0으로 되돌리고 10분 잠근다.
create or replace function public.ms_todo_fail()
returns public.ms_todo_auth
language sql
as $$
  update public.ms_todo_auth
     set fails = case when fails + 1 >= 5 then 0 else fails + 1 end,
         locked_until = case when fails + 1 >= 5 then now() + interval '10 minutes' else locked_until end
   where id = 1
  returning *;
$$;
grant execute on function public.ms_todo_fail() to service_role;

-- 비공개 첨부 버킷(파일당 10MB, 사진·PDF만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ms-todo', 'ms-todo', false, 10485760, array['image/*', 'application/pdf'])
on conflict (id) do nothing;
