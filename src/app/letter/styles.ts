'use client';

import styled from '@emotion/styled';

export const Container = styled.div`
  min-height: 100vh;
  padding: 60px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f6f2;
`;

export const Paper = styled.div`
  max-width: 500px;
  width: 100%;
  background-color: #ffffff;
  border-radius: 4px;
  padding: 60px 50px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  position: relative;
  min-height: 600px;
  display: flex;
  flex-direction: column;

  /* Paper texture effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(rgba(224, 216, 200, 0.2) 1px, transparent 1px);
    background-size: 100% 32px;
    background-position: 0 54px;
    pointer-events: none;
    border-radius: 4px;
  }

  @media (max-width: 480px) {
    padding: 40px 30px;
    min-height: 500px;
  }
`;

export const ToSection = styled.div`
  font-size: 1.2rem;
  color: #5d4037;
  margin-bottom: 40px;
  font-family: 'Gowun Dodum', sans-serif;
  border-bottom: 1px solid #e0d8c8;
  padding-bottom: 8px;
  width: fit-content;
  min-width: 100px;
`;

export const ContentSection = styled.div`
  flex: 1;
  font-size: 1.1rem;
  color: #5d4037;
  line-height: 1.8;
  font-family: 'Gowun Dodum', sans-serif;
  margin-bottom: 40px;

  z-index: 1;
`;

export const FromSection = styled.div`
  text-align: right;
  font-size: 1.1rem;
  color: #5d4037;
  font-family: 'Gowun Dodum', sans-serif;
  margin-top: auto;
`;
