'use client';

import styled from '@emotion/styled';
import { InvitationCard } from '../../components/InvitationCard';

const Container = styled.div`
  min-height: 100vh;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default function InvitationPage() {
    return (
        <Container>
            <InvitationCard />
        </Container>
    );
}
