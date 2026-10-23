import { useLock, useTodoSession } from '@/hooks/use-morning-signal-todo'
import type { Route } from './+types/morning-signal-todo'
import { TodoHeader } from './morning-signal/Header'
import Shell from './morning-signal/Shell'
import PinGate from './morning-signal/todo/PinGate'
import TodoList from './morning-signal/todo/TodoList'
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
        <TodoList onOpen={() => {}} />
      ) : (
        <PinGate
          lockedUntil={session.data?.lockedUntil ?? null}
          configError={session.error?.code === 'TODO_NOT_CONFIGURED'}
        />
      )}
    </Shell>
  )
}
