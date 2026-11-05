import { index, layout, type RouteConfig, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('fe-rail', 'routes/fe-rail.tsx'),
  route('self-improvement', 'routes/self-improvement.tsx'),
  route('parallel-worktree', 'routes/parallel-worktree.tsx'),
  route('e2e-rail', 'routes/e2e-rail.tsx'),
  route('dev', 'routes/dev.tsx'),
  route('portfolio', 'routes/portfolio.tsx'),
  route('invitation', 'routes/invitation.tsx'),
  route('letter', 'routes/letter.tsx'),
  route('stock', 'routes/stock.tsx'),
  route('otp', 'routes/otp.tsx'),
  route('ahram', 'routes/ahram.tsx'),
  // News·TO-DO 는 껍데기(레일·탭 바·배경)를 공유하는 레이아웃 아래에 둔다 — 주소는 그대로
  layout('routes/morning-signal-layout.tsx', [
    route('morning-signal', 'routes/morning-signal.tsx'),
    route('morning-signal/todo', 'routes/morning-signal-todo.tsx'),
  ]),
] satisfies RouteConfig
