import type { Route } from './+types/invitation';
import { InvitationCard } from '@/components/InvitationCard';

export function meta(_: Route.MetaArgs) {
  return [{ title: '초대장 | Vibe' }];
}

export default function InvitationPage() {
  return (
    <div className="min-h-screen py-10 px-5 flex justify-center items-center">
      <InvitationCard />
    </div>
  );
}
