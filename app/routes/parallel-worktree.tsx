import { motion, type Variants } from 'framer-motion'
import {
  ArrowRight,
  Ban,
  ChevronDown,
  Github,
  GitMerge,
  Layers,
  ShieldAlert,
  Split,
  Timer,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Route } from './+types/parallel-worktree'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'parallel-worktree | Claude Code Skill' },
    {
      name: 'description',
      content:
        '한 명의 오케스트레이터가 격리된 git worktree 여러 개에서 서브에이전트를 병렬로 돌리고, 끝난 것부터 순서대로 수확하는 Claude Code 스킬.',
    },
  ]
}

interface CompareRow {
  hoped: string
  reality: string
}

const COMPARE_ROWS: CompareRow[] = [
  { hoped: '작업 트리', reality: '두 세션이 같은 체크아웃에 쓴다. 누구도 소유하지 않는다' },
  { hoped: 'git 인덱스', reality: 'index.lock 충돌. 쓰는 쪽은 둘, 락은 하나' },
  {
    hoped: '게이트',
    reality:
      '여전히 순차 실행이다. 더 나쁘게는, 동시 실행이 테스트 파일 515개 중 134개를 건너뛰고 green을 보고한 적이 있다',
  },
  {
    hoped: '컨텍스트 비용',
    reality: '진짜 독립된 작업일 때만 준다. 같은 레포를 보는 두 세션은 결국 같은 상태를 또 읽는다',
  },
]

interface CostPoint {
  n: number
  quad: number
  linear: number
}

const COST_POINTS: CostPoint[] = [
  { n: 0, quad: 0, linear: 0 },
  { n: 50, quad: 4_283_750, linear: 3_100_000 },
  { n: 100, quad: 10_935_000, linear: 6_200_000 },
  { n: 150, quad: 19_953_750, linear: 9_300_000 },
  { n: 200, quad: 31_340_000, linear: 12_400_000 },
  { n: 250, quad: 45_093_750, linear: 15_500_000 },
  { n: 300, quad: 61_215_000, linear: 18_600_000 },
  { n: 319, quad: 67_961_934, linear: 19_778_000 },
]

const CHART_W = 600
const CHART_H = 260
const PAD_L = 46
const PAD_R = 16
const PAD_T = 20
const PAD_B = 34
const MAX_N = 319
const MAX_V = 68_000_000

function xAt(n: number): number {
  return PAD_L + (n / MAX_N) * (CHART_W - PAD_L - PAD_R)
}

function yAt(v: number): number {
  return CHART_H - PAD_B - (v / MAX_V) * (CHART_H - PAD_T - PAD_B)
}

const quadPath = COST_POINTS.map(
  (p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p.n)} ${yAt(p.quad)}`
).join(' ')
const linearPath = COST_POINTS.map(
  (p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p.n)} ${yAt(p.linear)}`
).join(' ')
const areaPath = `${quadPath} L ${xAt(MAX_N)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`

const POINT_30 = { n: 30, quad: 2_286_150 }
const POINT_319 = { n: 319, quad: 67_961_934 }

interface FailureRow {
  n: string
  title: string
  tell: string
}

const FAILURES: FailureRow[] = [
  {
    n: '1',
    title: '더러운 트리에서 git checkout <file>',
    tell: '그날 작업이 지워지는데 --stat은 "1 file changed"라고만 말한다',
  },
  {
    n: '2',
    title: '분할 시리즈의 첫 커밋이 게이트를 깬다',
    tell: '내 트리엔 두 커밋이 다 적용돼 있는데, 남의 base는 하나뿐이다',
  },
  {
    n: '3',
    title: '부재 단언이 채널 이동을 못 따라간다',
    tell: '페이로드가 다른 곳으로 옮겨가도 "없음" 자체는 그대로 없다',
  },
  {
    n: '4',
    title: '컨벤션이 틀려서 뮤테이션이 살아남는다',
    tell: '규칙이 라이브러리의 "기본 동작"을 인용한다. 그 버전 소스를 직접 읽어야 한다',
  },
  {
    n: '5',
    title: '규칙이 있었는데도 재발했다',
    tell: '체크를 요구하는 컨벤션은 결국 도구가 돼야 한다',
  },
  {
    n: '6',
    title: '안전장치를 우회했고, 그 우회가 기록으로 남았다',
    tell: '어떤 게이트도 못 잡는다. 오염되는 건 코드가 아니라 인수인계 문서다',
  },
]

interface Condition {
  label: string
  desc: string
}

const CONDITIONS: Condition[] = [
  { label: '작업 단위가 30분 이상', desc: '그 아래면 세션당 고정 오버헤드가 이득을 잡아먹는다' },
  {
    label: '트랙이 진짜로 안 겹친다',
    desc: '두 트랙을 같은 파일에 억지로 얹으면 수확 시점에 병렬성을 도로 잃는다',
  },
  { label: '실제 게이트가 있다', desc: 'lint·타입·테스트 없이는 "수확"이 검증할 대상이 없다' },
  {
    label: '머신이 버틴다',
    desc: '워크트리마다 각자의 의존성 트리·컴파일러·테스트 러너를 짊어진다',
  },
]

interface CycleStep {
  n: string
  label: string
  desc: string
}

const CYCLE: CycleStep[] = [
  { n: '1', label: '측정', desc: '인수인계 노트 + git으로 현재 상태 확인' },
  { n: '2', label: '분리', desc: '겹치지 않는 트랙을 골라 금지 목록으로 분리' },
  { n: '3', label: '브리핑', desc: '투입 전에 파일로 자리에 둔다. 프롬프트엔 경로만' },
  { n: '3a', label: '점검', desc: '투입 직후 한 턴. base가 맞나? 브리프·env 복사' },
  { n: '4', label: '침묵', desc: '0턴. 공짜다. 잡일도 폴링도 하지 않는다' },
  { n: '5', label: '수확', desc: '아직 도나? 커밋 고정 → rebase → 충돌 → 게이트 → push' },
  { n: '6', label: '확인', desc: '치우기 전에 다시 본다. 아직 도는 중인가?' },
  { n: '7', label: '기록', desc: '인수인계 노트 갱신 + 다음 브리프를 파일로' },
  { n: '8', label: '클리어', desc: '클리어가 먼저, 그다음 3으로 투입' },
]

interface ReleaseItem {
  title: string
  fix: string
}

const RELEASE_0_4_0: ReleaseItem[] = [
  {
    title: 'SKILL.md frontmatter가 유효한 YAML이 아니었다',
    fix: 'description 안의 따옴표 없는 trouble: 이 메타데이터를 통째로 떨어뜨려 스킬이 트리거되지 않았다. 블록 스칼라로 고쳤고, CI가 매 푸시마다 frontmatter를 파싱한다',
  },
  {
    title: '게이트 생략 판별이 루트 설정 변경을 통과시켰다',
    fix: '문서·라운드 폴더만 바뀌었을 때만 게이트를 건너뛴다. 루트 설정·의존성 변경은 전체 게이트를 돈다',
  },
  {
    title: '로그로 받아 grep 하는 한 줄이 게이트의 종료 코드를 버렸다',
    fix: 'rc를 먼저 잡고 요약을 뽑은 뒤 그 rc로 종료한다',
  },
  {
    title: '브리프 복사가 에이전트가 읽을 수 있는 시점보다 한 턴 늦었다',
    fix: '브리프는 투입 전에 파일로 자리에 두고, 투입 직후 한 턴에 base와 env를 확인한다',
  },
  {
    title: '아직 도는지 확인하는 시점이 rebase보다 늦었다',
    fix: '수확은 "아직 도나? 커밋 고정"으로 시작한다. 에이전트의 트리를 다시 쓰는 rebase는 그 뒤다',
  },
]

interface Faq {
  q: string
  a: string
}

const FAQS: Faq[] = [
  {
    q: '세션을 여러 개 여는 것과 뭐가 다른가요?',
    a: '두 번째 세션은 같은 체크아웃과 같은 .git을 공유합니다. 격리되는 게 없습니다. worktree는 파일시스템과 git 인덱스를 진짜로 분리합니다. 세션 분할은 오케스트레이터 자신의 컨텍스트를 줄이는 데는 유효하지만, 그건 다른 문제입니다.',
  },
  {
    q: '동시에 몇 개까지 돌릴 수 있나요?',
    a: '시작은 2개를 권장합니다. 상한은 머신의 성질이라 스킬이 정하지 않고, 부트스트랩 때 프로젝트별 어댑터 파일에 기록합니다.',
  },
  {
    q: 'stagger와 batch 중 뭘 써야 하나요?',
    a: '벽시계 시간을 최적화하려면 stagger(끝나는 대로 즉시 재투입), 토큰을 최적화하려면 batch(둘 다 끝난 뒤 한꺼번에 정리)입니다. 실제로는 작업 단위를 줄이는 쪽이 둘 다를 동시에 개선하는 유일한 답입니다.',
  },
  {
    q: '빌드나 별도 런타임이 필요한가요?',
    a: '아니요. 스킬 1개와 레퍼런스 파일 3개뿐이고 훅·에이전트·의존성은 없습니다. ~/.claude/skills/에 폴더를 복사해도 동일하게 동작합니다.',
  },
  {
    q: 'fe-rail·self-improvement와 같이 써도 되나요?',
    a: '네. sh5623/guardrail 마켓 하나로 세 플러그인을 함께 설치할 수 있습니다.',
  },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
}

function formatM(v: number): string {
  return `${(v / 1_000_000).toFixed(1)}M`
}

export default function ParallelWorktreePage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const sectionClass = 'px-12 py-28 border-t border-white/[0.06] max-[768px]:px-6 max-[768px]:py-16'
  const innerClass = 'max-w-[1180px] mx-auto w-full'
  const labelClass =
    'inline-flex items-center gap-2 text-[0.72rem] text-[#2dd4bf] tracking-[0.3em] uppercase mb-3 font-mono font-semibold'
  const titleClass =
    'text-[clamp(1.6rem,3.6vw,3rem)] font-extrabold tracking-[-0.02em] leading-[1.15] mb-4 text-slate-50'
  const descClass =
    'text-[0.95rem] text-slate-400 leading-[1.8] max-w-[620px] mb-14 max-[768px]:mb-9'

  return (
    <div
      className="min-h-screen text-slate-50 overflow-x-hidden"
      style={{
        backgroundColor: '#0a0d0f',
        backgroundImage:
          'repeating-linear-gradient(rgba(45,212,191,0.05) 0px, rgba(45,212,191,0.05) 1px, transparent 1px, transparent 64px)',
      }}
    >
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-12 py-5 bg-[rgba(10,13,15,0.85)] backdrop-blur-[12px] border-b border-white/[0.06] max-[768px]:px-6 max-[768px]:py-4">
        <button
          type="button"
          onClick={() => void navigate('/')}
          className="inline-flex items-center gap-2 text-[0.75rem] text-slate-400 tracking-[0.1em] font-mono bg-none border-none cursor-pointer p-0 transition-colors duration-200 hover:text-[#2dd4bf]"
        >
          ← Home
        </button>
        <div className="inline-flex items-center gap-2 text-[0.9rem] font-bold tracking-[0.12em] uppercase font-mono text-slate-50">
          <span className="w-2 h-2 rounded-full bg-[#2dd4bf]" aria-hidden="true" />
          parallel-worktree
        </div>
        <a
          href="https://github.com/sh5623/parallel-worktree"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[0.75rem] text-slate-400 tracking-[0.1em] font-mono no-underline transition-colors duration-200 hover:text-[#2dd4bf]"
        >
          <Github className="w-3.5 h-3.5" aria-hidden="true" />
          GitHub
        </a>
      </nav>

      {/* Hero */}
      <header className="relative pt-[9rem] pb-24 px-12 max-[768px]:pt-32 max-[768px]:pb-16 max-[768px]:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className={`${innerClass} grid grid-cols-[1.05fr_0.95fr] gap-16 items-start max-[960px]:grid-cols-1`}
        >
          <div>
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 text-[0.72rem] text-[#2dd4bf] tracking-[0.25em] uppercase font-mono font-semibold border border-[#2dd4bf]/25 bg-[#2dd4bf]/[0.06] rounded-full py-1.5 px-3.5 mb-7"
            >
              <Split className="w-3.5 h-3.5" aria-hidden="true" />
              Claude Code Skill
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="text-[clamp(2.1rem,5vw,3.8rem)] font-extrabold tracking-[-0.03em] leading-[1.12] mb-6 text-slate-50"
            >
              혼자서,
              <br />
              <span className="relative inline-block">
                병렬로 돈다
                <span
                  className="absolute left-0 right-0 -bottom-1 h-[0.4em] bg-[#2dd4bf]/20 -z-10"
                  aria-hidden="true"
                />
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-[1rem] text-slate-400 leading-[1.85] max-w-[500px] mb-9"
            >
              한 명의 오케스트레이터가 격리된 git worktree 여러 개에서 서브에이전트를 병렬로 돌리고,
              작업을 잃지 않는 순서로 끝난 것부터 수확합니다. 진짜 비용은 git 명령이 아닙니다.
              기다리는 동안 오케스트레이터가 잡일로 턴을 채워서 컨텍스트가 제곱으로 불어나는
              쪽입니다.
            </motion.p>
            <motion.div variants={fadeUp} className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => scrollTo('install')}
                className="inline-flex items-center gap-2 text-[0.85rem] font-semibold font-mono bg-[#2dd4bf] text-[#06231f] rounded-md py-3 px-6 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              >
                설치 명령 보기 <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <a
                href="https://github.com/sh5623/parallel-worktree"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[0.85rem] font-semibold font-mono text-slate-300 border border-white/15 rounded-md py-3 px-6 no-underline transition-colors duration-200 hover:border-white/35 hover:text-slate-50"
              >
                GitHub에서 보기
              </a>
            </motion.div>
          </div>

          {/* Hero swimlane preview */}
          <motion.div
            variants={fadeUp}
            className="relative bg-white/[0.03] border border-white/10 rounded-[4px] p-6 max-[960px]:rotate-0"
          >
            <div className="text-[0.7rem] text-slate-500 font-mono mb-4 tracking-[0.08em]">
              ORCHESTRATOR · 2 WORKTREES
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[0.68rem] text-slate-500 font-mono w-[92px] shrink-0">
                  orchestrator
                </span>
                <div className="flex-1 h-5 flex gap-[2px]">
                  <div className="w-[10%] bg-[#2dd4bf] rounded-[2px]" title="dispatch" />
                  <div className="flex-1 border border-dashed border-white/15 rounded-[2px]" />
                  <div className="w-[8%] bg-[#fb7185] rounded-[2px]" title="harvest" />
                  <div className="w-[10%] bg-[#2dd4bf] rounded-[2px]" title="dispatch" />
                  <div className="flex-1 border border-dashed border-white/15 rounded-[2px]" />
                  <div className="w-[8%] bg-[#fb7185] rounded-[2px]" title="harvest" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[0.68rem] text-slate-500 font-mono w-[92px] shrink-0">
                  worktree A
                </span>
                <div className="flex-1 h-5 flex gap-[2px]">
                  <div className="w-[52%] bg-[#2dd4bf]/40 rounded-[2px]" />
                  <div className="flex-1" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[0.68rem] text-slate-500 font-mono w-[92px] shrink-0">
                  worktree B
                </span>
                <div className="flex-1 h-5 flex gap-[2px]">
                  <div className="w-[18%]" />
                  <div className="w-[60%] bg-[#2dd4bf]/40 rounded-[2px]" />
                  <div className="flex-1" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/[0.06] text-[0.66rem] text-slate-500 font-mono flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px] bg-[#2dd4bf]" aria-hidden="true" /> dispatch
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px] bg-[#2dd4bf]/40" aria-hidden="true" />{' '}
                running
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 border border-dashed border-white/25 rounded-[2px]"
                  aria-hidden="true"
                />{' '}
                silence
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px] bg-[#fb7185]" aria-hidden="true" /> harvest
              </span>
            </div>
          </motion.div>
        </motion.div>
      </header>

      {/* 세션 vs 워크트리 */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>
              <Users className="w-3.5 h-3.5" aria-hidden="true" /> ISOLATION
            </div>
            <h2 className={titleClass}>세션 두 개가 아니라, worktree 하나</h2>
            <p className={descClass}>
              같은 레포에 세션을 하나 더 열어도 격리되는 건 없습니다. worktree는 파일시스템과 git
              인덱스를 진짜로 분리합니다. 쓰는 사람 하나, 수확하는 사람 하나.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="bg-white/[0.03] border border-white/10 rounded-[4px] overflow-hidden"
          >
            <div className="grid grid-cols-[220px_1fr] text-[0.72rem] text-slate-500 font-mono uppercase tracking-[0.08em] border-b border-white/[0.06] max-[600px]:grid-cols-1">
              <div className="py-3 px-6">쪼개고 싶었던 것</div>
              <div className="py-3 px-6 border-l border-white/[0.06] max-[600px]:border-l-0 max-[600px]:border-t">
                세션을 하나 더 열면 실제로 일어나는 일
              </div>
            </div>
            {COMPARE_ROWS.map((row) => (
              <motion.div
                key={row.hoped}
                variants={fadeUp}
                className="grid grid-cols-[220px_1fr] border-b border-white/[0.06] last:border-b-0 max-[600px]:grid-cols-1"
              >
                <div className="py-5 px-6 text-[0.9rem] font-semibold text-slate-100">
                  {row.hoped}
                </div>
                <div className="py-5 px-6 text-[0.85rem] text-slate-400 leading-[1.75] border-l border-white/[0.06] max-[600px]:border-l-0 max-[600px]:border-t">
                  {row.reality}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 비용 곡선 */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> COST
            </div>
            <h2 className={titleClass}>기다리는 시간이 비용의 전부다</h2>
            <p className={descClass}>
              오케스트레이터의 컨텍스트 적분은 c₀·n + g·n²/2입니다. 턴 수 n에 대해 제곱으로
              자랍니다. 기다리는 동안 잡일로 턴을 채우는 것이 n을 키우는 원인입니다. 319턴은
              실측이고, 30턴 지점의 2.3M은 두 번째 실행이 아니라 같은 세션의 c₀와 g를 30턴에서
              계산한 모델값입니다. (표본 n=1, 측정 방법은 레포의 RUNBOOK.md 6-0)
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-white/[0.03] border border-white/10 rounded-[4px] p-6 max-[600px]:p-4"
          >
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className="w-full h-auto"
              role="img"
              aria-label="턴 수에 따른 컨텍스트 적분 곡선: 30턴에서 2.3M, 319턴에서 68.0M"
            >
              <title>턴 수 대비 컨텍스트 적분 곡선</title>
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <line
                  key={f}
                  x1={PAD_L}
                  x2={CHART_W - PAD_R}
                  y1={yAt(MAX_V * f)}
                  y2={yAt(MAX_V * f)}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                />
              ))}
              <path d={areaPath} fill="rgba(45,212,191,0.08)" />
              <path
                d={linearPath}
                fill="none"
                stroke="#475569"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <path d={quadPath} fill="none" stroke="#2dd4bf" strokeWidth={2.5} />
              {[POINT_30, POINT_319].map((p) => (
                <g key={p.n}>
                  <circle cx={xAt(p.n)} cy={yAt(p.quad)} r={4} fill="#fb7185" />
                  <text
                    x={xAt(p.n)}
                    y={yAt(p.quad) - 10}
                    fill="#e2e8f0"
                    fontSize="11"
                    fontFamily="monospace"
                    textAnchor={p.n > 250 ? 'end' : 'middle'}
                  >
                    {p.n}턴 · {formatM(p.quad)}
                  </text>
                </g>
              ))}
              <text x={PAD_L} y={CHART_H - 10} fill="#64748b" fontSize="10" fontFamily="monospace">
                턴 수 →
              </text>
              <text
                x={12}
                y={PAD_T + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
                transform={`rotate(-90 12 ${PAD_T + 4})`}
              >
                컨텍스트
              </text>
            </svg>
            <div className="flex items-center gap-5 mt-4 text-[0.7rem] text-slate-500 font-mono flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#2dd4bf]" aria-hidden="true" /> ∫ = c₀·n + g·n²/2
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 border-t border-dashed border-slate-500"
                  aria-hidden="true"
                />{' '}
                선형 기준선 c₀·n
              </span>
              <span className="text-[#2dd4bf]/70">음영 = 침묵으로 피하는 n² 몫</span>
            </div>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 gap-5 mt-6 max-[600px]:grid-cols-1"
          >
            <motion.div
              variants={fadeUp}
              className="bg-white/[0.03] border border-white/10 rounded-[4px] p-6"
            >
              <div className="text-[1.7rem] font-extrabold text-[#2dd4bf] font-mono mb-1">71%</div>
              <p className="text-[0.82rem] text-slate-400 leading-[1.7]">
                전체 적분에서 n² 항이 차지하는 비중 (같은 작업량, 같은 하루, 턴 수만 다를 때)
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="bg-white/[0.03] border border-white/10 rounded-[4px] p-6"
            >
              <div className="text-[1.7rem] font-extrabold text-[#fb7185] font-mono mb-1">64%</div>
              <p className="text-[0.82rem] text-slate-400 leading-[1.7]">
                청구 금액에서 캐시 읽기가 차지하는 비중. 쓴 것이 아니라 같은 컨텍스트를 매 턴 다시
                읽는 값
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 사이클 */}
      <section id="cycle" className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>
              <GitMerge className="w-3.5 h-3.5" aria-hidden="true" /> THE CYCLE
            </div>
            <h2 className={titleClass}>
              측정 → 분리 → 브리핑 → 침묵 → 수확 → 확인 → 기록 → 클리어
            </h2>
            <p className={descClass}>
              사용자는 두 마디만 합니다: "다음 것 띄워줘"와 "수확해줘". 인수인계 노트가 자동
              로드되는 곳에 있으면 두 번째는 보통 "계속해줘"로 줄어듭니다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-5 gap-3 max-[900px]:grid-cols-3 max-[560px]:grid-cols-2"
          >
            {CYCLE.map((step) => (
              <motion.div
                key={step.n}
                variants={fadeUp}
                className={`border rounded-[4px] p-4 relative ${
                  step.label === '침묵'
                    ? 'bg-[#2dd4bf]/[0.08] border-[#2dd4bf]/30'
                    : 'bg-white/[0.03] border-white/10'
                }`}
              >
                <div className="text-[0.7rem] text-slate-500 font-mono mb-2">
                  {step.n}/{CYCLE.length}
                </div>
                <h3
                  className={`text-[0.92rem] font-bold mb-1.5 ${
                    step.label === '침묵' ? 'text-[#2dd4bf]' : 'text-slate-100'
                  }`}
                >
                  {step.label}
                </h3>
                <p className="text-[0.74rem] text-slate-500 leading-[1.55]">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 6가지 거짓 green */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass} style={{ color: '#fb7185' }}>
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" /> SILENT FAILURES
            </div>
            <h2 className={titleClass}>게이트는 이렇게 거짓말한다</h2>
            <p className={descClass}>
              여섯 가지 모두 lint·타입·유닛테스트·e2e가 전부 통과한 상태에서 관측됐습니다. 6번은 이
              파이프라인에만 있는 특이 케이스입니다. 세션이 인수인계 문서로 이어지기 때문에, 한
              세션이 적은 우회가 다음 세션에는 "승인된 절차"로 읽힙니다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="bg-white/[0.03] border border-white/10 rounded-[4px] divide-y divide-white/[0.06]"
          >
            {FAILURES.map((f) => (
              <motion.div
                key={f.n}
                variants={fadeUp}
                className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 p-6 items-start max-[700px]:grid-cols-1"
              >
                <span className="text-[0.72rem] font-mono font-bold text-[#fb7185] tracking-[0.05em] border border-[#fb7185]/30 bg-[#fb7185]/[0.06] rounded-full py-1 px-2.5 whitespace-nowrap self-start mt-0.5 w-fit">
                  #{f.n}
                </span>
                <div>
                  <p className="text-[0.9rem] text-slate-100 leading-[1.7] font-semibold mb-1.5">
                    {f.title}
                  </p>
                  <p className="text-[0.82rem] text-slate-500 leading-[1.75] font-mono">{f.tell}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 언제 쓰지 말아야 하나 */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>
              <Ban className="w-3.5 h-3.5" aria-hidden="true" /> WHEN NOT TO
            </div>
            <h2 className={titleClass}>이 조건을 다 만족할 때만 씁니다</h2>
            <p className={descClass}>
              하나라도 빠지면 이 파이프라인은 순손실입니다. 단일 세션으로 끝날 작은 기능, 범위가
              계속 바뀌는 탐색성 작업, 두 트랙이 같은 파일을 고쳐야 하는 경우, 자동 체크가 없는
              레포에는 쓰지 않습니다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1"
          >
            {CONDITIONS.map((c) => (
              <motion.div
                key={c.label}
                variants={fadeUp}
                className="flex items-start gap-4 bg-white/[0.03] border border-white/10 rounded-[4px] p-6"
              >
                <Layers className="w-5 h-5 text-[#2dd4bf] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="text-[0.92rem] font-bold text-slate-100 mb-1.5">{c.label}</h3>
                  <p className="text-[0.82rem] text-slate-500 leading-[1.7]">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* v0.4.0 */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>
              <Wrench className="w-3.5 h-3.5" aria-hidden="true" /> CHANGELOG · v0.4.0
            </div>
            <h2 className={titleClass}>리뷰에서 재현된 것만 고쳤다</h2>
            <p className={descClass}>
              2026년 9월 교차 레포 리뷰가 file:line이 붙은 결함을 냈고, 전부 재현한 뒤에
              받아들였습니다. 같은 리뷰가 규칙 둘을 좁히라고 했고 그렇게 했습니다. 침묵은 모든 턴이
              아니라 잡일과 폴링을 금지하고, 재현의 위임은 허용하되 판정은 오케스트레이터에
              남습니다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="bg-white/[0.03] border border-white/10 rounded-[4px] divide-y divide-white/[0.06]"
          >
            {RELEASE_0_4_0.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 p-6 items-start max-[700px]:grid-cols-1"
              >
                <span className="text-[0.66rem] font-mono font-bold text-slate-500 tracking-[0.08em] border border-white/15 rounded-full py-1 px-2.5 whitespace-nowrap self-start mt-0.5 w-fit">
                  결함
                </span>
                <p className="text-[0.86rem] text-slate-300 leading-[1.7] font-mono">
                  {item.title}
                </p>
                <span className="text-[0.66rem] font-mono font-bold text-[#2dd4bf] tracking-[0.08em] border border-[#2dd4bf]/30 bg-[#2dd4bf]/[0.06] rounded-full py-1 px-2.5 whitespace-nowrap self-start mt-0.5 w-fit">
                  수정
                </span>
                <p className="text-[0.9rem] text-slate-100 leading-[1.75] font-semibold">
                  {item.fix}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 설치 */}
      <section id="install" className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>
              <Timer className="w-3.5 h-3.5" aria-hidden="true" /> INSTALL
            </div>
            <h2 className={titleClass}>시작하기</h2>
            <p className={descClass}>
              Claude Code 터미널에서 세 줄로 설치합니다. 설치되는 것은 스킬 1개와 레퍼런스 파일
              3개뿐이고, 훅·에이전트·의존성은 없습니다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <pre className="bg-[#050706] border border-white/10 rounded-[4px] py-7 px-8 text-[0.82rem] leading-[1.9] text-slate-200 overflow-x-auto max-[768px]:py-5 max-[768px]:px-5 max-[768px]:text-[0.75rem] font-mono">
              <span className="text-slate-500"># Claude Code 터미널에서 실행</span>
              {'\n'}
              <span className="text-[#2dd4bf]">
                /plugin marketplace add sh5623/parallel-worktree
              </span>
              {'\n'}
              <span className="text-[#2dd4bf]">
                /plugin install parallel-worktree@parallel-worktree
              </span>
              {'\n'}
              <span className="text-[#2dd4bf]">/reload-plugins</span>
              {'\n\n'}
              <span className="text-slate-500"># 첫 프로젝트 부트스트랩</span>
              {'\n'}
              <span className="text-slate-300">"이 프로젝트에 parallel worktree 세팅해줘"</span>
            </pre>
          </motion.div>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-[0.8rem] text-slate-500 mt-6 font-mono leading-[1.8]"
          >
            fe-rail·self-improvement와 같이 쓴다면 마켓 하나로 세 개 다 설치할 수 있습니다:
            sh5623/guardrail.
          </motion.p>
        </div>
      </section>

      {/* FAQ */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>FAQ</div>
            <h2 className={titleClass}>자주 묻는 질문</h2>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-[780px]"
          >
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <motion.div
                  key={faq.q}
                  variants={fadeUp}
                  className="border-b border-white/[0.06] last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left bg-none border-none cursor-pointer"
                  >
                    <span className="text-[0.95rem] font-semibold text-slate-100">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <p className="text-[0.86rem] text-slate-400 leading-[1.85] pb-5 max-w-[640px]">
                      {faq.a}
                    </p>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-12 py-10 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-4 max-[768px]:px-6">
        <div className="text-[0.75rem] text-slate-500 font-mono tracking-[0.05em]">
          parallel-worktree · Claude Code Skill · MIT © 2026 Seungho
        </div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => void navigate('/')}
            className="text-[0.75rem] text-slate-400 font-mono bg-none border-none cursor-pointer p-0 transition-colors duration-200 hover:text-[#2dd4bf]"
          >
            ← Home
          </button>
          <a
            href="https://github.com/sh5623/parallel-worktree"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.75rem] text-slate-400 font-mono no-underline transition-colors duration-200 hover:text-[#2dd4bf]"
          >
            GitHub →
          </a>
        </div>
      </footer>
    </div>
  )
}
