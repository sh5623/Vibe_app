import {
  type CSSProperties,
  memo,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { DaySummary, Feed, Feeds, Theme } from '../../../api/morning-signal'
import {
  barTop,
  COLOR,
  catModel,
  DONUT_C,
  dateParts,
  deriveTops,
  donutModel,
  type HeadlineParts,
  headlineParts,
  mdDot,
  WD_KO,
  WORLD_CATS,
} from './model'
import Odometer from './Odometer'

type CssVars = CSSProperties & Record<`--${string}`, string | number>

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const panelDelay = (ms: number): CssVars => ({ '--d': `${ms}ms` })

// ---------- 패널 기울기·광택 (레퍼런스 754–760행) ----------

function onTiltMove(e: ReactPointerEvent<HTMLElement>) {
  const t = e.currentTarget
  const r = t.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width
  const y = (e.clientY - r.top) / r.height
  t.style.setProperty('--ry', `${(x - 0.5) * 5}deg`)
  t.style.setProperty('--rx', `${(0.5 - y) * 5}deg`)
  t.style.setProperty('--mx', `${x * 100}%`)
  t.style.setProperty('--my', `${y * 100}%`)
}

function onTiltLeave(e: ReactPointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty('--rx', '0deg')
  e.currentTarget.style.setProperty('--ry', '0deg')
}

const TILT = { onPointerMove: onTiltMove, onPointerLeave: onTiltLeave }

// hover 가 되는 기기에서만, reduced-motion 이 아닐 때 기울인다(처음 한 번 판정 — 레퍼런스와 같다)
let tiltOn: boolean | null = null
function tiltProps() {
  tiltOn ??= !reduceMotion() && matchMedia('(hover: hover)').matches
  return tiltOn ? TILT : {}
}

// ---------- 오늘의 한 줄 ----------

/** 단어마다 span.w(65ms 간격 등장) — 공백은 그대로 둔다. 순번은 강조 앞·안·뒤를 이어서 센다. */
function words(text: string, start: number, out: boolean): { nodes: ReactNode[]; next: number } {
  const nodes: ReactNode[] = []
  let n = start
  for (const chunk of text.split(/(\s+)/)) {
    if (!chunk) continue
    if (!chunk.trim()) {
      nodes.push(chunk)
      continue
    }
    nodes.push(
      <span key={`w${n}`} className={out ? 'w out' : 'w'} style={{ animationDelay: `${n * 65}ms` }}>
        {chunk}
      </span>
    )
    n++
  }
  return { nodes, next: n }
}

const hasWords = (p: HeadlineParts | null) => !!p && `${p.before}${p.mark}${p.after}`.trim() !== ''

interface Shown {
  /** 몇 번째로 지은 문장인지 — h2 의 key 로 써서 지을 때마다 등장·형광펜 애니메이션을 처음부터 다시 건다 */
  n: number
  parts: HeadlineParts | null
}

/**
 * 레퍼런스 heroLine — 다시 그릴 때마다(token 이 바뀔 때마다) 보이는 단어가 있으면 날려 보내고(220ms)
 * 그 뒤 최신 문장을 새로 짓는다. 단어가 없거나 reduced-motion 이면 곧바로 짓는다.
 */
function HeroLine({
  token,
  headline,
  highlight,
}: {
  token: string
  headline: string | null
  highlight: string | null
}) {
  const [seenToken, setSeenToken] = useState(token)
  const [shown, setShown] = useState<Shown>(() => ({
    n: 0,
    parts: headlineParts(headline, highlight),
  }))
  const [leaving, setLeaving] = useState(false)
  // 렌더 중 상태 맞추기 — 처음 본 token 이면 한 번의 퇴장·교체 주기를 시작한다
  if (seenToken !== token) {
    setSeenToken(token)
    if (hasWords(shown.parts) && !reduceMotion()) {
      setLeaving(true)
    } else {
      setShown({ n: shown.n + 1, parts: headlineParts(headline, highlight) })
      setLeaving(false)
    }
  }

  // 퇴장 중에 token 이 또 바뀌면 타이머를 새로 잡아 가장 마지막 문장을 짓는다(처음 날짜로 돌아와도 같다)
  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => {
      setShown((s) => ({ n: s.n + 1, parts: headlineParts(headline, highlight) }))
      setLeaving(false)
    }, 220)
    return () => clearTimeout(t)
  }, [leaving, headline, highlight])

  const p = shown.parts
  if (!p) return <h2 className="line none">오늘의 한 줄이 아직 없어요.</h2>
  const a = words(p.before, 0, leaving)
  const m = words(p.mark, a.next, leaving)
  const b = words(p.after, m.next, leaving)
  return (
    <h2 className="line" key={shown.n}>
      {a.nodes}
      {p.mark && <mark>{m.nodes}</mark>}
      {b.nodes}
    </h2>
  )
}

const TOP_NAME: Partial<Record<Theme, string>> = { ai: 'AI', world: '시사·경제', gh: 'GitHub' }

// ---------- AI 도넛 ----------

const SEG_STROKE = ['var(--hi)', 'var(--mid)', 'var(--low)'] as const

/**
 * 도넛 고리 — 첫 화면은 0 길이로 계산시킨 뒤 실제 길이로 바꿔 늘어나게 한다(레퍼런스는 시작 때 0 으로 둔다).
 * 그 상태 변경이 가운데 Odometer 를 다시 렌더(=다시 굴림)하지 않게 고리만 따로 둔다.
 */
function DonutRing({ segments }: { segments: { len: number; offset: number }[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [armed, setArmed] = useState(false)
  useLayoutEffect(() => {
    svgRef.current?.getBoundingClientRect()
    setArmed(true)
  }, [])
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" ref={svgRef}>
      <circle className="trk" cx="60" cy="60" r="46" />
      {SEG_STROKE.map((stroke, i) => {
        const seg = segments[i]
        return (
          <circle
            key={stroke}
            className="seg"
            cx="60"
            cy="60"
            r="46"
            stroke={stroke}
            style={{
              transitionDelay: `${250 + i * 150}ms`,
              strokeDasharray: `${armed ? (seg?.len ?? 0) : 0} ${DONUT_C}`,
              strokeDashoffset: armed ? (seg?.offset ?? 0) : 0,
            }}
          />
        )
      })}
    </svg>
  )
}

function Donut({ feed }: { feed: Feed<'ai'> | undefined }) {
  const m = donutModel(feed?.items ?? [])
  const legend = [
    { label: '높음', color: 'var(--hi)', value: m.high },
    { label: '중간', color: 'var(--mid)', value: m.mid },
    { label: '낮음', color: 'var(--low)', value: m.low },
  ]
  return (
    <article className="card panel" style={panelDelay(180)} {...tiltProps()}>
      <h2>
        <i style={{ background: 'var(--s-ai)' }} />
        AI · FE 영향도
      </h2>
      <div className="donut">
        <DonutRing segments={m.segments} />
        <div className="ctr">
          <div>
            <Odometer as="b" value={m.high} id="oDonut" />
            <small>AI 높음</small>
          </div>
        </div>
      </div>
      <div className="legend">
        {legend.map((l) => (
          <div key={l.label}>
            <i style={{ background: l.color }} />
            FE {l.label}
            <b>{l.value}</b>
          </div>
        ))}
      </div>
      <p className="pempty" hidden={m.total > 0}>
        {feed ? '검증된 AI 뉴스가 없는 날이에요.' : 'AI 뉴스를 가져오지 못했어요.'}
      </p>
    </article>
  )
}

// ---------- 시사 분포 ----------

const CAT_COLOR = [
  'var(--s-world)',
  'color-mix(in srgb, var(--s-world) 55%, var(--s-ai))',
  'color-mix(in srgb, var(--s-world) 35%, var(--muted-fg))',
] as const

function CatBar({ feed }: { feed: Feed<'world'> | undefined }) {
  const m = catModel(feed?.items ?? [])
  const barRef = useRef<HTMLDivElement>(null)
  // 레퍼런스처럼 그릴 때마다 scaleX(0) 으로 되돌렸다가 두 프레임 뒤 1 로 늘린다(부모가 데이터가 바뀔 때만 그린다)
  useLayoutEffect(() => {
    const spans = Array.from(barRef.current?.children ?? []).filter(
      (s): s is HTMLElement => s instanceof HTMLElement
    )
    for (const s of spans) s.style.transform = 'scaleX(0)'
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        for (const s of spans) s.style.transform = 'scaleX(1)'
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  })
  return (
    <article className="card panel" style={panelDelay(240)} {...tiltProps()}>
      <h2>
        <i style={{ background: 'var(--s-world)' }} />
        시사·경제·상식 분포
      </h2>
      <div className="catbar" ref={barRef}>
        {WORLD_CATS.map((c, i) => {
          const v = m.counts[i] ?? 0
          return (
            <span
              key={c}
              style={{
                flex: `${v} 0 0`,
                background: CAT_COLOR[i],
                display: v ? 'block' : 'none',
                transitionDelay: `${300 + i * 160}ms`,
              }}
            />
          )
        })}
      </div>
      <div className="legend">
        {WORLD_CATS.map((c, i) => {
          const pct = m.pct[i]
          return (
            <div key={c}>
              <i style={{ background: CAT_COLOR[i] }} />
              {c}
              <b>{`${m.counts[i] ?? 0}${pct != null ? ` · ${pct}%` : ''}`}</b>
            </div>
          )
        })}
      </div>
      <p className="pempty" hidden={(feed?.items.length ?? 0) > 0}>
        {feed ? '검증된 시사·경제 뉴스가 없는 날이에요.' : '시사·경제 뉴스를 가져오지 못했어요.'}
      </p>
    </article>
  )
}

// ---------- GitHub BarList ----------

const ROW_H = 32
const ENTER_TOP = 5 * ROW_H + 12

interface BarRow {
  repo: string
  value: string
  scale: number
  /** 순위(0부터). 빠지는 행은 마지막 순위를 유지한다 */
  rank: number
  phase: 'enter' | 'in' | 'out'
}

/**
 * 레퍼런스 renderBarlist 의 행 재사용 규칙 — 같은 레포는 자리만 옮기고, 새 레포는 아래에서 올라오고,
 * 빠진 레포는 위로 사라진다. DOM 순서도 레퍼런스와 같다(기존 행은 제자리, 새 행은 뒤에 붙인다 — 이동 중 겹칠 때 그리는 순서).
 */
function mergeRows(rows: BarRow[], top: ReturnType<typeof barTop>): BarRow[] {
  if (top.length === 0) return [] // 비면 행을 곧바로 지우고 빈 문구만 남긴다
  const next = rows.map((r): BarRow => {
    const rank = top.findIndex((g) => g.repo === r.repo)
    const g = top[rank]
    if (!g) return r.phase === 'out' ? r : { ...r, phase: 'out' }
    return { ...r, ...g, rank, phase: r.phase === 'out' ? 'in' : r.phase }
  })
  top.forEach((g, rank) => {
    if (!rows.some((r) => r.repo === g.repo)) next.push({ ...g, rank, phase: 'enter' })
  })
  return next
}

function BarList({ feed }: { feed: Feed<'gh'> | undefined }) {
  const [seen, setSeen] = useState<{ feed: Feed<'gh'> | undefined } | null>(null)
  const [rows, setRows] = useState<BarRow[]>([])
  const boxRef = useRef<HTMLDivElement>(null)
  // feed 가 바뀌면 행을 맞춘다(렌더 중 상태 맞추기 — 커밋 전에 다시 렌더된다)
  if (!seen || seen.feed !== feed) {
    setSeen({ feed })
    setRows(mergeRows(rows, barTop(feed?.items ?? [])))
  }

  // 새 행은 아래(ENTER_TOP)·투명으로 한 번 계산시킨 뒤 제자리로 옮긴다(레퍼런스 void row.offsetWidth)
  useLayoutEffect(() => {
    if (!rows.some((r) => r.phase === 'enter')) return
    boxRef.current?.getBoundingClientRect()
    setRows((rs) => rs.map((r) => (r.phase === 'enter' ? { ...r, phase: 'in' } : r)))
  }, [rows])

  // 빠지는 행은 600ms 동안 위로 사라진 뒤 지운다
  useEffect(() => {
    if (!rows.some((r) => r.phase === 'out')) return
    const t = setTimeout(() => setRows((rs) => rs.filter((r) => r.phase !== 'out')), 600)
    return () => clearTimeout(t)
  }, [rows])

  const picks = (feed?.items ?? []).filter((g) => g.fePick).map((g) => g.repo)

  return (
    <article className="card panel p-gh" style={panelDelay(300)} {...tiltProps()}>
      <div className="hd">
        <h2>
          <i style={{ background: 'var(--s-gh)' }} />
          GitHub · 오늘 별 증가 순위
        </h2>
        <div className="pick">
          {picks.map((p) => (
            <span key={p}>{`FE 주목 · ${p}`}</span>
          ))}
        </div>
      </div>
      <div className="barlist" ref={boxRef}>
        {rows.map((r) => {
          const top = r.phase === 'enter' ? ENTER_TOP : r.phase === 'out' ? -ROW_H : r.rank * ROW_H
          const fill: CssVars = { transitionDelay: `${300 + r.rank * 90}ms` }
          if (r.phase !== 'enter') fill['--s'] = String(r.scale)
          return (
            <div
              key={r.repo}
              className={r.rank === 0 ? 'row first' : 'row'}
              data-r={r.repo}
              style={{ top: `${top}px`, opacity: r.phase === 'in' ? 1 : 0 }}
            >
              <div className="nm">
                <i className="f" style={fill} />
                <span>{r.repo}</span>
              </div>
              <div className="v">{r.value}</div>
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="empty">
            {feed ? '오늘은 정리된 레포가 없어요.' : 'GitHub 트렌딩을 가져오지 못했어요.'}
          </div>
        )}
      </div>
    </article>
  )
}

// ---------- 벤토 ----------

interface BentoProps {
  /** 화면에 띄운 날짜(데이터 기준 — 새 날짜를 받는 동안은 직전 날짜) */
  day: DaySummary
  feeds: Feeds
}

/** 벤토 — 레퍼런스 314–341행 마크업, 473–550행 렌더. */
function Bento({ day, feeds }: BentoProps) {
  // 레퍼런스 render() 를 다시 부르는 조건(날짜 이동, 그날 갱신)과 같다
  const token = `${day.date}|${day.updatedAt ?? ''}`
  const tops = (Array.isArray(day.tops) && day.tops.length ? day.tops : deriveTops(feeds)).filter(
    (t) => TOP_NAME[t.theme]
  )
  const eyebrow = `${mdDot(day.date)} ${WD_KO[dateParts(day.date).wd] ?? ''} · 오늘의 한 줄`

  return (
    <section className="bento">
      <article className="card panel p-line" style={panelDelay(120)} {...tiltProps()}>
        <div className="eyebrow">{eyebrow}</div>
        <HeroLine token={token} headline={day.headline ?? null} highlight={day.highlight ?? null} />
        {/* key 로 목록을 새로 만들어 줄마다 미끄러져 들어오게 한다 */}
        <ul className="tops" key={token}>
          {tops.map((t, i) => {
            const style: CssVars = { '--k': COLOR[t.theme], '--d': `${450 + i * 100}ms` }
            return (
              <li key={t.theme} style={style}>
                <b>{TOP_NAME[t.theme]}</b>
                <span>{t.text}</span>
              </li>
            )
          })}
        </ul>
      </article>
      <Donut feed={feeds.ai} />
      <CatBar feed={feeds.world} />
      <BarList feed={feeds.gh} />
    </section>
  )
}

// 라우트가 날짜를 옮기는 동안(직전 데이터 유지) 다시 렌더돼도 애니메이션이 다시 돌지 않게 데이터가 바뀔 때만 그린다
export default memo(Bento)
