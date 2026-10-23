import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useMsDay, useMsDays } from '@/hooks/use-morning-signal'
import type { Route } from './+types/morning-signal'
import Bento from './morning-signal/Bento'
import Feed from './morning-signal/Feed'
import Header from './morning-signal/Header'
import Kpis from './morning-signal/Kpis'
import { pickInitialDate, stampText } from './morning-signal/model'
import Shell from './morning-signal/Shell'

const EMPTY = { title: '아직 저장된 뉴스가 없어요', text: '평일 아침 8시에 첫 브리핑이 들어와요.' }
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
  const stamp = view ? stampText(view.day, view.feeds) : '불러오는 중'

  return (
    <Shell>
      <Header days={days ?? []} cur={cur} dir={sel?.dir ?? 0} stamp={stamp} onGo={go} />
      {state && (
        <section className="card state">
          <b>{state.title}</b>
          <span>{state.text}</span>
        </section>
      )}
      {!state && days && view && (
        <div className="content">
          <Kpis days={days} day={view.day} feeds={view.feeds} />
          <Bento day={view.day} feeds={view.feeds} />
          <Feed feeds={view.feeds} date={view.day.date} dir={sel?.dir ?? 0} />
        </div>
      )}
    </Shell>
  )
}
