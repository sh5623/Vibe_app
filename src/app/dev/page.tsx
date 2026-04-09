'use client';

import { Global, css } from '@emotion/react';
import { PageWrapper } from './styled';

import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import About from './components/About';
import Stack from './components/Stack';
import Work from './components/Work';
import Contact from './components/Contact';

export default function DevPortfolio() {
  return (
    <>
      <Global
        styles={css`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&display=swap');

          html {
            scroll-behavior: smooth;
          }

          *,
          *::before,
          *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          ::-webkit-scrollbar {
            width: 4px;
          }
          ::-webkit-scrollbar-track {
            background: #0a0a0a;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(173, 255, 47, 0.4);
            border-radius: 2px;
          }
        `}
      />

      <PageWrapper>
        <Navigation />
        <Hero />
        <Marquee />
        <About />
        <Stack />
        <Work />
        <Contact />
      </PageWrapper>
    </>
  );
}
