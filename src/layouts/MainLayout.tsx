import styled from '@emotion/styled';
import { Outlet } from 'react-router-dom';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;

export const MainLayout = () => {
    return (
        <Container>
            <Outlet />
        </Container>
    );
};
