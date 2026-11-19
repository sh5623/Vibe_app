import {
  type InfiniteData,
  type QueryClient,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  Attachment,
  ListResponse,
  SessionResponse,
  Todo,
  TodoStatus,
} from '../../api/morning-signal-todo'

const API = '/api/morning-signal-todo'

export const todoKeys = {
  all: ['ms', 'todo'] as const,
  session: ['ms', 'todo', 'session'] as const,
  list: ['ms', 'todo', 'list'] as const,
  detail: (id: string) => ['ms', 'todo', 'detail', id] as const,
  find: (link: string) => ['ms', 'todo', 'find', link] as const,
  done: (days: number) => ['ms', 'todo', 'done', days] as const,
}

/** 비 2xx 응답(또는 네트워크 실패: status 0, code 'NETWORK') */
export class TodoApiError extends Error {
  status: number
  code: string
  body: unknown
  constructor(status: number, code: string, body?: unknown) {
    super(`morning-signal-todo ${status} ${code}`)
    this.name = 'TodoApiError'
    this.status = status
    this.code = code
    this.body = body
  }
}

export interface TodoInput {
  title: string
  body?: string | null
  link?: string | null
  dueDate?: string | null
  dueTime?: string | null
  attachments?: Attachment[]
  /** 켤 때(만들기)·바뀔 때(수정)만 보낸다 — 서버 컬럼이 없어도 다른 저장이 깨지지 않게 */
  important?: boolean
}

export type TodoPatch = Partial<TodoInput> & { status?: TodoStatus }

type ListData = InfiniteData<ListResponse, string | null>

async function request<T>(
  op: string,
  init: { method?: string; params?: Record<string, string>; body?: unknown } = {}
): Promise<T> {
  const qs = new URLSearchParams({ op, ...init.params })
  let res: Response
  try {
    res = await fetch(`${API}?${qs}`, {
      method: init.method ?? 'GET',
      credentials: 'same-origin',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
  } catch (error) {
    throw new TodoApiError(0, 'NETWORK', error)
  }
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const err = (data as { error?: unknown } | null)?.error
    throw new TodoApiError(res.status, typeof err === 'string' ? err : `HTTP_${res.status}`, data)
  }
  return data as T
}

/** 세션이 끝났으면(24시간 경과·다시 잠금) PIN 화면으로 돌아가도록 세션을 다시 읽는다 */
function onLocked(qc: QueryClient, error: unknown) {
  if (error instanceof TodoApiError && error.code === 'LOCKED_SESSION') {
    void qc.invalidateQueries({ queryKey: todoKeys.session })
  }
}

export function useTodoSession(): UseQueryResult<SessionResponse, TodoApiError> {
  return useQuery({
    queryKey: todoKeys.session,
    queryFn: () => request<SessionResponse>('session'),
    retry: (n, e) => e.status === 0 && n < 2,
  })
}

/** PIN 확인. 성공해도 세션을 바로 무효화하지 않는다 — 화면이 성공 모션을 다 보여 준 뒤에 한다. */
export function useUnlock(): UseMutationResult<void, TodoApiError, string> {
  return useMutation({
    mutationFn: async (pin: string) => {
      await request('unlock', { method: 'POST', body: { pin } })
    },
  })
}

export function useLock(): UseMutationResult<void, TodoApiError, void> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await request('lock', { method: 'POST' })
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: todoKeys.list })
      qc.removeQueries({ queryKey: ['ms', 'todo', 'detail'] })
      qc.setQueryData<SessionResponse>(todoKeys.session, { unlocked: false, lockedUntil: null })
    },
  })
}

export function useTodoList(enabled: boolean): UseInfiniteQueryResult<ListData, TodoApiError> {
  const qc = useQueryClient()
  return useInfiniteQuery({
    queryKey: todoKeys.list,
    queryFn: async ({ pageParam }) => {
      try {
        return await request<ListResponse>('list', {
          params: pageParam ? { cursor: pageParam } : {},
        })
      } catch (error) {
        onLocked(qc, error)
        throw error
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
    retry: (n, e) => e.status === 0 && n < 2,
  })
}

/** 목록에 이미 받아 둔 할 일(첨부 서명 주소는 없다) — 상세를 기다리는 동안 먼저 보여 준다 */
export function findInList(data: ListData | undefined, id: string): Todo | undefined {
  for (const p of data?.pages ?? []) {
    const hit = p.items.find((t) => t.id === id) ?? p.pending?.find((t) => t.id === id)
    if (hit) return hit
  }
  return undefined
}

export function useTodoDetail(id: string | null): UseQueryResult<Todo, TodoApiError> {
  const qc = useQueryClient()
  return useQuery({
    queryKey: todoKeys.detail(id ?? ''),
    queryFn: async () => {
      try {
        return (await request<{ todo: Todo }>('get', { params: { id: id ?? '' } })).todo
      } catch (error) {
        onLocked(qc, error)
        throw error
      }
    },
    // 서버 응답(첨부 서명 주소 포함)이 오기 전에도 목록의 내용을 바로 보여 준다
    placeholderData: () =>
      id ? findInList(qc.getQueryData<ListData>(todoKeys.list), id) : undefined,
    enabled: !!id,
    retry: false,
  })
}

/** 링크로 담은 할 일 조회(한 번) — 훅 밖(PIN 직후 중복 확인)에서도 쓴다 */
export async function findTodoByLink(
  link: string
): Promise<{ id: string; status: TodoStatus } | null> {
  return (
    await request<{ todo: { id: string; status: TodoStatus } | null }>('find', {
      params: { link },
    })
  ).todo
}

/** 링크로 이미 담은 할 일을 찾는다(완료 포함). 없으면 null. */
export function useFindTodoByLink(
  link: string,
  enabled: boolean
): UseQueryResult<{ id: string; status: TodoStatus } | null, TodoApiError> {
  const qc = useQueryClient()
  return useQuery({
    queryKey: todoKeys.find(link),
    queryFn: async () => {
      try {
        return await findTodoByLink(link)
      } catch (error) {
        onLocked(qc, error)
        throw error
      }
    },
    enabled,
    retry: false,
  })
}

/** 최근 days일 안에 완료한 할 일(최근 완료 순) */
export function useDoneHistory(
  days: number,
  enabled: boolean
): UseQueryResult<Todo[], TodoApiError> {
  const qc = useQueryClient()
  return useQuery({
    queryKey: todoKeys.done(days),
    queryFn: async () => {
      try {
        return (await request<{ items: Todo[] }>('done', { params: { days: String(days) } })).items
      } catch (error) {
        onLocked(qc, error)
        throw error
      }
    },
    enabled,
    retry: false,
  })
}

/** 만들기·수정 뒤 링크 조회·최근 완료 캐시를 낡음 처리한다 */
const FIND_DONE_PREFIXES = [
  ['ms', 'todo', 'find'],
  ['ms', 'todo', 'done'],
] as const
function invalidateFindDone(qc: QueryClient) {
  for (const queryKey of FIND_DONE_PREFIXES) void qc.invalidateQueries({ queryKey })
}

export function useCreateTodo(): UseMutationResult<Todo, TodoApiError, TodoInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TodoInput) =>
      (await request<{ todo: Todo }>('create', { method: 'POST', body: input })).todo,
    onSuccess: () => {
      invalidateFindDone(qc)
      return qc.invalidateQueries({ queryKey: todoKeys.list })
    },
    onError: (e) => onLocked(qc, e),
  })
}

/** 상태를 목록 캐시에 먼저 반영한다. 날짜별 완료 건수(done/total)도 같이 맞춘다. */
export function withStatus(
  data: ListData | undefined,
  id: string,
  status: TodoStatus
): ListData | undefined {
  if (!data) return data
  const before = findInList(data, id)
  const set = (t: Todo) => (t.id === id ? { ...t, status } : t)
  // DONE 으로 들어가면 +1, DONE 에서 나오면 -1
  const step = before ? Number(status === 'done') - Number(before.status === 'done') : 0
  return {
    ...data,
    pages: data.pages.map((p) => {
      const counts = before?.createdDate ? p.dayCounts[before.createdDate] : undefined
      return {
        ...p,
        items: p.items.map(set),
        pending: p.pending?.map(set),
        dayCounts:
          counts && step !== 0 && before
            ? { ...p.dayCounts, [before.createdDate]: { ...counts, done: counts.done + step } }
            : p.dayCounts,
      }
    }),
  }
}

/** 수정. 상태 변경은 화면에 먼저 반영하고(낙관적), 실패하면 되돌린다. */
export function useUpdateTodo(): UseMutationResult<
  Todo,
  TodoApiError,
  { id: string; patch: TodoPatch },
  { prev: ListData | undefined }
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }) =>
      (await request<{ todo: Todo }>('update', { method: 'PATCH', params: { id }, body: patch }))
        .todo,
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: todoKeys.list })
      const prev = qc.getQueryData<ListData>(todoKeys.list)
      if (patch.status) {
        const status = patch.status
        qc.setQueryData<ListData>(todoKeys.list, (d) => withStatus(d, id, status))
        qc.setQueryData<Todo>(todoKeys.detail(id), (t) => (t ? { ...t, status } : t))
      }
      return { prev }
    },
    onError: (e, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(todoKeys.list, ctx.prev)
      void qc.invalidateQueries({ queryKey: todoKeys.detail(id) })
      onLocked(qc, e)
    },
    onSettled: (_d, e, { id, patch }) => {
      // 상태만 바꾼 성공 건은 이미 화면에 반영돼 있다. 불러온 페이지를 전부 순서대로 다시 받으면
      // 서버 왕복이 몇 번씩 이어지므로, 다시 받지 않고 낡음 표시만 해 둔다(다음 진입·포커스 때 갱신).
      const statusOnly = !e && Object.keys(patch).every((k) => k === 'status')
      const refetchType = statusOnly ? 'none' : 'active'
      void qc.invalidateQueries({ queryKey: todoKeys.list, refetchType })
      void qc.invalidateQueries({ queryKey: todoKeys.detail(id), refetchType })
      if (!e) invalidateFindDone(qc)
    },
  })
}

export function useDeleteTodo(): UseMutationResult<void, TodoApiError, string> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await request('delete', { method: 'DELETE', params: { id } })
    },
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: todoKeys.detail(id) })
      // 지운 레포의 「담음」 표시가 ＋ 로 돌아오게
      invalidateFindDone(qc)
      return qc.invalidateQueries({ queryKey: todoKeys.list })
    },
    onError: (e) => onLocked(qc, e),
  })
}

/** 서명 업로드 주소를 받아 Storage 에 직접 올린다(Vercel 함수 본문 4.5MB 한도를 피한다). */
export async function uploadAttachment(file: File): Promise<Attachment> {
  const { path, uploadUrl } = await request<{ path: string; uploadUrl: string }>('upload-url', {
    method: 'POST',
    body: { name: file.name, type: file.type, size: file.size },
  })
  let res: Response
  try {
    res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type, 'x-upsert': 'false' },
      body: file,
    })
  } catch (error) {
    throw new TodoApiError(0, 'UPLOAD_FAILED', error)
  }
  if (!res.ok) throw new TodoApiError(res.status, 'UPLOAD_FAILED')
  return { path, name: file.name, type: file.type, size: file.size }
}
