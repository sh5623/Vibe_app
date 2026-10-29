import type { ReactNode } from 'react'

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
    last = at + m[0].length
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
      const level = line.indexOf(' ')
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
