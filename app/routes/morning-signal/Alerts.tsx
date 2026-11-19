import type { ReactNode } from 'react'
import Card from './Card'
import type { AlertItem } from './model'

// 시안 news.js ICON — 종류별 아이콘(오늘 = 문서, 예정 = 종, 마감 임박 할 일 = 체크)
const KIND: Record<AlertItem['kind'], { cls: string; icon: ReactNode }> = {
  today: {
    cls: 't-world',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h12l4 4v12H4z" />
        <path d="M8 12h8M8 16h5" />
      </svg>
    ),
  },
  planned: {
    cls: 't-ai',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10 21h4" />
      </svg>
    ),
  },
  due: {
    cls: 't-ok',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    ),
  },
}

/** 챙길 것 — 시안 grid.css `.rows`. 항목은 alertItems(최대 4개), 마감 임박 할 일은 Task 6 에서 붙인다 */
export default function Alerts({ items }: { items: AlertItem[] }) {
  return (
    <Card
      area="alert"
      title="챙길 것"
      aux={items.length > 0 ? <span className="cnt">{items.length}</span> : null}
    >
      {items.length === 0 ? (
        <p className="empty">오늘 챙길 것이 없어요</p>
      ) : (
        <ul className="rows">
          {items.map((it, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 같은 종류·제목이 겹칠 수 있어 인덱스를 함께 쓴다
            <li key={`${it.kind}|${it.title}|${i}`}>
              <span className={`ico ${KIND[it.kind].cls}`}>{KIND[it.kind].icon}</span>
              <strong>
                {it.title}
                <span className="chip due">{it.chip}</span>
              </strong>
              <span className="s">{it.sub}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
