'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeCard } from '../components/HomeCard';
import { BirthdayModal } from '../components/BirthdayModal';
import styled from '@emotion/styled';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 20px;
`;

export default function Home() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // const handelNavigate = () => {
    //     router.push('/invitation');
    // }

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
            {/* <HomeCard
                title="초대장이 도착했습니다."
                buttonText="보러가기"
                onClick={handelNavigate}
            /> */}
            <HomeCard
                title="편지가 도착했습니다."
                buttonText="보러가기"
                onClick={handleOpenModal}
            />
            <BirthdayModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
            />
        </Container>
    );
}
