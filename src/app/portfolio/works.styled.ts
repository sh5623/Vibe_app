import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const WorkSection = styled.section`
  width: 100%;
  max-width: 1200px;
  margin-top: 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  animation: ${fadeInUp} 1s ease-out 0.3s both;
`;

export const WorkTitle = styled.h2`
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 2rem;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #f43f5e 0%, #fbbf24 100%);
    border-radius: 2px;
  }
`;

export const WorkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
`;

export const WorkCard = styled.a<{ delay?: number }>`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${fadeInUp} 0.8s ease-out ${({ delay }) => delay || 0}s both;
  transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    
    .image-wrapper img {
      transform: scale(1.08);
    }
  }

  .image-wrapper {
    position: relative;
    width: 100%;
    height: 250px;
    border-radius: 16px;
    overflow: hidden;
    
    img {
      transition: transform 0.5s ease;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    h3 {
      font-size: 1.4rem;
      color: #fff;
      margin: 0;
      font-weight: 600;
    }

    p {
      font-size: 1rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }

    .link-text {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #f43f5e;
      font-weight: 600;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }
  }
`;
