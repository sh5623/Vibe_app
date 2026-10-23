import { keepPreviousData, type UseQueryResult, useQuery } from '@tanstack/react-query'
import type { DaySummary, Feeds } from '../../api/morning-signal'

export interface MsDayResponse {
  day: DaySummary
  feeds: Feeds
}

// 레퍼런스 loadFeeds 와 같은 규칙: 일시 오류는 최대 3번, 1.5s·3s·4.5s 뒤에 다시 읽는다.
const RETRY = 3
const retryDelay = (n: number) => 1500 * (n + 1)

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`morning-signal ${res.status}`)
  return (await res.json()) as T
}

export function useMsDays(): UseQueryResult<DaySummary[]> {
  return useQuery({
    queryKey: ['ms', 'days'],
    queryFn: async () => (await getJson<{ days: DaySummary[] }>('/api/morning-signal')).days,
    retry: RETRY,
    retryDelay,
  })
}

/** stamp(목록의 updatedAt)가 키에 들어가므로 그날이 다시 저장되면 상세를 새로 받는다(레퍼런스 lastStamp). */
export function useMsDay(
  date: string | null,
  stamp: string | undefined
): UseQueryResult<MsDayResponse> {
  return useQuery({
    queryKey: ['ms', 'day', date, stamp],
    queryFn: () =>
      getJson<MsDayResponse>(`/api/morning-signal?date=${encodeURIComponent(date ?? '')}`),
    enabled: !!date,
    placeholderData: keepPreviousData,
    retry: RETRY,
    retryDelay,
  })
}
