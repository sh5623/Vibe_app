import { useEffect, useState } from 'react'

const roles = ['Frontend Developer', 'React / Next.js Developer', 'Vue.js / Nuxt.js Developer']

export default function Hero() {
  const [currentRole, setCurrentRole] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const role = roles[currentRole] ?? ''

    if (!isDeleting && displayText === role) {
      const t = setTimeout(() => setIsDeleting(true), 2500)
      return () => clearTimeout(t)
    }

    const delay = isDeleting ? 38 : 85
    const t = setTimeout(() => {
      if (isDeleting && displayText.length === 1) {
        setDisplayText('')
        setIsDeleting(false)
        setCurrentRole((p) => (p + 1) % roles.length)
      } else {
        setDisplayText((p) => (isDeleting ? p.slice(0, -1) : role.slice(0, p.length + 1)))
      }
    }, delay)

    return () => clearTimeout(t)
  }, [displayText, isDeleting, currentRole])

  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-center px-12 py-24 relative overflow-hidden max-[768px]:px-6 max-[768px]:pt-24 max-[768px]:pb-16"
    >
      {/* Orbs */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full pointer-events-none top-[-200px] right-[-150px] animate-[orbFloat_9s_ease-in-out_infinite] max-[768px]:w-[380px] max-[768px]:h-[380px] max-[768px]:top-[-100px] max-[768px]:right-[-80px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none bottom-[-80px] left-[-80px] animate-[orbFloat_13s_ease-in-out_infinite_reverse] max-[768px]:w-[280px] max-[768px]:h-[280px]"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)',
        }}
      />

      {/* Code Card */}
      <div
        className="absolute right-[7%] top-1/2 -translate-y-1/2 -rotate-[1.5deg] bg-white/95 backdrop-blur-[20px] border border-[rgba(79,70,229,0.14)] rounded-[14px] px-8 py-7 shadow-[0_24px_60px_rgba(79,70,229,0.14),0_0_0_1px_rgba(255,255,255,0.8)] text-[0.8rem] leading-[1.9] z-[1] min-w-[300px] max-[1100px]:hidden"
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        <div>
          <span className="text-[rgba(100,116,139,0.35)] mr-5 select-none">1</span>
          <span className="text-[#7c3aed]">const</span>{' '}
          <span className="text-[#c2410c]">developer</span> = {'{'}
        </div>
        <div>
          <span className="text-[rgba(100,116,139,0.35)] mr-5 select-none">2</span>&nbsp;&nbsp;
          <span className="text-[#0369a1]">name</span>:{' '}
          <span className="text-[#059669]">&quot;Seungho Lee&quot;</span>,
        </div>
        <div>
          <span className="text-[rgba(100,116,139,0.35)] mr-5 select-none">3</span>&nbsp;&nbsp;
          <span className="text-[#0369a1]">role</span>:{' '}
          <span className="text-[#059669]">&quot;Frontend Dev&quot;</span>,
        </div>
        <div>
          <span className="text-[rgba(100,116,139,0.35)] mr-5 select-none">4</span>&nbsp;&nbsp;
          <span className="text-[#0369a1]">stack</span>: [
          <span className="text-[#059669]">&quot;React&quot;</span>,{' '}
          <span className="text-[#059669]">&quot;Next&quot;</span>],
        </div>
        <div>
          <span className="text-[rgba(100,116,139,0.35)] mr-5 select-none">5</span>&nbsp;&nbsp;
          <span className="text-[#0369a1]">exp</span>:{' '}
          <span className="text-[#059669]">&quot;7+ years&quot;</span>,
        </div>
        <div>
          <span className="text-[rgba(100,116,139,0.35)] mr-5 select-none">6</span>
          {'}'}
        </div>
      </div>

      {/* Status Badge */}
      <div
        className="inline-flex items-center gap-[0.6rem] text-[0.72rem] text-[#64748b] tracking-[0.1em] mb-8 bg-white/85 border border-[rgba(79,70,229,0.12)] rounded-[100px] py-[0.4rem] pl-[0.65rem] pr-4 w-fit backdrop-blur-[10px] animate-[fadeUp_0.7s_ease_both] z-[1]"
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0 animate-[dotGlow_2.2s_ease-in-out_infinite]" />
        Available for work
      </div>

      <div
        className="text-[0.75rem] tracking-[0.3em] text-[#4f46e5] uppercase mb-5 animate-[fadeUp_0.7s_ease_0.05s_both] z-[1]"
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        Portfolio
      </div>

      <h1 className="text-[clamp(2.8rem,11vw,13rem)] font-extrabold leading-[0.95] tracking-[-0.03em] mb-6 animate-[fadeUp_0.7s_ease_0.1s_both] relative z-[1]">
        <span
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          SEUNG
        </span>
        <br />
        <span
          style={{
            WebkitTextStroke: '2px rgba(79,70,229,0.22)',
            color: 'transparent',
          }}
        >
          HO LEE
        </span>
      </h1>

      <div
        className="text-[clamp(0.9rem,2vw,1.2rem)] text-[#64748b] mb-12 animate-[fadeUp_0.7s_ease_0.2s_both] min-h-[2em] flex items-center relative z-[1]"
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        {displayText}
        <span className="inline-block w-[2px] h-[1.1em] bg-[#4f46e5] ml-[3px] align-middle animate-[blink_1s_step-end_infinite] shrink-0" />
      </div>

      <div className="flex gap-4 flex-wrap animate-[fadeUp_0.7s_ease_0.3s_both] relative z-[1]">
        <a
          href="#work"
          className="inline-flex items-center gap-2 py-[0.9rem] px-[2.25rem] bg-linear-to-br from-[#4f46e5] to-[#6d28d9] text-white no-underline rounded-[10px] transition-all duration-[250ms] shadow-[0_4px_20px_rgba(79,70,229,0.35)] hover:-translate-y-[3px] hover:shadow-[0_10px_32px_rgba(79,70,229,0.45)] max-[480px]:flex-1 max-[480px]:justify-center max-[480px]:px-6"
          style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          View Projects
        </a>
        <a
          href="#contact"
          className="inline-flex items-center gap-2 py-[0.9rem] px-[2.25rem] bg-white/90 text-[#4f46e5] border-[1.5px] border-[rgba(79,70,229,0.2)] no-underline rounded-[10px] transition-all duration-[250ms] backdrop-blur-[10px] hover:border-[#4f46e5] hover:bg-[rgba(79,70,229,0.06)] hover:-translate-y-[3px] hover:shadow-[0_6px_20px_rgba(79,70,229,0.12)] max-[480px]:flex-1 max-[480px]:justify-center max-[480px]:px-6"
          style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Get in Touch
        </a>
      </div>

      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[0.65rem] text-[#94a3b8] tracking-[0.25em] uppercase after:content-[''] after:w-px after:h-10 after:bg-linear-to-b after:from-[#4f46e5] after:to-transparent animate-[slideIn_0.8s_ease_0.6s_both] max-[768px]:hidden"
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        Scroll
      </div>
    </section>
  )
}
