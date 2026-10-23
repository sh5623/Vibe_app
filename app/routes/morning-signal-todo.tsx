import { useLock, useTodoSession } from '@/hooks/use-morning-signal-todo'
import type { Route } from './+types/morning-signal-todo'
import { TodoHeader } from './morning-signal/Header'
import Shell from './morning-signal/Shell'
import './morning-signal/todo/todo.css'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'TO-DO | Morning Signal' }, { name: 'robots', content: 'noindex, nofollow' }]
}

export default function MorningSignalTodo() {
  const session = useTodoSession()
  const lock = useLock()
  const unlocked = session.data?.unlocked === true

  return (
    <Shell>
      <TodoHeader onLock={unlocked ? () => lock.mutate() : undefined} />
      {session.isPending ? null : unlocked ? (
        <section className="todo-view">
          <h2 className="todo-sh">남은 일</h2>
        </section>
      ) : (
        <section className="card state">
          <b>본인 확인</b>
        </section>
      )}
    </Shell>
  )
}
