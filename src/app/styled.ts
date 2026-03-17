import styled from '@emotion/styled';

export const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 20px;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;
