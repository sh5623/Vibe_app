import { type KeyboardEvent, type ReactNode, useLayoutEffect, useRef } from 'react'
import { continueList } from './todo-model'

// 메모용 최소 마크다운 렌더러 — React 노드만 만들고 HTML 은 주입하지 않는다.
// 지원: # 제목 · - / 1. 목록 · - [ ] 체크 · > 인용 · ``` 코드블록 · **굵게** *기울임* ~~취소~~ `코드` [링크](https://…)

const INLINE =
  /`([^`]+)`|\*\*([^*]+)\*\*|~~([^~]+)~~|\*([^*\s][^*]*)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g

function inline(text: string, base = 0): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const at = base + m.index
    if (m[1] !== undefined) out.push(<code key={at}>{m[1]}</code>)
    else if (m[2] !== undefined) out.push(<strong key={at}>{m[2]}</strong>)
    else if (m[3] !== undefined) out.push(<del key={at}>{m[3]}</del>)
    else if (m[4] !== undefined) out.push(<em key={at}>{m[4]}</em>)
    else
      out.push(
        <a key={at} href={m[6]} target="_blank" rel="noreferrer">
          {m[5]}
        </a>
      )
    last = m.index + m[0].length // base 는 key 에만 쓴다 — 자르는 위치는 이 줄 안의 오프셋이다
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function lines(rows: string[]): ReactNode[] {
  let base = 0
  return rows.flatMap((row, i) => {
    const start = base
    base += row.length + 1
    return i === 0 ? inline(row, start) : [<br key={`br${start}`} />, ...inline(row, start)]
  })
}

const UL = /^\s*[-*]\s+(.*)$/
const OL = /^\s*\d+[.)]\s+(.*)$/
const TASK = /^\[( |x|X)\]\s+(.*)$/

export function Markdown({ text }: { text: string }) {
  const src = text.replace(/\r\n?/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  const next = (n: number) => src[n] ?? ''

  while (i < src.length) {
    const line = next(i)
    const key = `b${i}`

    if (line.trim() === '') {
      i++
    } else if (line.startsWith('```')) {
      const code: string[] = []
      i++
      while (i < src.length && !next(i).startsWith('```')) code.push(next(i++))
      i++
      blocks.push(
        <pre key={key}>
          <code>{code.join('\n')}</code>
        </pre>
      )
    } else if (/^#{1,3}\s/.test(line)) {
      const level = line.search(/\s/)
      blocks.push(
        <p key={key} className={`md-h md-h${level}`}>
          {inline(line.slice(level + 1))}
        </p>
      )
      i++
    } else if (UL.test(line) || OL.test(line)) {
      const ordered = OL.test(line) && !UL.test(line)
      const re = ordered ? OL : UL
      const items: ReactNode[] = []
      while (i < src.length && re.test(next(i))) {
        const body = re.exec(next(i))?.[1] ?? ''
        const task = TASK.exec(body)
        items.push(
          task ? (
            <li key={`i${i}`} className="md-task" data-done={task[1] !== ' '}>
              <span aria-hidden="true">{task[1] === ' ' ? '☐' : '☑'}</span> {inline(task[2] ?? '')}
            </li>
          ) : (
            <li key={`i${i}`}>{inline(body)}</li>
          )
        )
        i++
      }
      blocks.push(ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>)
    } else if (line.startsWith('>')) {
      const rows: string[] = []
      while (i < src.length && next(i).startsWith('>')) rows.push(next(i++).replace(/^>\s?/, ''))
      blocks.push(<blockquote key={key}>{lines(rows)}</blockquote>)
    } else {
      const rows: string[] = []
      while (
        i < src.length &&
        next(i).trim() !== '' &&
        !/^(```|#{1,3}\s|>)/.test(next(i)) &&
        !UL.test(next(i)) &&
        !OL.test(next(i))
      )
        rows.push(next(i++))
      blocks.push(<p key={key}>{lines(rows)}</p>)
    }
  }
  return <div className="todo-note todo-md">{blocks}</div>
}

const HAS_MD = /^\s*(?:[-*>]|\d+[.)]|#{1,3})\s|```|\*\*|`|\[[^\]]+\]\(/m

/** 메모 입력칸 — 목록 줄에서 Enter 로 글머리를 이어 주고, 마크다운이 섞이면 아래에 모양을 바로 보여 준다. */
export function MemoField({
  value,
  onChange,
  maxLength,
}: {
  value: string
  onChange: (v: string) => void
  maxLength: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  // 글머리를 넣은 값이 화면에 반영된 직후 커서를 옮긴다 — requestAnimationFrame 으로 미루면
  // 그 사이 빠르게 친 글자 뒤에서 커서가 옛 위치로 되돌아가 글자가 엉뚱한 자리에 들어간다
  const pending = useRef<{ text: string; caret: number } | null>(null)
  useLayoutEffect(() => {
    const p = pending.current
    if (!p || p.text !== value) return
    pending.current = null
    ref.current?.setSelectionRange(p.caret, p.caret)
  }, [value])

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    // Safari 는 한글 조합을 끝내는 Enter 에서 isComposing 이 false 이고 keyCode 만 229 다
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || e.keyCode === 229) return
    if (el.selectionStart !== el.selectionEnd) return
    const next = continueList(value, el.selectionStart)
    if (!next) return
    e.preventDefault()
    pending.current = next
    onChange(next.text)
  }

  return (
    <>
      <textarea
        ref={ref}
        className="todo-new-b"
        aria-label="메모"
        placeholder="메모 (선택 · 마크다운 지원)"
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {HAS_MD.test(value) && (
        <div className="todo-md-preview">
          <span>미리보기</span>
          <Markdown text={value} />
        </div>
      )}
    </>
  )
}
