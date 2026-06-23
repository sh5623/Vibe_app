import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

interface Project {
  num: string
  name: string
  desc: string
  tags: string[]
  href: string
}

const projects: Project[] = [
  {
    num: '01',
    name: 'fe-rail',
    desc: 'Claude Code 플러그인 — spec → build → review → PR 사이클을 자동화하는 프론트엔드 개발 자동화 도구. 한/EN 언어 토글, framer-motion 애니메이션, ux-ui-mastery 기반 컴포넌트 설계.',
    tags: ['Claude Code', 'Next.js', 'TypeScript', 'framer-motion', 'Emotion'],
    href: '/fe-rail',
  },
  {
    num: '02',
    name: 'Vibe App',
    desc: 'Next.js App Router 기반 AI를 활용한 웹사이트 구현.',
    tags: ['Next.js', 'TypeScript', 'Emotion', 'Recharts', 'React Query', 'Jotai'],
    href: '/',
  },
  {
    num: '03',
    name: 'Stock Dashboard',
    desc: '야후 파이낸스 API 연동 실시간 주식 차트 대시보드. 한글 종목명 검색, 코스피 지수 시각화, 폴백 데이터 처리 구현.',
    tags: ['Next.js', 'yahoo-finance2', 'Recharts', 'React Query', 'API Route'],
    href: '/stock',
  },
  {
    num: '04',
    name: 'Bambi Portfolio',
    desc: '반려견 파피용 밤비의 포트폴리오. 무한 자동 스크롤 갤러리, 드래그 & 터치 인터랙션, 모델링 작업 쇼케이스.',
    tags: ['Next.js', 'Emotion', 'Image Optimization', 'Canvas Animation'],
    href: '/portfolio',
  },
]

export default function Work() {
  return (
    <section
      id="work"
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
          [ 03 ]
        </span>
        <h2 className="text-[clamp(2.2rem,5.5vw,5rem)] font-extrabold tracking-[-0.025em] leading-[1] text-[#0f172a]">
          SELECTED WORK
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-6 max-[768px]:grid-cols-1">
        {projects.map((project) => (
          <Link
            key={project.num}
            to={project.href}
            className="relative block no-underline bg-white border border-[rgba(79,70,229,0.1)] rounded-[20px] p-10 cursor-pointer transition-all duration-300 overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[4px] before:bg-gradient-to-r before:from-[#4f46e5] before:to-[#06b6d4] before:scale-x-0 before:origin-left before:transition-transform before:duration-[350ms] before:rounded-tl-[20px] before:rounded-tr-[20px] hover:border-[rgba(79,70,229,0.2)] hover:-translate-y-[6px] hover:shadow-[0_20px_50px_rgba(79,70,229,0.12)] hover:before:scale-x-100 [&:hover_.arrow]:translate-x-1 [&:hover_.arrow]:-translate-y-1 [&:hover_.arrow]:text-[#4f46e5]"
          >
            <div className="flex justify-between items-start mb-6">
              <div
                className="text-[0.72rem] tracking-[0.2em] font-semibold"
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                #{project.num}
              </div>
              <ArrowUpRight
                size={18}
                className="arrow text-[rgba(100,116,139,0.35)] transition-all duration-300 shrink-0"
              />
            </div>
            <h3 className="text-[1.4rem] font-bold tracking-[-0.01em] mb-3 leading-[1.25] text-[#0f172a]">
              {project.name}
            </h3>
            <p className="text-[0.9rem] text-[#64748b] leading-[1.75] mb-7">{project.desc}</p>
            <div className="flex flex-wrap gap-[0.45rem]">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[0.65rem] text-[#64748b] bg-[rgba(100,116,139,0.07)] border border-[rgba(100,116,139,0.14)] rounded-[6px] py-1 px-[0.65rem] tracking-[0.04em]"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
