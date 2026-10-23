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
    enabled: !!id,
    retry: false,
  })
}

export function useCreateTodo(): UseMutationResult<Todo, TodoApiError, TodoInput> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TodoInput) =>
      (await request<{ todo: Todo }>('create', { method: 'POST', body: input })).todo,
    onSuccess: () => qc.invalidateQueries({ queryKey: todoKeys.list }),
    onError: (e) => onLocked(qc, e),
  })
}

function withStatus(
  data: ListData | undefined,
  id: string,
  status: TodoStatus
): ListData | undefined {
  if (!data) return data
  const set = (t: Todo) => (t.id === id ? { ...t, status } : t)
  return {
    ...data,
    pages: data.pages.map((p) => ({
      ...p,
      items: p.items.map(set),
      pending: p.pending?.map(set),
    })),
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
    onSettled: (_d, _e, { id }) => {
      void qc.invalidateQueries({ queryKey: todoKeys.list })
      void qc.invalidateQueries({ queryKey: todoKeys.detail(id) })
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
