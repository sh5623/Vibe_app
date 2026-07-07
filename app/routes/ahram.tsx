import { AhramInterview } from '@/components/AhramInterview'
import type { Route } from './+types/ahram'

export function meta(_: Route.MetaArgs) {
  return [{ title: '면접 준비 | Vibe' }, { name: 'robots', content: 'noindex, nofollow' }]
}

export function links(): Route.LinkDescriptors {
  return [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap',
    },
  ]
}

export default function AhramPage() {
  return <AhramInterview />
}
