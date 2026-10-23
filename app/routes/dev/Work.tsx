import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'
import { fadeUp, gradientText, SectionTitle, SPRING, tiltFromPointer, VIEWPORT } from './motion'

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
    desc: 'spec → build → review → PR 사이클을 자동화하는 Claude Code 프론트엔드 개발 하네스. 전용 에이전트·스킬과 차단/경고 훅으로 구성되고, 검증 결과를 exit code·리비전과 함께 PR 본문까지 전달. 회귀 eval과 plugin validate --strict를 릴리스마다 통과.',
    tags: ['Claude Code', 'Next.js', 'Vite', 'TypeScript', 'Hooks', 'Eval'],
    href: '/fe-rail',
  },
  {
    num: '02',
    name: 'self-improvement',
    desc: '규약·문서·절차에 물리면 그 자리만 우회하지 않고 규약 자체를 고치는 증거 기반 자가개선 Claude Code 플러그인. 감지→분류→검증→규약화→전파→기록 6단계 프로토콜, 문서 층 모델, 기존 시스템을 표 이식 없이 등록하는 형식 맵.',
    tags: ['Claude Code', 'Markdown', 'Hooks', 'Automation'],
    href: '/self-improvement',
  },
  {
    num: '03',
    name: 'parallel-worktree',
    desc: '격리된 git 워크트리에서 코딩 서브에이전트를 병렬로 돌리고 끝난 것부터 수확해 상류에 올리는 Claude Code 스킬. 오케스트레이터 컨텍스트 비용을 모델링해 잡일을 트랙으로 밀어내고, 수확 순서·통합 워크트리 고정·배포 전 검증을 런북으로 고정.',
    tags: ['Claude Code', 'git worktree', 'Orchestration', 'Runbook'],
    href: '/parallel-worktree',
  },
  {
    num: '04',
    name: 'e2e-rail',
    desc: '변경이 닿을 수 있는 Playwright spec만 근거와 함께 고르는 Claude Code · Codex 플러그인. 모든 실행을 검증한 코드의 지문에 묶어 원장에 남기고, 측정값으로 워커와 샤드를 정하며, 판정할 수 없으면 좁히지 않고 전수로 넓힙니다. 섀도 모드에서 선택의 hit을 쌓은 뒤에만 사람이 승격.',
    tags: ['Claude Code', 'Codex', 'Playwright', 'Node CLI', 'CI Sharding'],
    href: '/e2e-rail',
  },
  {
    num: '05',
    name: 'Stock Dashboard',
    desc: '야후 파이낸스 API 연동 실시간 주식 차트 대시보드. 한글 종목명 검색, 코스피 지수 시각화, 폴백 데이터 처리 구현.',
    tags: ['React Router 7', 'yahoo-finance2', 'Recharts', 'TanStack Query', 'Resource Route'],
    href: '/stock',
  },
  {
    num: '06',
    name: 'Bambi Portfolio',
    desc: '반려견 파피용 밤비의 포트폴리오. 무한 자동 스크롤 갤러리, 드래그 & 터치 인터랙션, 모델링 작업 쇼케이스.',
    tags: ['Next.js', 'Emotion', 'Image Optimization', 'Canvas Animation'],
    href: '/portfolio',
  },
]

interface ProjectCardProps {
  project: Project
  index: number
}

/** 커서를 따라 기우는 카드 + 커서 위치에 켜지는 스포트라이트. 등장은 뷰포트 진입 시 1회. */
function ProjectCard({ project, index }: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const rotateX = useSpring(0, SPRING)
  const rotateY = useSpring(0, SPRING)
  const spotX = useMotionValue(-1000)
  const spotY = useMotionValue(-1000)
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${spotX}px ${spotY}px, rgba(79,70,229,0.10), transparent 65%)`

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    spotX.set(e.clientX - rect.left)
    spotY.set(e.clientY - rect.top)
    if (reduceMotion) return
    const tilt = tiltFromPointer(e.clientX, e.clientY, rect, 5)
    rotateX.set(tilt.rotateX)
    rotateY.set(tilt.rotateY)
  }

  function handlePointerLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={fadeUp}
      custom={(index % 2) * 0.1}
      className="h-full"
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Link
        to={project.href}
        className="group relative block h-full no-underline bg-white border border-[rgba(79,70,229,0.1)] rounded-[20px] p-10 cursor-pointer transition-all duration-300 overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[4px] before:bg-linear-to-r before:from-[#4f46e5] before:to-[#06b6d4] before:scale-x-0 before:origin-left before:transition-transform before:duration-[350ms] before:rounded-tl-[20px] before:rounded-tr-[20px] hover:border-[rgba(79,70,229,0.2)] hover:-translate-y-[6px] hover:shadow-[0_20px_50px_rgba(79,70,229,0.12)] hover:before:scale-x-100 [&:hover_.arrow]:translate-x-1 [&:hover_.arrow]:-translate-y-1 [&:hover_.arrow]:text-[#4f46e5]"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: spotlight }}
        />
        <div className="relative">
          <div className="flex justify-between items-start mb-6">
            <div
              className="text-[0.72rem] tracking-[0.2em] font-semibold"
              style={{ fontFamily: 'var(--font-mono), monospace', ...gradientText }}
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
        </div>
      </Link>
    </motion.div>
  )
}

export default function Work() {
  return (
    <section
      id="work"
      className="px-12 py-32 border-b border-[rgba(79,70,229,0.07)] relative max-[768px]:px-6 max-[768px]:py-20"
    >
      <SectionTitle index="03" title="SELECTED WORK" />

      <div className="grid grid-cols-2 gap-6 max-[768px]:grid-cols-1">
        {projects.map((project, index) => (
          <ProjectCard key={project.num} project={project} index={index} />
        ))}
      </div>
    </section>
  )
}
