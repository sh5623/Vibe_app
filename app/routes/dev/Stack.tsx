import { motion, type Variants } from 'framer-motion'
import { EASE_OUT, fadeUp, popIn, SectionTitle, stagger, VIEWPORT } from './motion'

// 카테고리 옆 구분선이 왼쪽에서 그어진다
const lineDraw: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.9, ease: EASE_OUT } },
}

interface Skill {
  label: string
  accent?: boolean
}

interface SkillGroup {
  category: string
  items: Skill[]
}

const skills: SkillGroup[] = [
  {
    category: 'Frontend',
    items: [
      { label: 'React', accent: true },
      { label: 'Next.js', accent: true },
      { label: 'TypeScript', accent: true },
      { label: 'Vue.js', accent: true },
    ],
  },
  {
    category: 'Styling',
    items: [
      { label: 'Emotion CSS', accent: true },
      { label: 'Tailwind CSS', accent: true },
      { label: 'Responsive Design' },
    ],
  },
  {
    category: 'State & Data',
    items: [
      { label: 'Jotai', accent: true },
      { label: 'Redux', accent: true },
      { label: 'React Query', accent: true },
      { label: 'Vuex' },
      { label: 'REST API' },
    ],
  },
  {
    category: 'Build',
    items: [
      { label: 'Turborepo', accent: true },
      { label: 'Vite', accent: true },
    ],
  },
  {
    category: 'Tools',
    items: [
      { label: 'Git / GitHub / GitLab' },
      { label: 'Yarn / NPM' },
      { label: 'Recharts' },
      { label: 'Jira / Confluence' },
      { label: 'Figma' },
      { label: 'Slack' },
    ],
  },
]

export default function Stack() {
  return (
    <section
      id="stack"
      className="px-12 py-32 border-b border-[rgba(79,70,229,0.07)] relative max-[768px]:px-6 max-[768px]:py-20"
    >
      <SectionTitle index="02" title="TECH STACK" />

      {skills.map(({ category, items }) => (
        <motion.div
          key={category}
          className="mb-10 last:mb-0"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={stagger(0.045, 0.05)}
        >
          <div className="text-[0.7rem] tracking-[0.25em] text-[#4f46e5] uppercase mb-4 flex items-center gap-3">
            <motion.span variants={fadeUp} style={{ fontFamily: 'var(--font-mono), monospace' }}>
              {category}
            </motion.span>
            <motion.span
              aria-hidden="true"
              variants={lineDraw}
              className="h-px flex-1 origin-left bg-linear-to-r from-[rgba(79,70,229,0.25)] to-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-[0.6rem]">
            {items.map(({ label, accent }) => (
              // transition-all 대신 속성을 좁힌다 — popIn 의 transform·opacity 와 CSS 전환이 겹치지 않게
              <motion.div
                key={label}
                variants={popIn}
                className={`inline-flex items-center px-[1.1rem] py-2 rounded-[100px] text-[0.75rem] tracking-[0.05em] transition-[translate,box-shadow,border-color,color,background-color,--tw-gradient-from,--tw-gradient-to] duration-200 cursor-default ${
                  accent
                    ? 'bg-linear-to-r from-[rgba(79,70,229,0.1)] to-[rgba(6,182,212,0.1)] border-[1.5px] border-[rgba(79,70,229,0.25)] text-[#4f46e5] font-semibold hover:from-[rgba(79,70,229,0.18)] hover:to-[rgba(6,182,212,0.18)] hover:border-[#4f46e5] hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(79,70,229,0.2)]'
                    : 'bg-[rgba(100,116,139,0.07)] border border-[rgba(100,116,139,0.16)] text-[#64748b] hover:bg-[rgba(79,70,229,0.05)] hover:border-[#4f46e5] hover:text-[#4f46e5] hover:-translate-y-0.5'
                }`}
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              >
                {label}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </section>
  )
}
