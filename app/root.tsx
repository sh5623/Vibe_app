import { QueryClientProvider } from '@tanstack/react-query'
import type { LinksFunction, Location } from 'react-router'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import { getQueryClient } from '@/lib/query-client'
import stylesUrl from '@/styles/globals.css?url'

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesUrl }]

// /dev 는 스크롤 위치를 경로 단위로 기억한다 — 소개 페이지의 Home 버튼(navigate('/dev'))으로 돌아와도
// 떠났던 위치가 복원된다. 나머지 라우트는 기본값(location.key — 브라우저 뒤로가기에서만 복원).
const scrollKey = (location: Location) =>
  location.pathname === '/dev' ? location.pathname : location.key

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration getKey={scrollKey} />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}
