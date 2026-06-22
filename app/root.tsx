import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { LinksFunction } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import stylesUrl from '@/styles/globals.css?url'

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesUrl }]

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
        <ScrollRestoration />
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
