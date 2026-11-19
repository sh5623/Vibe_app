import type { CSSProperties, ReactNode } from 'react'
import type { Feed, GhItem } from '../../../api/morning-signal'
import Card from './Card'
import { fePicks, safeUrl } from './model'

type CssVars = CSSProperties & Record<`--${string}`, string>

// 시안 data.js langVar — 목록에 없는 언어는 Shell 색
const LANG: Record<string, string> = {
  TypeScript: 'var(--lang-ts)',
  JavaScript: 'var(--lang-js)',
  Python: 'var(--lang-py)',
  Go: 'var(--lang-go)',
  Shell: 'var(--lang-sh)',
}

interface FePicksProps {
  feed: Feed<'gh'> | undefined
  /** 「＋ TO-DO」 담기 버튼 자리 — Task 6 에서 채운다(지금은 아무것도 그리지 않는다) */
  renderAdd?: (g: GhItem) => ReactNode
}

/** FE에 쓸 레포 — GitHub 중 FE 영향 높음, 오늘 별 증가 많은 순. 시안 views.css `.picks`·`.pk-*` */
export default function FePicks({ feed, renderAdd }: FePicksProps) {
  const picks = fePicks(feed)
  return (
    <Card
      area="trend"
      title="FE에 쓸 레포"
      aux={picks.length > 0 ? <span className="cnt">{picks.length}</span> : null}
    >
      {picks.length === 0 ? (
        <p className="empty">오늘은 FE 영향이 높은 레포가 없어요</p>
      ) : (
        <ul className="picks">
          {picks.map((g) => {
            const href = safeUrl(g.url) ?? `https://github.com/${g.repo}`
            const dot: CssVars = { '--c': (g.language && LANG[g.language]) || 'var(--lang-sh)' }
            return (
              <li key={g.repo}>
                <div className="pk-h">
                  <a className="num" href={href} target="_blank" rel="noopener">
                    {g.repo}
                  </a>
                  <span className="chip h">FE 높음</span>
                </div>
                {g.impactNote && <p>{g.impactNote}</p>}
                <div className="pk-f">
                  {g.language && (
                    <span className="lang">
                      <i style={dot} />
                      {g.language}
                    </span>
                  )}
                  {g.stars && <span className="num">★ {g.stars}</span>}
                  {g.starsToday && <span className="num up">{g.starsToday} 오늘</span>}
                  {renderAdd?.(g)}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
