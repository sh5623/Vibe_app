import styled from '@emotion/styled';

export const Card = styled.div`
  max-width: 420px;
  width: 100%;
  background-color: #ffffff;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
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
    padding: 30px 20px;

    &::before {
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
    }
  }
`;

export const Header = styled.h1`
  font-size: 1.8rem;
  font-weight: 400;
  color: #5d4037;
  margin-bottom: 30px;
  letter-spacing: -0.02em;
  margin-top: 10px;

  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
`;

export const ImageContainer = styled.div`
  width: 100%;
  margin-bottom: 40px;
  position: relative;
  
  img {
    width: 100% !important;
    height: auto !important;
    border-radius: 150px 150px 20px 20px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    display: block;
    object-fit: cover;
  }
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 0 10px;
  z-index: 1; 
`;

export const InvitationTitle = styled.h2`
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 1.4rem;
  color: #a89f91;
  letter-spacing: 0.15em;
  font-weight: 400;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

export const Divider = styled.div`
  width: 40px;
  height: 1px;
  background-color: #e0d8c8;
  margin: 10px auto 20px;
`;

export const DetailText = styled.p`
  font-size: 1.1rem;
  color: #6d6d6d;
  margin: 4px 0;
  line-height: 1.7;
  white-space: pre-wrap;
  
  &.date {
    font-weight: 600;
    color: #4a4a4a;
    font-size: 1.2rem;
  }
  
    &.location {
    color: #8c7b75;
    
    a {
      color: #6d6d6d;
      text-decoration: underline;
      font-size: 0.9rem;
      margin-left: 5px;
      
      &:hover {
        color: #4a4a4a;
      }
    }
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    
    &.date {
      font-size: 1.1rem;
    }
  }
`;
