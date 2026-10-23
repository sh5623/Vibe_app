import { type CSSProperties, memo, useId } from 'react'
import type { DaySummary, Feeds } from '../../../api/morning-signal'
import { COLOR, chipFor, type Kpi, type KpiKey, kpiModel, mdDot, sparkPath } from './model'
import Odometer from './Odometer'

type CssVars = CSSProperties & Record<`--${string}`, string | number>

const ROWS: readonly { key: KpiKey; label: string; unit: string }[] = [
  { key: 'total', label: '전체', unit: '건' },
  { key: 'ai', label: 'AI 뉴스', unit: '건' },
  { key: 'world', label: '시사·경제·상식', unit: '건' },
  { key: 'gh', label: 'GitHub 트렌딩', unit: '개' },
]

const HIDDEN_CHIP = { show: false, zero: false, text: '' } as const

function Arrow() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true">
      <path d="M5 1 L9 7 H1 Z" fill="currentColor" />
    </svg>
  )
}

/** 스파크라인 — 레퍼런스 sparkSvg. 부모가 key 로 다시 만들어 그릴 때마다 선이 새로 그어진다. */
function Spark({ vals, color, gid }: { vals: number[]; color: string; gid: string }) {
  const p = sparkPath(vals)
  const style: CssVars = { '--len': p.len }
  return (
    <svg
      className="spark"
      viewBox="0 0 220 36"
      preserveAspectRatio="none"
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="a" d={p.area} fill={`url(#${gid})`} />
      <path className="l" d={p.line} stroke={color} />
      <circle
        className="p"
        cx={p.end[0].toFixed(1)}
        cy={p.end[1].toFixed(1)}
        r="3.2"
        fill={color}
        stroke="var(--card)"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function Delta({ kpi }: { kpi: Kpi }) {
  if (kpi.delta === null || kpi.prevDate === null) {
    return (
      <span className="delta flat" title="비교할 이전 날짜가 없어요">
        —
      </span>
    )
  }
  const dv = kpi.delta
  return (
    <span
      className={`delta ${dv > 0 ? 'up' : dv < 0 ? 'down' : 'flat'}`}
      title={`${mdDot(kpi.prevDate)} 대비`}
    >
      <Arrow />
      {`${dv > 0 ? '+' : ''}${dv}`}
    </span>
  )
}

interface KpisProps {
  days: DaySummary[]
  /** 화면에 띄운 날짜(데이터 기준 — 새 날짜를 받는 동안은 직전 날짜) */
  day: DaySummary
  feeds: Feeds
}

/** KPI 4장 — 레퍼런스 buildKpis·renderKpis(438–470행). */
function Kpis({ days, day, feeds }: KpisProps) {
  const gid = useId()
  const model = kpiModel(days, day.date, feeds)
  // 레퍼런스는 render() 마다 스파크라인을 새로 만든다 — 날짜·갱신 시각이 바뀌면 다시 그린다
  const token = `${day.date}|${day.updatedAt ?? ''}`

  return (
    <section className="kpis">
      {ROWS.map(({ key, label, unit }, j) => {
        const k = model[key]
        const chip = key === 'total' ? HIDDEN_CHIP : chipFor(feeds[key])
        const style: CssVars = { '--d': `${60 + j * 70}ms` }
        return (
          <article key={key} className="card kpi" data-kpi={key} style={style}>
            <div className="lab">
              <i style={{ background: COLOR[key] }} />
              {label}
              <span className={chip.zero ? 'kchip zero' : 'kchip'} hidden={!chip.show}>
                {chip.text}
              </span>
            </div>
            <div className="row">
              <div className="num">
                <Odometer value={k.value} id={`k-${key}`} />
                <small>{unit}</small>
              </div>
              <Delta kpi={k} />
            </div>
            <div>
              <Spark key={token} vals={k.series} color={COLOR[key]} gid={`${gid}-${key}`} />
            </div>
            <div className="sub">
              {`${k.prevDate ? `${mdDot(k.prevDate)} 대비 · ` : ''}최근 ${k.series.length}일 범위 ${k.min}–${k.max}`}
            </div>
          </article>
        )
      })}
    </section>
  )
}

// 라우트가 날짜를 옮기는 동안(직전 데이터 유지) 다시 렌더돼도 숫자가 다시 구르지 않게 데이터가 바뀔 때만 그린다
export default memo(Kpis)
