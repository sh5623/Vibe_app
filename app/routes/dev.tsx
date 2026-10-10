import { MotionConfig, motion, useScroll, useSpring } from 'framer-motion'
import type { Route } from './+types/dev'
import About from './dev/About'
import Contact from './dev/Contact'
import Hero from './dev/Hero'
import Marquee from './dev/Marquee'
import { GRADIENT } from './dev/motion'
import Navigation from './dev/Navigation'
import Stack from './dev/Stack'
import Work from './dev/Work'

export function meta(_: Route.MetaArgs) {
  return [{ title: '이승호 Portfolio | Vibe' }]
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 24, restDelta: 0.001 })
  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[101]"
      style={{ scaleX, background: GRADIENT }}
    />
  )
}

export default function DevPortfolio() {
  return (
    <MotionConfig reducedMotion="user">
      <div
        className="dev-portfolio min-h-screen overflow-x-hidden text-[#0f172a]"
        style={{
          backgroundColor: '#f0f4ff',
          backgroundImage: 'radial-gradient(rgba(79,70,229,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          fontFamily: 'var(--font-syne), sans-serif',
        }}
      >
        <ScrollProgress />
        <Navigation />
        <Hero />
        <Marquee />
        <About />
        <Stack />
        <Work />
        <Contact />
      </div>
    </MotionConfig>
  )
}
