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

-- PIN 시도 한 번 — 「잠겨 있나」 판정과 「성공/실패 기록」을 행 잠금(for update) 한 트랜잭션에서 한다.
-- 둘을 따로 하면 동시에 보낸 요청들이 다섯 번째 실패가 기록되기 전에 모두 판정을 통과한다(무차별 대입 우회).
-- 서버는 PIN 을 직접 비교하고 결과(ok)만 넘긴다. allowed=false 면 잠금 중이라 이번 시도는 무시됐다.
-- 5번째 실패면 횟수를 0으로 되돌리고 10분 잠근다.
drop function if exists public.ms_todo_fail();
create or replace function public.ms_todo_attempt(ok boolean)
returns table (allowed boolean, fail_count integer, lock_until timestamptz)
language plpgsql
as $$
declare
  r public.ms_todo_auth%rowtype;
begin
  insert into public.ms_todo_auth (id) values (1) on conflict do nothing;
  select * into r from public.ms_todo_auth where id = 1 for update;
  if r.locked_until is not null and r.locked_until > now() then
    return query select false, r.fails, r.locked_until;
  elsif ok then
    update public.ms_todo_auth set fails = 0, locked_until = null where id = 1;
    return query select true, 0, null::timestamptz;
  elsif r.fails + 1 >= 5 then
    update public.ms_todo_auth set fails = 0, locked_until = now() + interval '10 minutes' where id = 1;
    return query select true, 0, now() + interval '10 minutes';
  else
    update public.ms_todo_auth set fails = r.fails + 1 where id = 1;
    return query select true, r.fails + 1, null::timestamptz;
  end if;
end;
$$;
-- 함수 실행 권한은 기본이 PUBLIC 이다 — 서버(service_role)만 부르게 막는다
revoke execute on function public.ms_todo_attempt(boolean) from public, anon, authenticated;
grant execute on function public.ms_todo_attempt(boolean) to service_role;

-- 비공개 첨부 버킷(파일당 10MB, 사진·PDF만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ms-todo', 'ms-todo', false, 10485760, array['image/*', 'application/pdf'])
on conflict (id) do nothing;
