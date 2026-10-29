-- PIN 시도 제한(범용) — Supabase SQL Editor 에서 실행한다. 여러 번 실행해도 된다.
-- 쓰는 곳: api/otp.ts (scope 'otp'). 이 함수가 없으면 API 는 제한 없이 동작하고 서버 로그에 경고를 남긴다.
--
-- 5번 틀리면 잠근다. 잠글 때마다 시간이 두 배로 늘어난다(10분 → 20분 → 40분 … 최대 24시간).
-- 맞히면 횟수와 잠금 단계를 모두 초기화한다. 잠금 중에는 맞는 PIN 도 거절한다.
-- 「잠겨 있나」 판정과 「성공/실패 기록」을 행 잠금(for update) 한 트랜잭션에서 해서,
-- 동시에 보낸 요청들이 다섯 번째 실패가 기록되기 전에 판정을 통과하는 우회가 없다.

create table if not exists public.pin_attempts (
  scope text primary key,
  fails integer not null default 0,
  lock_count integer not null default 0,
  locked_until timestamptz
);

alter table public.pin_attempts enable row level security;
-- 정책을 두지 않는다: 서비스 롤 키(서버)만 접근한다.
grant select, insert, update, delete on public.pin_attempts to service_role;

create or replace function public.pin_attempt(p_scope text, ok boolean)
returns table (allowed boolean, fail_count integer, lock_until timestamptz)
language plpgsql
as $$
declare
  r public.pin_attempts%rowtype;
  next_lock timestamptz;
begin
  insert into public.pin_attempts (scope) values (p_scope) on conflict do nothing;
  select * into r from public.pin_attempts where scope = p_scope for update;
  if r.locked_until is not null and r.locked_until > now() then
    return query select false, r.fails, r.locked_until;
  elsif ok then
    update public.pin_attempts set fails = 0, lock_count = 0, locked_until = null where scope = p_scope;
    return query select true, 0, null::timestamptz;
  elsif r.fails + 1 >= 5 then
    next_lock := now() + least(interval '10 minutes' * power(2, least(r.lock_count, 8)), interval '24 hours');
    update public.pin_attempts
      set fails = 0, lock_count = r.lock_count + 1, locked_until = next_lock
      where scope = p_scope;
    return query select true, 0, next_lock;
  else
    update public.pin_attempts set fails = r.fails + 1 where scope = p_scope;
    return query select true, r.fails + 1, null::timestamptz;
  end if;
end;
$$;
-- 함수 실행 권한은 기본이 PUBLIC 이다 — 서버(service_role)만 부르게 막는다
revoke execute on function public.pin_attempt(text, boolean) from public, anon, authenticated;
grant execute on function public.pin_attempt(text, boolean) to service_role;
