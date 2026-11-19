import { memo, type ReactNode, useId, useState } from 'react'
import type { AiItem, Feeds, GhItem, Theme, WorldItem } from '../../../api/morning-signal'
import Card from './Card'
import { feedRows, TAB_LABEL, tabCount } from './model'

const ORDER: readonly Theme[] = ['ai', 'world', 'gh']

const EMPTY_TEXT: Record<Theme, { none: string; miss: string }> = {
  ai: { none: '검증된 AI 뉴스가 없는 날이에요.', miss: '이 날짜의 AI 뉴스를 가져오지 못했어요.' },
  world: {
    none: '검증된 시사·경제·상식 뉴스가 없는 날이에요.',
    miss: '이 날짜의 시사·경제·상식 뉴스를 가져오지 못했어요.',
  },
  gh: {
    none: '정리된 GitHub 트렌딩이 없는 날이에요.',
    miss: '이 날짜의 GitHub 트렌딩을 아직 가져오지 못했어요.',
  },
}

type Row = ReturnType<typeof feedRows>[number]

interface LineView {
  /** 왼쪽 종류 칩 */
  tag: ReactNode
  /** 오른쪽 정보 — AI: FE 영향 / World: 분야 / GitHub: ★ 또는 FE 높음 칩 */
  side: ReactNode
  meta: string
  noteLabel: string
  linkLabel: string
}

/** 시안 news.js row() — 테마마다 다른 칩·오른쪽 정보·펼침 문구 */
function lineView(theme: Theme, row: Row, item: AiItem | WorldItem | GhItem | undefined): LineView {
  if (theme === 'gh') {
    const g = item as GhItem | undefined
    return {
      tag: <span className="chip gh num">{`GH ${String(g?.rank ?? '').padStart(2, '0')}`}</span>,
      side:
        g?.impact === 'high' ? (
          <span className="chip h">FE 높음</span>
        ) : g?.stars ? (
          `★ ${g.stars}`
        ) : null,
      meta: [g?.language, g?.stars && `★ ${g.stars}`, g?.starsToday && `오늘 ${g.starsToday}`]
        .filter(Boolean)
        .join(' · '),
      noteLabel: 'FE에 쓸 곳',
      linkLabel: 'GitHub에서 보기',
    }
  }
  return {
    tag:
      theme === 'ai' ? (
        <span className="chip ai">AI</span>
      ) : (
        <span className="chip world">World</span>
      ),
    // feedRows 의 칩 글자가 곧 AI `FE 높음/중간/낮음` · World 분야다
    side: row.chip?.text ?? null,
    meta: [row.meta, row.grade && `검증 ${row.grade}`].filter(Boolean).join(' · '),
    noteLabel: 'FE',
    linkLabel: '원문 보기',
  }
}

/** 한 줄 — 누르면 요약 · FE 메모 · 원문 링크가 펼쳐진다(시안 `.lines details`) */
function Line({ row, v }: { row: Row; v: LineView }) {
  const empty = !row.summary && !row.impactNote && !v.meta && !row.link
  return (
    <li>
      <details>
        <summary>
          {v.tag}
          <span className="t">{row.title}</span>
          {v.side && <span className="m">{v.side}</span>}
        </summary>
        <div className="more">
          {row.summary && <p>{row.summary}</p>}
          {row.impactNote && (
            <p>
              <b>{v.noteLabel}</b> {row.impactNote}
            </p>
          )}
          {v.meta && <p>{v.meta}</p>}
          {row.link && (
            <a href={row.link.href} target="_blank" rel="noopener">
              {v.linkLabel}
            </a>
          )}
          {empty && <p>추가 정보가 없어요.</p>}
        </div>
      </details>
    </li>
  )
}

interface FeedProps {
  feeds: Feeds
  /** 화면에 띄운 날짜(데이터 기준) */
  date: string
  /** 날짜를 옮긴 방향 — 목록이 같은 쪽으로 미끄러진다 */
  dir: number
  /** 고른 탭 — 라우트가 들고 있어 날짜를 옮겨도 남고, 오늘의 한 줄 칸에서도 바꾼다 */
  tab: Theme
  onTab: (t: Theme) => void
}

interface Slide {
  tab: Theme
  date: string
  /** 마지막으로 목록을 바꾼 움직임의 방향(탭 순서 또는 날짜 순서) */
  dir: number
}

/** 소식 — 탭 AI · World · GitHub + 줄 목록. 시안 grid.css `.seg`·`.lines`·`.more` */
function Feed({ feeds, date, dir, tab, onTab }: FeedProps) {
  const [st, setSt] = useState<Slide>({ tab, date, dir: 0 })
  // 날짜가 바뀌면 그 이동 방향, 탭이 바뀌면 탭 순서 방향으로 미끄러진다(렌더 중 setState — 이전 렌더 정보로 맞추는 React 권장 패턴)
  if (st.tab !== tab || st.date !== date) {
    setSt({
      tab,
      date,
      dir: st.date !== date ? dir : ORDER.indexOf(tab) < ORDER.indexOf(st.tab) ? -1 : 1,
    })
  }
  const ids = useId()
  const feed = feeds[tab]
  const rows = feedRows(tab, feed)
  const slide = st.dir < 0 ? ' sl' : st.dir > 0 ? ' sr' : ''

  const tabs = (
    <div className="seg" role="tablist" aria-label="소식 테마">
      {ORDER.map((k) => {
        const c = tabCount(feeds[k])
        return (
          <button
            key={k}
            type="button"
            role="tab"
            id={`${ids}-${k}`}
            aria-selected={k === tab}
            aria-controls={`${ids}-panel`}
            onClick={() => onTab(k)}
          >
            {TAB_LABEL[k]} <em className={c.bad ? 'bad' : undefined}>{c.text}</em>
          </button>
        )
      })}
    </div>
  )

  return (
    <Card area="feed" title="소식" aux={tabs} className="top-r">
      <div role="tabpanel" id={`${ids}-panel`} aria-labelledby={`${ids}-${tab}`}>
        {rows.length === 0 ? (
          <p className="empty">
            {feed
              ? `${EMPTY_TEXT[tab].none}${feed.note ? ` ${feed.note}` : ''}`
              : EMPTY_TEXT[tab].miss}
          </p>
        ) : (
          // key: 날짜·탭이 바뀔 때마다 새로 그려 펼침 상태를 닫고 미끄러짐을 처음부터 다시 돈다
          <ul className={`lines${slide}`} key={`${date}|${tab}|${feed?.generatedAt ?? ''}`}>
            {rows.map((row, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: 순번이 곧 행의 정체성이다
              <Line key={i} row={row} v={lineView(tab, row, feed?.items[i])} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

export default memo(Feed)
