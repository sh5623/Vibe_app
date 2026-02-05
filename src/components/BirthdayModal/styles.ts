import styled from '@emotion/styled';

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

export const ModalContainer = styled.div`
  background-color: #ffffff;
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    bottom: 10px;
    border: 1px solid #e0d8c8;
    border-radius: 12px;
    pointer-events: none;
  }
`;

export const Message = styled.p`
  font-size: 1.1rem;
  color: #5d4037;
  margin-bottom: 24px;
  font-family: 'Gowun Dodum', sans-serif;
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 1.2rem;
  text-align: center;
  border: 1px solid #e0d8c8;
  border-radius: 8px;
  margin-bottom: 8px;
  outline: none;
  color: #5d4037;
  font-family: 'Gowun Dodum', sans-serif;

  &:focus {
    border-color: #8c7b75;
  }

  &::placeholder {
    color: #c4b6b1;
  }
`;

export const ErrorMessage = styled.p`
  color: #e57373;
  font-size: 0.85rem;
  margin-bottom: 16px;
  min-height: 1.2em;
  font-family: 'Gowun Dodum', sans-serif;
`;

export const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

export const Button = styled.button<{ primary?: boolean }>`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  font-family: 'Gowun Dodum', sans-serif;
  transition: all 0.2s ease;
  background-color: ${props => props.primary ? '#8c7b75' : '#f5f5f5'};
  color: ${props => props.primary ? '#ffffff' : '#8c7b75'};

  &:hover {
    background-color: ${props => props.primary ? '#5d4037' : '#eeeeee'};
  }
`;
