import styled from '@emotion/styled';

export const Card = styled.div`
  max-width: 420px;
  width: 100%;
  background-color: #ffffff;
  border-radius: 20px;
  padding: 60px 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 15px;
    left: 15px;
    right: 15px;
    bottom: 15px;
    border: 1px solid #e0d8c8;
    border-radius: 12px;
    pointer-events: none;
  }

  @media (max-width: 480px) {
    padding: 40px 20px;

    &::before {
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
    }
  }
`;

export const Title = styled.h1`
  font-size: 2rem;
  font-weight: 400;
  color: #5d4037;
  letter-spacing: -0.02em;
  margin: 0;
  
  span {
    display: block;
    margin-top: 8px;
    font-size: 1.2rem;
    color: #8c7b75;
  }

  @media (max-width: 480px) {
    font-size: 1.6rem;
    
    span {
      font-size: 1rem;
    }
  }
`;

export const Button = styled.button`
  background-color: #8c7b75;
  color: #ffffff;
  border: none;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-family: 'Gowun Dodum', sans-serif;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(93, 64, 55, 0.2);
  z-index: 1;

  &:hover {
    background-color: #5d4037;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(93, 64, 55, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 480px) {
    padding: 14px 28px;
    font-size: 1rem;
  }
`;
