interface Skill {
  label: string;
  accent?: boolean;
}

interface SkillGroup {
  category: string;
  items: Skill[];
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
];

export default function Stack() {
  return (
    <section
      id="stack"
      className="px-12 py-32 border-b border-[rgba(79,70,229,0.07)] relative max-[768px]:px-6 max-[768px]:py-20"
    >
      <div className="flex items-baseline gap-6 mb-20 max-[768px]:mb-12 max-[768px]:flex-col max-[768px]:gap-2">
        <span
          className="text-[0.75rem] tracking-[0.25em] font-semibold shrink-0"
          style={{
            fontFamily: 'var(--font-mono), monospace',
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          [ 02 ]
        </span>
        <h2 className="text-[clamp(2.2rem,5.5vw,5rem)] font-extrabold tracking-[-0.025em] leading-[1] text-[#0f172a]">
          TECH STACK
        </h2>
      </div>

      {skills.map(({ category, items }) => (
        <div key={category} className="mb-10 last:mb-0">
          <div
            className="text-[0.7rem] tracking-[0.25em] text-[#4f46e5] uppercase mb-4 flex items-center gap-3 after:content-[''] after:h-px after:bg-gradient-to-r after:from-[rgba(79,70,229,0.25)] after:to-transparent after:flex-1"
            style={{ fontFamily: 'var(--font-mono), monospace' }}
          >
            {category}
          </div>
          <div className="flex flex-wrap gap-[0.6rem]">
            {items.map(({ label, accent }) => (
              <div
                key={label}
                className={`inline-flex items-center px-[1.1rem] py-2 rounded-[100px] text-[0.75rem] tracking-[0.05em] transition-all duration-200 cursor-default ${
                  accent
                    ? 'bg-gradient-to-r from-[rgba(79,70,229,0.1)] to-[rgba(6,182,212,0.1)] border-[1.5px] border-[rgba(79,70,229,0.25)] text-[#4f46e5] font-semibold hover:from-[rgba(79,70,229,0.18)] hover:to-[rgba(6,182,212,0.18)] hover:border-[#4f46e5] hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(79,70,229,0.2)]'
                    : 'bg-[rgba(100,116,139,0.07)] border border-[rgba(100,116,139,0.16)] text-[#64748b] hover:bg-[rgba(79,70,229,0.05)] hover:border-[#4f46e5] hover:text-[#4f46e5] hover:-translate-y-0.5'
                }`}
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
