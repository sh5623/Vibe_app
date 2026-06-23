import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BirthdayModal } from '@/components/BirthdayModal'
import { HomeCard } from '@/components/HomeCard'
import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Vibe App' }, { name: 'description', content: '이승호의 포트폴리오' }]
}

export default function Home() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleConfirm = (birthday: string): boolean => {
    if (birthday === import.meta.env.VITE_BIRTHDAY) {
      void navigate('/letter')
      return true
    }
    return false
  }

  return (
    <div className="min-h-screen flex items-center justify-center flex-wrap p-5 gap-5 max-[768px]:flex-col">
      <HomeCard
        title={
          <>
            fe-rail<span>Claude Code Plugin</span>
          </>
        }
        buttonText="보러가기"
        onClick={() => void navigate('/fe-rail')}
      />
      <HomeCard
        title="이승호 Portfolio"
        buttonText="보러가기"
        onClick={() => void navigate('/dev')}
      />
      <HomeCard
        title="Bambi Portfolio"
        buttonText="보러가기"
        onClick={() => void navigate('/portfolio')}
      />
      <HomeCard
        title="초대장이 도착했습니다."
        buttonText="보러가기"
        onClick={() => void navigate('/invitation')}
      />
      <HomeCard
        title="편지가 도착했습니다."
        buttonText="보러가기"
        onClick={() => setIsModalOpen(true)}
      />
      <HomeCard
        title="주식 대시보드"
        buttonText="보러가기"
        onClick={() => void navigate('/stock')}
      />
      <BirthdayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
