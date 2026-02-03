import styled from '@emotion/styled';

export const Container = styled.div`
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f9f7f2;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 20px;
  font-family: 'Gowun Dodum', sans-serif;

  @media (max-width: 480px) {
    padding: 10px;
  }
`;
