import { motion } from 'framer-motion'

export interface SkillCardProps {
  icon: string
  name: string
  title: string
  desc: string
  cmd: string
  onClick: () => void
}

export function SkillCard({ icon, name, title, desc, cmd, onClick }: SkillCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      role="button"
      tabIndex={0}
      aria-label={`${name}: ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="relative w-full bg-white/[0.04] border-[1.5px] border-[rgba(99,102,241,0.15)] rounded-[20px] p-8 text-left cursor-pointer overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-[border-color,box-shadow,background] duration-[250ms] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-linear-to-r before:from-[#6366f1] before:to-[#34d399] before:scale-x-0 before:origin-left before:transition-transform before:duration-[350ms] before:rounded-tl-[20px] before:rounded-tr-[20px] hover:border-[rgba(99,102,241,0.35)] hover:shadow-[0_18px_48px_rgba(99,102,241,0.18)] hover:bg-white/[0.07] hover:before:scale-x-100 focus-visible:outline-2 focus-visible:outline-[#818cf8] focus-visible:outline-offset-[3px] active:scale-[0.985] max-[768px]:p-6"
    >
      <div className="w-[52px] h-[52px] rounded-[14px] bg-linear-to-br from-[rgba(99,102,241,0.12)] to-[rgba(52,211,153,0.08)] border border-[rgba(99,102,241,0.16)] flex items-center justify-center text-[1.5rem] mb-5 shrink-0">
        {icon}
      </div>
      <div
        className="text-[0.82rem] text-[#818cf8] font-bold tracking-[0.06em] mb-[0.35rem]"
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        {name}
      </div>
      <h3 className="text-[1.15rem] font-bold text-[#f1f5f9] tracking-[-0.015em] mb-3 leading-[1.3]">
        {title}
      </h3>
      <p className="text-[0.84rem] text-[#64748b] leading-[1.8] mb-5">{desc}</p>
      <span
        className="inline-flex items-center text-[0.68rem] text-[#34d399] bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.2)] rounded-[8px] py-[0.28rem] px-3 tracking-[0.04em] font-medium"
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        {cmd}
      </span>
    </motion.button>
  )
}
