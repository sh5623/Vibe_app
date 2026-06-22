import type { Route } from './+types/dev';
import Navigation from './dev/Navigation';
import Hero from './dev/Hero';
import Marquee from './dev/Marquee';
import About from './dev/About';
import Stack from './dev/Stack';
import Work from './dev/Work';
import Contact from './dev/Contact';

export function meta(_: Route.MetaArgs) {
  return [{ title: '이승호 Portfolio | Vibe' }];
}

export default function DevPortfolio() {
  return (
    <div
      className="min-h-screen overflow-x-hidden text-[#0f172a]"
      style={{
        backgroundColor: '#f0f4ff',
        backgroundImage: 'radial-gradient(rgba(79,70,229,0.07) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        fontFamily: 'var(--font-syne), sans-serif',
      }}
    >
      <Navigation />
      <Hero />
      <Marquee />
      <About />
      <Stack />
      <Work />
      <Contact />
    </div>
  );
}
