import { type CSSProperties, memo, useLayoutEffect, useRef, useState } from 'react'
import type { Feeds, Theme } from '../../../api/morning-signal'
import { COLOR, feedRows, tabCount } from './model'

type CssVars = CSSProperties & Record<`--${string}`, string | number>

const TABS: readonly { key: Theme; label: string }[] = [
  { key: 'ai', label: 'AI 뉴스' },
  { key: 'world', label: '시사·경제·상식' },
  { key: 'gh', label: 'GitHub' },
]
const ORDER: readonly Theme[] = ['ai', 'world', 'gh']
const EMPTY_LABEL: Record<Theme, string> = {
  ai: 'AI 뉴스',
  world: '시사·경제·상식 뉴스',
  gh: 'GitHub 트렌딩',
}

interface FeedProps {
  feeds: Feeds
  /** 화면에 띄운 날짜(데이터 기준) */
  date: string
  /** 날짜를 옮긴 방향 — 목록이 같은 쪽으로 미끄러진다 */
  dir: number
}

interface Slide {
  tab: Theme
  /** 마지막으로 목록을 바꾼 움직임의 방향(탭 순서 또는 날짜 순서) */
  dir: number
  date: string
}

function Row({
  row,
  i,
  color,
}: {
  row: ReturnType<typeof feedRows>[number]
  i: number
  color: string
}) {
  const [open, setOpen] = useState(false)
  const style: CssVars = { '--d': `${i * 40}ms`, '--k': color }
  const empty = !row.summary && !row.impactNote && !row.grade && !row.link
  return (
    <div className={open ? 'item open' : 'item'} style={style}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="no">{String(i + 1).padStart(2, '0')}</span>
        <span className="tt">
          {row.title}
          {row.tags.map((g, n) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 태그는 중복될 수 있고 목록은 고정이다
            <span key={n} className="tag">
              {g}
            </span>
          ))}
        </span>
        <span className="meta">{row.meta}</span>
        {row.chip ? <span className={`chip ${row.chip.cls}`}>{row.chip.text}</span> : <span />}
        <span className="chev" />
      </button>
      <div className="more">
        <div>
          <div className="in">
            {row.summary && <p>{row.summary}</p>}
            {row.impactNote && (
              <p>
                <strong>FE 영향</strong> {row.impactNote}
              </p>
            )}
            {row.grade && <p>검증 {row.grade}등급</p>}
            {row.link && (
              <a href={row.link.href} target="_blank" rel="noopener">
                {row.link.label}
              </a>
            )}
            {empty && <p>추가 정보가 없어요.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

/** 피드 탭 + 목록 — 레퍼런스 renderList·moveInd·renderTabCounts(553–594행)와 탭 클릭(636–641행). */
function Feed({ feeds, date, dir }: FeedProps) {
  const [st, setSt] = useState<Slide>({ tab: 'ai', dir: 0, date })
  // 날짜가 바뀌면 그 이동 방향으로 미끄러진다(렌더 중 setState — 이전 렌더 정보로 맞추는 React 권장 패턴)
  if (st.date !== date) setSt({ ...st, dir, date })
  const { tab } = st

  const tabsRef = useRef<HTMLDivElement>(null)
  const indRef = useRef<HTMLSpanElement>(null)

  // 인디케이터 — 선택된 탭의 offsetLeft·offsetWidth. 크기가 바뀔 때와 글꼴이 로드됐을 때 다시 잰다.
  // 건수 글자가 바뀌면 탭 폭도 바뀌므로 렌더마다 잰다.
  const move = () => {
    const on = tabsRef.current?.querySelector<HTMLElement>('button.on')
    const ind = indRef.current
    if (!on || !ind || !on.offsetWidth) return
    ind.style.left = `${on.offsetLeft}px`
    ind.style.width = `${on.offsetWidth}px`
    ind.style.setProperty('--k', COLOR[tab])
  }
  useLayoutEffect(move)
  // biome-ignore lint/correctness/useExhaustiveDependencies: move 는 렌더마다 새로 만들어지지만 tab 말고는 ref 만 읽는다
  useLayoutEffect(() => {
    const el = tabsRef.current
    const ro = new ResizeObserver(move)
    if (el) ro.observe(el)
    window.addEventListener('resize', move)
    let live = true
    document.fonts?.ready.then(() => live && move())
    return () => {
      live = false
      ro.disconnect()
      window.removeEventListener('resize', move)
    }
  }, [tab])

  const pick = (k: Theme) => {
    if (k === tab) return
    setSt({ tab: k, dir: ORDER.indexOf(k) < ORDER.indexOf(tab) ? -1 : 1, date })
  }

  const feed = feeds[tab]
  const rows = feedRows(tab, feed)
  const color = COLOR[tab]
  const slide = st.dir < 0 ? ' sl' : st.dir > 0 ? ' sr' : ''

  return (
    <section className="feed">
      <div className="seg-tabs" role="tablist" ref={tabsRef}>
        <span className="ind" ref={indRef} />
        {TABS.map(({ key, label }) => {
          const c = tabCount(feeds[key])
          return (
            <button
              key={key}
              type="button"
              role="tab"
              data-k={key}
              className={key === tab ? 'on' : undefined}
              aria-selected={key === tab}
              onClick={() => pick(key)}
            >
              {label} <em className={c.bad ? 'bad' : undefined}>{c.text}</em>
            </button>
          )
        })}
      </div>
      {/* key: 날짜·탭이 바뀔 때마다 새로 그려 펼침 상태와 미끄러짐·오름 애니메이션을 처음부터 다시 돈다 */}
      <div className={`card list${slide}`} key={`${date}|${tab}|${feed?.generatedAt ?? ''}`}>
        {rows.length === 0 ? (
          <div className="none">
            {feed
              ? `검증된 ${EMPTY_LABEL[tab]}가 없는 날이에요.${feed.note ? ` ${feed.note}` : ''}`
              : `이 날짜의 ${EMPTY_LABEL[tab]}를 가져오지 못했어요.`}
          </div>
        ) : (
          rows.map((row, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 순번이 곧 행의 정체성이다
            <Row key={i} row={row} i={i} color={color} />
          ))
        )}
      </div>
    </section>
  )
}

export default memo(Feed)
