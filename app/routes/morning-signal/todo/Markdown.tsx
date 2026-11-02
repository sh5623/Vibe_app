import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react'
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

/**
 * [from, to) 를 str 로 바꾼다 — 브라우저 편집 경로(execCommand)를 거쳐서 키보드(한글 조합·자동 완성)와
 * 되돌리기 기록이 값과 어긋나지 않게 한다. 결과가 want 와 같으면 true(이때 React onChange 는 input 이벤트로 온다).
 */
function editViaBrowser(
  el: HTMLTextAreaElement,
  from: number,
  to: number,
  str: string,
  want: string
): boolean {
  el.setSelectionRange(from, to)
  try {
    const ok = str ? document.execCommand('insertText', false, str) : document.execCommand('delete')
    return ok && el.value === want
  } catch {
    return false
  }
}

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
  // 브라우저 편집 경로를 못 쓸 때만 값을 직접 바꾼다 — 그때는 값이 화면에 반영된 직후 커서를 옮긴다
  // (requestAnimationFrame 으로 미루면 그 사이 빠르게 친 글자 뒤에서 커서가 옛 위치로 되돌아간다)
  const pending = useRef<{ text: string; caret: number } | null>(null)
  const onChangeRef = useRef(onChange)
  const shiftEnter = useRef(false)
  useLayoutEffect(() => {
    onChangeRef.current = onChange
  })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // 내용 높이에 맞춘다(최소 6줄 · 최대 화면 절반은 CSS 가 정한다)
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    const p = pending.current
    if (!p || p.text !== value) return
    pending.current = null
    el.setSelectionRange(p.caret, p.caret)
  }, [value])

  // 목록 줄의 Enter 는 keydown 이 아니라 줄바꿈 입력(beforeinput) 단계에서 처리한다. iOS 한글 키보드는
  // 조합 중인 글자를 안은 채 Enter keydown(keyCode 13 · isComposing false)을 보내서, keydown 에서 막으면
  // 그 글자가 새 줄로 따라왔다(2026-11-02). 줄바꿈 입력은 조합이 끝난 뒤에 온다.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onBeforeInput = (e: InputEvent) => {
      const lineBreak = e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph'
      if (!lineBreak || e.isComposing || shiftEnter.current) return
      const c = el.selectionStart
      if (c !== el.selectionEnd) return
      const next = continueList(el.value, c)
      if (!next) return
      e.preventDefault()
      const from = Math.min(c, next.caret) // 이어 쓰기 = 커서 자리에 글머리 · 빈 글머리 = 그 글머리 지우기
      if (editViaBrowser(el, from, c, next.text.slice(from, next.caret), next.text)) return
      pending.current = next
      onChangeRef.current(next.text)
    }
    el.addEventListener('beforeinput', onBeforeInput)
    return () => el.removeEventListener('beforeinput', onBeforeInput)
  }, [])

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
        onKeyDown={(e) => {
          if (e.key === 'Enter') shiftEnter.current = e.shiftKey
        }}
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
