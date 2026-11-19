import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import LatticeLoader from '@/components/react-bits/LatticeLoader'
import { useMsDay, useMsDays } from '@/hooks/use-morning-signal'
import type { Theme } from '../../api/morning-signal'
import type { Route } from './+types/morning-signal'
import Alerts from './morning-signal/Alerts'
import Feed from './morning-signal/Feed'
import FePicks from './morning-signal/FePicks'
import { DateNav } from './morning-signal/Header'
import Lead from './morning-signal/Lead'
import Mix from './morning-signal/Mix'
import { alertItems, pickInitialDate } from './morning-signal/model'
import { useMsLayout } from './morning-signal-layout'

const EMPTY = { title: '아직 저장된 뉴스가 없어요', text: '매일 아침 8시에 첫 브리핑이 들어와요.' }
const ERROR = { title: '데이터를 불러오지 못했어요', text: '잠시 뒤 새로고침해 주세요.' }

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Morning Signal | Vibe' }]
}

interface Selection {
  date: string
  dir: -1 | 0 | 1
}

export default function MorningSignal() {
  const navigate = useNavigate()
  const daysQ = useMsDays()
  const days = daysQ.data
  const [sel, setSel] = useState<Selection | null>(null)

  // 처음 한 번은 해시가 가리키는 날짜(없으면 최신)로 정하고, 이후 목록에서 사라지면 최신으로 옮긴다.
  // 렌더 중 setState — 이전 렌더 정보로 상태를 맞추는 React 권장 패턴(커밋 전에 다시 렌더된다).
  const last = days?.at(-1)
  if (days && last) {
    const next: Selection | null =
      sel === null
        ? { date: pickInitialDate(days, window.location.hash.slice(1)) ?? last.date, dir: 0 }
        : days.some((d) => d.date === sel.date)
          ? sel
          : { date: last.date, dir: 0 }
    if (next !== sel) setSel(next)
  }
  const cur = sel?.date ?? null

  // 날짜가 바뀔 때마다 해시를 맞춘다(레퍼런스 history.replaceState — 스크롤은 건드리지 않는다)
  useEffect(() => {
    if (cur && window.location.hash !== `#${cur}`) {
      navigate({ hash: cur }, { replace: true, preventScrollReset: true })
    }
  }, [cur, navigate])

  const go = (date: string) => {
    if (!days || !cur || date === cur || !days.some((d) => d.date === date)) return
    setSel({ date, dir: date < cur ? -1 : 1 })
  }

  // 목록의 updatedAt 이 바뀌면 키가 바뀌어 그날 상세를 새로 받는다(레퍼런스 lastStamp)
  const curDay = days?.find((d) => d.date === cur)
  const dayQ = useMsDay(curDay ? curDay.date : null, curDay?.updatedAt)
  // 날짜를 옮기는 동안은 직전 날짜의 상세가 placeholder 로 남는다 — 화면은 view.day.date 기준으로 그린다
  const view = dayQ.data

  // TanStack v5 는 백그라운드 재조회가 실패해도 data 를 남긴 채 isError 를 켠다.
  // 보여 줄 데이터가 없을 때만 오류 카드를 띄우고, 이미 그린 화면은 그대로 둔다.
  const failed = (daysQ.isError && !days) || (dayQ.isError && !view)
  const state = failed ? ERROR : days?.length === 0 ? EMPTY : null

  // 날짜 이동은 상단 막대 오른쪽 칸으로 포털
  const { dateSlot } = useMsLayout()

  // 소식 탭 — 날짜를 옮겨도 남는다. 오늘의 한 줄 칸을 누르면 그 테마로 바꾸고 소식 카드로 스크롤한다
  const [tab, setTab] = useState<Theme>('ai')
  const pickTheme = (t: Theme) => {
    setTab(t)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    document
      .querySelector('.ms-grid > [data-area="feed"]')
      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <>
      {dateSlot &&
        createPortal(
          <DateNav days={days ?? []} cur={cur} dir={sel?.dir ?? 0} onGo={go} />,
          dateSlot
        )}
      {state && (
        <section className="card state">
          <b>{state.title}</b>
          <span>{state.text}</span>
        </section>
      )}
      {/* 첫 로딩 — 「신호 수신 중」(react-bits LatticeLoader · 초시계) */}
      {!state && !(days && view) && (
        <section className="ms-loading">
          <LatticeLoader label="신호 수신 중" grid={4} pattern="sweep" cellSize={6} gap={3} />
        </section>
      )}
      {/* NEWS 격자(B안 §4) — 데스크톱 1행 챙길 것 | 오늘의 한 줄 | 오늘의 구성, 2행 소식(2칸) | FE에 쓸 레포.
          DOM 은 오늘의 한 줄을 먼저 둔다(휴대폰 첫 카드 · 화면 읽기 순서) — 자리는 grid-area 가 정한다 */}
      {!state && days && view && (
        <div className="ms-grid">
          <Lead day={view.day} feeds={view.feeds} onPick={pickTheme} />
          {/* 마감 임박 할 일(due)은 Task 6 에서 잠금 세션 조회로 붙인다 */}
          <Alerts items={alertItems(view.feeds)} />
          <Mix feeds={view.feeds} />
          <Feed
            feeds={view.feeds}
            date={view.day.date}
            dir={sel?.dir ?? 0}
            tab={tab}
            onTab={setTab}
          />
          <FePicks feed={view.feeds.gh} />
        </div>
      )}
    </>
  )
}
