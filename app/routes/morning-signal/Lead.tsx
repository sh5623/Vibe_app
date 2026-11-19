import type { CSSProperties } from 'react'
import type { DaySummary, Feeds, Theme } from '../../../api/morning-signal'
import Card from './Card'
import { deriveTops, headlineParts, TAB_LABEL } from './model'

type CssVars = CSSProperties & Record<`--${string}`, string>

const THEMES: readonly Theme[] = ['ai', 'world', 'gh']

interface LeadProps {
  day: DaySummary
  feeds: Feeds
  /** 테마별 첫 소식 칸을 눌렀을 때 — 소식 탭을 그 테마로 바꾼다 */
  onPick: (t: Theme) => void
}

/**
 * 오늘의 한 줄 — 호박색 짧은 선 + 남색 큰 제목(강조 구절에 밑줄 표시) + 아래 3칸 「AI · World · GitHub의 첫 소식」.
 * 시안 views.css `.p.lead`·`.headline`·`.tops`. 요약 문단은 두지 않는다(11/19 결정).
 */
export default function Lead({ day, feeds, onPick }: LeadProps) {
  const p = headlineParts(day.headline ?? null, day.highlight ?? null)
  const tops = deriveTops(feeds)
  return (
    <Card area="head" title="오늘의 한 줄" className="lead">
      {p ? (
        <p className="headline">
          {p.before}
          {p.mark && <mark>{p.mark}</mark>}
          {p.after}
        </p>
      ) : (
        <p className="headline none">오늘의 한 줄이 아직 없어요.</p>
      )}
      <div className="tops">
        {THEMES.map((t) => {
          const feed = feeds[t]
          const text = feed ? tops.find((x) => x.theme === t)?.text : undefined
          const dot: CssVars = { '--c': `var(--${t})` }
          return (
            <button
              key={t}
              type="button"
              className="top-cell"
              data-theme={t}
              onClick={() => onPick(t)}
            >
              <span className="tl">
                <i style={dot} />
                {TAB_LABEL[t]}
                {feed && <b className="num">{feed.items.length}</b>}
              </span>
              <span className={text ? 'tt' : 'tt none'}>{text ?? '아직 없음'}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
