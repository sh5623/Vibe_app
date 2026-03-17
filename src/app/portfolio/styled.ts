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

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

export const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%);
  color: #fff;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
`;

export const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 4rem;
  animation: ${fadeInUp} 1s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

export const Title = styled.h1`
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.05em;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
`;

export const Subtitle = styled.p`
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  color: #94a3b8;
  margin-top: 1rem;
  font-weight: 300;
`;

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  width: 100%;
  max-width: 1200px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }

  .info-column {
    display: flex;
    flex-direction: column;
    gap: 2rem;
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

export const ImageCard = styled(GlassCard)`
  padding: 1rem;
  height: 500px;
  display: flex;
  animation: ${fadeInUp} 1s ease-out 0.2s both;

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
      transform: scale(1.05);
    }
  }
`;

export const InfoCard = styled(GlassCard)<{ delay?: number }>`
  background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: ${fadeInUp} 1s ease-out ${({ delay }) => delay || 0}s both;

  .icon {
    margin-bottom: 1rem;
    animation: ${float} 3s ease-in-out infinite;
  }

  h3 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: #e2e8f0;
    font-weight: 600;
  }

  p {
    font-size: 1.2rem;
    color: #cbd5e1;
    margin-bottom: 0.8rem;
    line-height: 1.6;
  }
`;

export const HighlightText = styled.span`
  color: #fff;
  font-weight: 700;
  background: linear-gradient(90deg, #38bdf8 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const FeatureItem = styled.li`
  font-size: 1.2rem;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const InstagramButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  color: white;
  text-decoration: none;
  border-radius: 30px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 15px rgba(220, 39, 67, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(220, 39, 67, 0.5);
  }
`;

export * from './gallery.styled';
export * from './works.styled';
