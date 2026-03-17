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

const scrollX = keyframes`
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-50% - 0.75rem));
  }
`;

export const GlassCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, background 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.05);
  }
`;

export const GallerySection = styled.section`
  width: 100%;
  max-width: 1200px;
  margin-top: 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  animation: ${fadeInUp} 1s ease-out 0.4s both;
`;

export const GalleryTitle = styled.h2`
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
    background: linear-gradient(90deg, #38bdf8 0%, #818cf8 100%);
    border-radius: 2px;
  }
`;

export const GallerySliderContainer = styled.div`
  width: 100vw;
  max-width: 100%;
  overflow: hidden;
  padding: 1rem 0;
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
`;

export const GalleryTrack = styled.div`
  display: flex;
  gap: 1.5rem;
  width: max-content;
  animation: ${scrollX} 30s linear infinite;

  &:hover {
    animation-play-state: paused;
  }
`;

export const GalleryItem = styled(GlassCard)<{ delay?: number }>`
  flex: 0 0 300px;
  padding: 0.5rem;
  height: 350px;
  animation: ${fadeInUp} 0.8s ease-out ${({ delay }) => delay || 0}s both;

  .image-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 16px;
    overflow: hidden;
    
    img {
      transition: transform 0.5s ease;
    }
    
    &:hover img {
      transform: scale(1.1);
    }
  }
`;
