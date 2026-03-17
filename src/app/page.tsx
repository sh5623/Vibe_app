'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeCard } from '../components/HomeCard';
import { BirthdayModal } from '../components/BirthdayModal';
import { Container } from './styled';

export default function Home() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handelNavigate = () => {
        router.push('/invitation');
    }

    const handleStockNavigate = () => {
        router.push('/stock');
    }

    const handlePortfolioNavigate = () => {
        router.push('/portfolio');
    }

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleConfirm = (birthday: string) => {
        if (birthday === process.env.NEXT_PUBLIC_BIRTHDAY) {
            router.push('/letter');
            return true;
        }
        return false;
    };

    return (
        <Container>
            <HomeCard
                title="포트폴리오"
                buttonText="보러가기"
                onClick={handlePortfolioNavigate}
            />
            <HomeCard
                title="초대장이 도착했습니다."
                buttonText="보러가기"
                onClick={handelNavigate}
            />
            <HomeCard
                title="편지가 도착했습니다."
                buttonText="보러가기"
                onClick={handleOpenModal}
            />
            <HomeCard
                title="주식 대시보드"
                buttonText="보러가기"
                onClick={handleStockNavigate}
            />
            <BirthdayModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
            />
        </Container>
    );
}
