import type { CSSProperties } from 'react'
import type { Feeds, Impact } from '../../../api/morning-signal'
import Card, { Ticks } from './Card'
import { mixModel, TAB_LABEL } from './model'

type CssVars = CSSProperties & Record<`--${string}`, string>

const IMPACT_ROWS: readonly { key: Impact; label: string; color: string }[] = [
  { key: 'high', label: '높음', color: 'var(--hot)' },
  { key: 'mid', label: '중간', color: 'var(--ai)' },
  { key: 'low', label: '낮음', color: 'var(--muted)' },
]

/**
 * 오늘의 구성 — 한 칸이 한 건인 눈금(AI · World · GitHub 색) + 범례 + 「FE 영향도」 높음·중간·낮음 눈금(AI+GitHub 기준).
 * 총 건수는 제목 줄 오른쪽에 크게. 시안 grid.css `.ticks`·`.legend`·`.meter`.
 */
export default function Mix({ feeds }: { feeds: Feeds }) {
  const m = mixModel(feeds)
  // 영향도 눈금의 전체 칸 수 = 영향도를 매기는 항목 수(AI + GitHub)
  const pool = m.impact.high + m.impact.mid + m.impact.low
  return (
    <Card
      area="mix"
      title="오늘의 구성"
      aux={
        <span className="cnt big">
          {m.total}
          <small>건</small>
        </span>
      }
    >
      <Ticks parts={m.parts.map((p) => [p.count, `var(--${p.theme})`] as const)} />
      <ul className="legend">
        {m.parts.map((p) => {
          const dot: CssVars = { '--c': `var(--${p.theme})` }
          return (
            <li key={p.theme}>
              <i style={dot} />
              {TAB_LABEL[p.theme]}
              <b>{p.count}</b>
            </li>
          )
        })}
      </ul>
      <h3 className="sub">FE 영향도</h3>
      {IMPACT_ROWS.map((r) => {
        const n = m.impact[r.key]
        return (
          <div className="meter" key={r.key}>
            <span>{r.label}</span>
            <Ticks
              parts={[
                [n, r.color],
                [pool - n, 'var(--tick)'],
              ]}
            />
            <b>{n}</b>
          </div>
        )
      })}
    </Card>
  )
}
