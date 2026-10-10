import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { EASE_OUT, GRADIENT, gradientText } from './motion'

const sections = ['about', 'stack', 'work', 'contact'] as const

/** 화면 중앙 띠(45~50%)를 지나는 섹션을 현재 섹션으로 본다. 히어로로 돌아가면 null. */
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          setActive((prev) => (entry.isIntersecting ? id : prev === id ? null : prev))
        }
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    for (const id of sections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return active
}

export default function Navigation() {
  const active = useActiveSection()

  return (
    <motion.nav
      initial={{ y: '-100%', opacity: 0 }}
      animate={{ y: '0%', opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
      className="fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-12 py-5 bg-[rgba(240,244,255,0.88)] backdrop-blur-[20px] border-b border-[rgba(79,70,229,0.1)] max-[768px]:px-6 max-[768px]:py-4"
    >
      <div
        className="text-[0.88rem] font-bold tracking-[0.15em] uppercase"
        style={{ fontFamily: 'var(--font-mono), monospace', ...gradientText }}
      >
        SH.DEV
      </div>
      <div className="flex gap-10 items-center max-[768px]:gap-4 max-[420px]:gap-3">
        {sections.map((id) => {
          const isActive = active === id
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-current={isActive ? 'location' : undefined}
              className={`relative text-[0.75rem] no-underline tracking-[0.12em] uppercase transition-colors duration-200 hover:text-[#4f46e5] after:content-[''] after:absolute after:-bottom-[3px] after:left-0 after:w-0 after:h-[1.5px] after:bg-linear-to-r after:from-[#4f46e5] after:to-[#06b6d4] after:transition-[width] after:duration-[250ms] hover:after:w-full max-[480px]:text-[0.68rem] ${
                isActive ? 'text-[#4f46e5]' : 'text-[#64748b]'
              }`}
              style={{ fontFamily: 'var(--font-mono), monospace' }}
            >
              {id.charAt(0).toUpperCase() + id.slice(1)}
              {isActive && (
                <motion.span
                  layoutId="dev-nav-underline"
                  aria-hidden="true"
                  className="absolute -bottom-[3px] left-0 right-0 h-[1.5px]"
                  style={{ background: GRADIENT }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </a>
          )
        })}
      </div>
    </motion.nav>
  )
}
