import type { Route } from './+types/otp';
import { OtpViewer } from '@/components/OtpViewer';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'OTP 뷰어' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default function OtpPage() {
  return <OtpViewer />;
}
