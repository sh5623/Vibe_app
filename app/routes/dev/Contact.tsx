import { motion } from 'framer-motion'
import { gradientText, Magnetic, maskUp, stagger, VIEWPORT } from './motion'

export default function Contact() {
  return (
    <>
      <section
        id="contact"
        className="px-12 pt-48 pb-32 text-center relative overflow-hidden bg-linear-to-br from-[rgba(79,70,229,0.05)] to-[rgba(6,182,212,0.04)] max-[768px]:px-6 max-[768px]:pt-32 max-[768px]:pb-20"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 65%)',
          }}
        />

        {/* 세 줄이 마스크 안에서 차례로 올라온다 */}
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.12)}
          className="text-[clamp(2.5rem,9vw,10rem)] font-extrabold leading-[1] mb-14 relative tracking-[-0.025em] text-[#0f172a]"
        >
          <span className="block overflow-clip pb-[0.06em]">
            <motion.span variants={maskUp} className="block">
              LET&apos;S
            </motion.span>
          </span>
          <span className="block overflow-clip pb-[0.06em]">
            <motion.span variants={maskUp} className="block">
              <span style={gradientText}>WORK</span>
            </motion.span>
          </span>
          <span className="block overflow-clip pb-[0.06em]">
            <motion.span variants={maskUp} className="block">
              TOGETHER
            </motion.span>
          </span>
        </motion.h2>

        <div className="flex justify-center gap-5 flex-wrap relative">
          <Magnetic>
            <a
              href="mailto:sh5623789@naver.com"
              className="inline-flex items-center gap-[0.6rem] py-[0.85rem] px-8 bg-white text-[#64748b] border-[1.5px] border-[rgba(79,70,229,0.14)] no-underline rounded-[10px] transition-all duration-[250ms] shadow-[0_2px_8px_rgba(79,70,229,0.06)] hover:text-[#4f46e5] hover:border-[#4f46e5] hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(79,70,229,0.16)] max-[480px]:text-[0.75rem] max-[480px]:px-6 max-[480px]:py-3"
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.82rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Email
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="https://github.com/sh5623"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[0.6rem] py-[0.85rem] px-8 bg-white text-[#64748b] border-[1.5px] border-[rgba(79,70,229,0.14)] no-underline rounded-[10px] transition-all duration-[250ms] shadow-[0_2px_8px_rgba(79,70,229,0.06)] hover:text-[#4f46e5] hover:border-[#4f46e5] hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(79,70,229,0.16)] max-[480px]:text-[0.75rem] max-[480px]:px-6 max-[480px]:py-3"
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.82rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              GitHub
            </a>
          </Magnetic>
        </div>
      </section>

      <footer
        className="px-12 py-8 flex justify-between items-center border-t border-[rgba(79,70,229,0.08)] text-[#94a3b8] tracking-[0.1em] max-[768px]:px-6 max-[768px]:py-6 max-[768px]:flex-col max-[768px]:gap-2 max-[768px]:text-center"
        style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.68rem' }}
      >
        <span>© 2026 이승호</span>
        <span>Built with React Router 7 + Tailwind</span>
      </footer>
    </>
  )
}
