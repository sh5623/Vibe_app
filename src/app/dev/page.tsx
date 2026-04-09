'use client';

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
    <PageWrapper>
      <Navigation />
      <Hero />
      <Marquee />
      <About />
      <Stack />
      <Work />
      <Contact />
    </PageWrapper>
  );
}

