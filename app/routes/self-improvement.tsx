import { motion, type Variants } from 'framer-motion'
import {
  Archive,
  ArrowRight,
  BookOpenCheck,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Github,
  Layers,
  Scale,
  Settings2,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Route } from './+types/self-improvement'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'self-improvement | Claude Code Plugin' },
    {
      name: 'description',
      content:
        '규약·문서·절차에 물리면 그 자리만 우회하지 않고 규약 자체를 고치는 증거 기반 자가개선 루프.',
    },
  ]
}

interface Principle {
  n: string
  title: string
  desc: string
}

const PRINCIPLES: Principle[] = [
  {
    n: '01',
    title: '규약은 얼어있지 않다',
    desc: '갭을 발견한 세션이, 같은 작업 단위 안에서, 사용자 지시를 기다리지 않고 고친다.',
  },
  {
    n: '02',
    title: '증거 없으면 규약 없다',
    desc: '재발 지점을 실명으로 2곳 이상 댈 수 있는 일반성과, 수치·로그·file:line 같은 증거 — 둘 다 없으면 규약화하지 않는다.',
  },
  {
    n: '03',
    title: '문서에는 예산이 있다',
    desc: '규약은 가장 좁은 스코프에 쓴다. 넘치면 강등·아카이브로 이관된다 — 무한히 자라는 문서는 아무도 읽지 않는다.',
  },
]

interface Layer {
  icon: typeof Settings2
  name: string
  trigger: string
  budget: string
}

const LAYERS: Layer[] = [
  {
    icon: Settings2,
    name: '도구 설정',
    trigger: '자동 강제 (lint·format·type·test·CI)',
    budget: '문서 규약보다 항상 우선',
  },
  {
    icon: FileText,
    name: '경로 스코프 룰',
    trigger: '매칭 파일을 만질 때만',
    budget: '파일당 ≤150줄',
  },
  {
    icon: ClipboardCheck,
    name: '태스크·도메인 문서',
    trigger: '해당 작업 시 명시적 Read',
    budget: '문서당 ≤400줄 권장',
  },
  {
    icon: BookOpenCheck,
    name: '상시 로드 문서',
    trigger: '모든 세션',
    budget: '≤200줄',
  },
  {
    icon: Archive,
    name: '아카이브',
    trigger: '로드 안 됨',
    budget: '사문화 규약 + 로그 보존',
  },
]

interface LoopStep {
  n: string
  label: string
  desc: string
}

const LOOP: LoopStep[] = [
  { n: '1', label: '감지', desc: '갭을 만났나 — 게이트 진입' },
  { n: '2', label: '분류', desc: '일반성(재발 2곳↑) + 증거' },
  { n: '3', label: '검증', desc: '확정 전 문구의 효력을 확인' },
  { n: '4', label: '규약화', desc: '가장 좁은 층에 기록' },
  { n: '5', label: '전파', desc: '관련 파일·팀에 알림' },
  { n: '6', label: '기록', desc: '색인 1줄 + 로그 1블록' },
]

interface ComponentItem {
  tag: string
  cmd: string
  title: string
  desc: string
  icon: typeof Workflow
}

const COMPONENTS: ComponentItem[] = [
  {
    tag: 'HOOK',
    cmd: 'SessionStart',
    title: '독트린 주입',
    desc: '독트린 6조를 매 세션 컨텍스트에 주입한다. compact 후에도 재주입되어 긴 세션에서도 잊히지 않는다.',
    icon: ShieldCheck,
  },
  {
    tag: 'SKILL',
    cmd: '/self-improvement:si-init',
    title: '부트스트랩',
    desc: '문서 지형을 탐지해 데이터 파일을 생성한다. 기존 시스템이 있으면 등록만 하고 덮어쓰지 않는다. 멱등.',
    icon: Layers,
  },
  {
    tag: 'SKILL',
    cmd: '/self-improvement:si-improve',
    title: '프로토콜 본체',
    desc: '감지 → 분류 → 검증 → 규약화 → 전파 → 기록. 라우팅이 애매하면 convention-smith에 위임한다.',
    icon: Workflow,
  },
  {
    tag: 'SKILL',
    cmd: '/self-improvement:si-archive',
    title: '비대 관리',
    desc: '예산 초과·사문화 조항을 하위 층·아카이브로 이관한다. 이동은 언제나 아래 방향으로만.',
    icon: Archive,
  },
  {
    tag: 'AGENT',
    cmd: 'convention-smith',
    title: '라우팅·초안',
    desc: '안착 위치가 애매할 때 위임. 게이트 판정 + 최소 diff 초안까지 산출한다 (READ+DRAFT).',
    icon: Scale,
  },
]

interface Incident {
  bug: string
  rule: string
}

const INCIDENTS: Incident[] = [
  {
    bug: '자가개선이 "시키면 하는 별도 작업"으로 취급돼 대부분 유실됨',
    rule: '자발 발동 + 보고 의무 — "자가개선: N건" 줄이 없으면 자문을 건너뛴 것',
  },
  {
    bug: '캡이 파일 헤더에만 있어 아무도 트리거하지 않음 → 로그 42블록·949줄까지 자람',
    rule: '캡은 그것을 실행할 절차 단계에 배선한다. 헤더 문구만으로는 아무 일도 안 일어난다',
  },
  {
    bug: '"합계는 항상 100" 무조건 단언이 정상 케이스 13건을 결함으로 오검출',
    rule: '무조건 단언은 금지. 조건·예외를 명시하고, 쓰기 전 반례를 grep 한다',
  },
  {
    bug: '워밍된 캐시 수치로 "성능 해소"를 게시했다가 같은 날 철회',
    rule: '콜드 기준으로 잰다 — 워밍된 수치는 하한이지 진실이 아니다',
  },
  {
    bug: '포인터를 AGENTS.md에만 썼는데 Claude Code는 CLAUDE.md만 읽음',
    rule: 'AGENTS.md에 쓰면 같은 단계에서 CLAUDE.md의 import까지 보장한다',
  },
  {
    bug: '기존 규약 시스템을 "위치 보고"로만 등록 → 세션과 함께 유실, 다음 세션은 README를 오선택',
    rule: '등록은 상시 로드 문서에 실제 경로를 쓴다. 다음 탐색은 그 선언부터 읽는다',
  },
]

interface Faq {
  q: string
  a: string
}

const FAQS: Faq[] = [
  {
    q: '어떤 프로젝트에 설치할 수 있나요?',
    a: 'FE·BE·스크립트·문서 무관, Claude Code만 있으면 됩니다. 절차는 도메인을 모르고, 프로젝트의 문서 지형은 설치 시 탐지해서 기록합니다.',
  },
  {
    q: '빌드나 별도 런타임이 필요한가요?',
    a: '아니요. 플러그인은 Markdown + JSON 매니페스트 2개이고, 프로젝트에 만드는 데이터 파일도 Markdown 1개입니다. 설치할 의존성이 없습니다.',
  },
  {
    q: '규약 문서 수정에 승인이 필요한가요?',
    a: '아니요. 일반성 + 증거 게이트를 통과하면 세션이 같은 작업 단위 안에서 스스로 수정합니다. 커밋은 프로젝트 git 규칙을 따릅니다.',
  },
  {
    q: '기존에 쓰던 규약 문서가 있으면 어떻게 되나요?',
    a: 'si-init이 그 시스템을 감지해 등록만 하고 덮어쓰지 않습니다. 표·예산처럼 없는 요소는 제안으로만 알립니다.',
  },
  {
    q: 'fe-rail과 같이 써도 되나요?',
    a: '네. sh5623/guardrail 마켓 하나로 fe-rail과 self-improvement를 함께 설치할 수 있습니다.',
  },
]

interface TranscriptLine {
  text: string
  tone?: 'muted' | 'pass' | 'diff'
}

const TRANSCRIPT: TranscriptLine[] = [
  { text: '$ claude', tone: 'muted' },
  { text: '> 코스피 차트 옆에 종목 차트 하나 추가해줘' },
  { text: '' },
  { text: '✔ KospiChart.tsx:82 — 색상 하드코딩 #34d399 (상승 그린)', tone: 'pass' },
  { text: '' },
  { text: '끝내기 전 — 이거 다른 데서도 재발하나?' },
  {
    text: ' · LgCnsChart.tsx:49 · SearchableStockChart.tsx:62 같은 값(grep) → 게이트 통과',
    tone: 'pass',
  },
  { text: '' },
  { text: '+ app/lib/chart-colors.ts          (경로 스코프 룰 층)', tone: 'diff' },
  { text: '+ docs/conventions/CHANGELOG.md    색인 1줄 + 로그 1블록', tone: 'diff' },
  { text: '' },
  { text: '자가개선: 1건 — chart-colors 상수 + changelog', tone: 'diff' },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

function toneClass(tone: TranscriptLine['tone']): string {
  if (tone === 'pass') return 'text-emerald-700'
  if (tone === 'diff') return 'text-amber-800'
  if (tone === 'muted') return 'text-stone-400'
  return 'text-stone-600'
}

export default function SelfImprovementPage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const sectionClass = 'px-12 py-28 border-t border-stone-200 max-[768px]:px-6 max-[768px]:py-16'
  const innerClass = 'max-w-[1180px] mx-auto w-full'
  const labelClass =
    'inline-flex items-center gap-2 text-[0.72rem] text-amber-800 tracking-[0.3em] uppercase mb-3 font-mono font-semibold'
  const titleClass =
    'text-[clamp(1.6rem,3.6vw,3rem)] font-extrabold tracking-[-0.02em] leading-[1.15] mb-4 text-stone-900'
  const descClass =
    'text-[0.95rem] text-stone-500 leading-[1.8] max-w-[600px] mb-14 max-[768px]:mb-9'

  return (
    <div
      className="min-h-screen text-stone-900 overflow-x-hidden"
      style={{
        backgroundColor: '#FAF9F4',
        backgroundImage:
          'linear-gradient(rgba(28,25,23,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28,25,23,0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-12 py-5 bg-[rgba(250,249,244,0.9)] backdrop-blur-[10px] border-b border-stone-200 max-[768px]:px-6 max-[768px]:py-4">
        <button
          type="button"
          onClick={() => void navigate('/')}
          className="inline-flex items-center gap-2 text-[0.75rem] text-stone-500 tracking-[0.1em] font-mono bg-none border-none cursor-pointer p-0 transition-colors duration-200 hover:text-amber-800"
        >
          ← Home
        </button>
        <div className="inline-flex items-center gap-2 text-[0.9rem] font-bold tracking-[0.12em] uppercase font-mono text-stone-900">
          <span className="w-2 h-2 rounded-full bg-amber-700" aria-hidden="true" />
          self-improvement
        </div>
        <a
          href="https://github.com/sh5623/self-improvement"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[0.75rem] text-stone-500 tracking-[0.1em] font-mono no-underline transition-colors duration-200 hover:text-amber-800"
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
              className="inline-flex items-center gap-2 text-[0.72rem] text-amber-800 tracking-[0.25em] uppercase font-mono font-semibold border border-amber-800/25 bg-amber-800/[0.06] rounded-full py-1.5 px-3.5 mb-7"
            >
              Claude Code Plugin
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="text-[clamp(2.1rem,5vw,3.8rem)] font-extrabold tracking-[-0.03em] leading-[1.12] mb-6 text-stone-900"
            >
              규약은,
              <br />
              <span className="relative inline-block">
                얼어있지 않다
                <span
                  className="absolute left-0 right-0 -bottom-1 h-[0.4em] bg-amber-300/50 -z-10"
                  aria-hidden="true"
                />
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-[1rem] text-stone-500 leading-[1.85] max-w-[480px] mb-9"
            >
              작업 중 규약·문서·절차에 물리면, 그 자리만 우회하지 않습니다. 증거 게이트를 통과한
              규약은 같은 세션이 그 자리에서 스스로 고칩니다. FE·BE·스크립트·문서 — 어떤
              프로젝트에도 설치해 씁니다.
            </motion.p>
            <motion.div variants={fadeUp} className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => scrollTo('install')}
                className="inline-flex items-center gap-2 text-[0.85rem] font-semibold font-mono bg-stone-900 text-[#FAF9F4] rounded-md py-3 px-6 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              >
                설치 명령 보기 <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <a
                href="https://github.com/sh5623/self-improvement"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[0.85rem] font-semibold font-mono text-stone-600 border border-stone-300 rounded-md py-3 px-6 no-underline transition-colors duration-200 hover:border-stone-500 hover:text-stone-900"
              >
                GitHub에서 보기
              </a>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            className="relative bg-white border border-stone-200 rounded-[4px] p-6 shadow-[0_10px_30px_rgba(28,25,23,0.06)] -rotate-1 max-[960px]:rotate-0"
          >
            <div className="text-[0.7rem] text-stone-400 font-mono mb-3 tracking-[0.08em]">
              SESSION TRANSCRIPT
            </div>
            <pre className="text-[0.76rem] leading-[1.7] font-mono whitespace-pre-wrap m-0">
              {TRANSCRIPT.map((line, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static transcript, order never changes
                <div key={i} className={toneClass(line.tone)}>
                  {line.text || ' '}
                </div>
              ))}
            </pre>
          </motion.div>
        </motion.div>
      </header>

      {/* 3원칙 */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>PRINCIPLES</div>
            <h2 className={titleClass}>3원칙</h2>
            <p className={descClass}>이 위에 모든 절차가 서 있습니다.</p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-1"
          >
            {PRINCIPLES.map((p) => (
              <motion.div
                key={p.n}
                variants={fadeUp}
                className="bg-white border border-stone-200 rounded-[4px] p-7"
              >
                <div className="text-[1.6rem] font-extrabold text-amber-800/40 font-mono mb-4">
                  {p.n}
                </div>
                <h3 className="text-[1.05rem] font-bold text-stone-900 mb-2.5 tracking-[-0.01em]">
                  {p.title}
                </h3>
                <p className="text-[0.86rem] text-stone-500 leading-[1.75]">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 층 모델 */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>DOCUMENT MODEL</div>
            <h2 className={titleClass}>규약은 다섯 개의 층에 산다</h2>
            <p className={descClass}>
              새 규약은 위에서부터 처음 맞는 층에 쓴다. 넘치거나 사문화되면 아래로만 이동한다 — 위로
              되돌아가는 경로는 없다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="relative border-l-2 border-dashed border-amber-800/30 ml-3 max-[600px]:ml-1.5"
          >
            {LAYERS.map((layer) => {
              const Icon = layer.icon
              return (
                <motion.div
                  key={layer.name}
                  variants={fadeUp}
                  className="relative pl-9 pb-6 last:pb-0 max-[600px]:pl-6"
                >
                  <span
                    className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-[#FAF9F4] border-2 border-amber-800/50"
                    aria-hidden="true"
                  />
                  <div className="flex items-center gap-4 bg-white border border-stone-200 rounded-[4px] py-4 px-5 flex-wrap">
                    <Icon className="w-5 h-5 text-amber-800 shrink-0" aria-hidden="true" />
                    <div className="font-bold text-stone-900 text-[0.95rem] w-[190px] shrink-0 max-[600px]:w-full">
                      {layer.name}
                    </div>
                    <div className="text-[0.8rem] text-stone-500 font-mono flex-1 min-w-[180px]">
                      {layer.trigger}
                    </div>
                    <div className="text-[0.72rem] text-amber-800 font-mono font-semibold bg-amber-800/[0.07] border border-amber-800/20 rounded-full py-1 px-3 whitespace-nowrap">
                      {layer.budget}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* 루프 */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>THE LOOP</div>
            <h2 className={titleClass}>감지 → 분류 → 검증 → 규약화 → 전파 → 기록</h2>
            <p className={descClass}>
              하나의 갭이 규약이 되기까지 거치는 6단계. 게이트를 통과하지 못하면 로컬 문서에 남고
              끝난다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-6 gap-4 max-[900px]:grid-cols-2 max-[500px]:grid-cols-1"
          >
            {LOOP.map((step) => (
              <motion.div
                key={step.n}
                variants={fadeUp}
                className="bg-white border border-stone-200 rounded-[4px] p-5 relative"
              >
                <div className="text-[0.72rem] text-stone-400 font-mono mb-3">
                  {step.n}/{LOOP.length}
                </div>
                <h3 className="text-[0.98rem] font-bold text-stone-900 mb-1.5">{step.label}</h3>
                <p className="text-[0.78rem] text-stone-500 leading-[1.6]">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 구성 */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>COMPONENTS</div>
            <h2 className={titleClass}>1개의 훅, 3개의 스킬, 1개의 에이전트</h2>
            <p className={descClass}>
              도구는 플러그인이 준다. 프로젝트에는 데이터 파일 1개만 남는다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1"
          >
            {COMPONENTS.map((c) => {
              const Icon = c.icon
              return (
                <motion.div
                  key={c.cmd}
                  variants={fadeUp}
                  className="group relative bg-white border border-stone-200 rounded-[4px] p-6 overflow-hidden transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(28,25,23,0.08)]"
                >
                  <span
                    className="absolute top-0 left-0 right-0 h-[3px] bg-amber-700 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"
                    aria-hidden="true"
                  />
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-6 h-6 text-amber-800" aria-hidden="true" />
                    <span className="text-[0.65rem] text-stone-400 font-mono tracking-[0.1em] border border-stone-200 rounded-full py-0.5 px-2">
                      {c.tag}
                    </span>
                  </div>
                  <div className="text-[0.78rem] text-amber-800 font-mono font-semibold mb-1.5 break-all">
                    {c.cmd}
                  </div>
                  <h3 className="text-[1.02rem] font-bold text-stone-900 mb-2 tracking-[-0.01em]">
                    {c.title}
                  </h3>
                  <p className="text-[0.82rem] text-stone-500 leading-[1.75]">{c.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* 실증 유래 */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={labelClass}>FIELD EVIDENCE</div>
            <h2 className={titleClass}>설계가 아니라 사고에서 나왔다</h2>
            <p className={descClass}>
              실전 프로젝트(레거시 전환 + API 연동, 규약 개선 40여 건 기록)에서 값을 치르고 얻은
              규칙들. 각 행은 실제 사고와 그로부터 나온 규칙입니다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="bg-white border border-stone-200 rounded-[4px] divide-y divide-stone-200"
          >
            {INCIDENTS.map((inc) => (
              <motion.div
                key={inc.bug}
                variants={fadeUp}
                className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 p-6 items-start max-[700px]:grid-cols-1"
              >
                <span className="text-[0.66rem] font-mono font-bold text-stone-400 tracking-[0.08em] border border-stone-300 rounded-full py-1 px-2.5 whitespace-nowrap self-start mt-0.5">
                  사고
                </span>
                <p className="text-[0.84rem] text-stone-500 leading-[1.75] font-mono">{inc.bug}</p>
                <span className="text-[0.66rem] font-mono font-bold text-amber-800 tracking-[0.08em] border border-amber-800/30 bg-amber-800/[0.06] rounded-full py-1 px-2.5 whitespace-nowrap self-start mt-0.5">
                  규칙
                </span>
                <p className="text-[0.9rem] text-stone-900 leading-[1.75] font-semibold">
                  {inc.rule}
                </p>
              </motion.div>
            ))}
          </motion.div>
          <p className="text-[0.8rem] text-stone-400 mt-5 font-mono">
            그 외 사고 기록은{' '}
            <a
              href="https://github.com/sh5623/self-improvement#실증-유래"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 underline underline-offset-2"
            >
              GitHub README
            </a>
            에서 전체를 볼 수 있습니다.
          </p>
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
            <div className={labelClass}>INSTALL</div>
            <h2 className={titleClass}>시작하기</h2>
            <p className={descClass}>
              Claude Code 터미널에서 세 줄로 설치합니다. 빌드도, 런타임도, 추가 의존성도 없습니다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1"
          >
            <motion.div
              variants={fadeUp}
              className="bg-[#F1EEE4] border border-stone-300 rounded-[4px] p-6"
            >
              <div className="text-[0.7rem] text-stone-400 font-mono mb-3 tracking-[0.08em]">
                설치
              </div>
              <pre className="text-[0.8rem] leading-[1.9] font-mono text-stone-700 whitespace-pre-wrap m-0">
                <div className="text-amber-800 font-semibold">
                  /plugin marketplace add sh5623/self-improvement
                </div>
                <div className="text-amber-800 font-semibold">
                  /plugin install self-improvement@self-improvement
                </div>
                <div className="text-amber-800 font-semibold">/reload-plugins</div>
              </pre>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="bg-[#F1EEE4] border border-stone-300 rounded-[4px] p-6"
            >
              <div className="text-[0.7rem] text-stone-400 font-mono mb-3 tracking-[0.08em]">
                사용
              </div>
              <pre className="text-[0.8rem] leading-[1.9] font-mono whitespace-pre-wrap m-0">
                <div>
                  <span className="text-amber-800 font-semibold">/self-improvement:si-init</span>
                  <span className="text-stone-400"> # 최초 1회</span>
                </div>
                <div>
                  <span className="text-amber-800 font-semibold">/self-improvement:si-improve</span>
                  <span className="text-stone-400"> # 물렸을 때</span>
                </div>
                <div>
                  <span className="text-amber-800 font-semibold">/self-improvement:si-archive</span>
                  <span className="text-stone-400"> # 문서가 길어졌을 때</span>
                </div>
              </pre>
            </motion.div>
          </motion.div>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-[0.8rem] text-stone-400 mt-6 font-mono leading-[1.8]"
          >
            설치는 기본 user 스코프 — 한 번 설치하면 모든 프로젝트의 모든 세션에 적용됩니다.
            fe-rail도 같이 쓴다면 마켓 하나로 두 개 다 설치할 수 있습니다: sh5623/guardrail.
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
            className="max-w-[760px]"
          >
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <motion.div
                  key={faq.q}
                  variants={fadeUp}
                  className="border-b border-stone-200 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left bg-none border-none cursor-pointer"
                  >
                    <span className="text-[0.95rem] font-semibold text-stone-900">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <p className="text-[0.86rem] text-stone-500 leading-[1.85] pb-5 max-w-[620px]">
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
      <footer className="px-12 py-10 border-t border-stone-200 flex items-center justify-between flex-wrap gap-4 max-[768px]:px-6">
        <div className="text-[0.75rem] text-stone-400 font-mono tracking-[0.05em]">
          self-improvement — Claude Code Plugin · MIT © 2026 Seungho
        </div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => void navigate('/')}
            className="text-[0.75rem] text-stone-500 font-mono bg-none border-none cursor-pointer p-0 transition-colors duration-200 hover:text-amber-800"
          >
            ← Home
          </button>
          <a
            href="https://github.com/sh5623/self-improvement"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.75rem] text-stone-500 font-mono no-underline transition-colors duration-200 hover:text-amber-800"
          >
            GitHub →
          </a>
        </div>
      </footer>
    </div>
  )
}
