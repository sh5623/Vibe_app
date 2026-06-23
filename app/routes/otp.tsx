import { OtpViewer } from '@/components/OtpViewer'
import type { Route } from './+types/otp'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'OTP 뷰어' }, { name: 'robots', content: 'noindex, nofollow' }]
}

export default function OtpPage() {
  return <OtpViewer />
}
