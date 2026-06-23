import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Route } from './+types/fe-rail'
import { SkillCard } from './fe-rail/SkillCard'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'fe-rail | Claude Code Plugin' }]
}

type Lang = 'ko' | 'en'

const TEXT = {
  ko: {
    nav: { back: '← Home', github: 'GitHub →' },
    hero: {
      badge: 'Claude Code Plugin',
      titlePre: '프론트엔드 개발의',
      titleAccent: 'A to Z',
      titlePost: ',',
      titleLine2: 'Claude Code 하나로',
      subtitle:
        'Next.js App Router / Vite SPA + TypeScript 프로젝트에서 기획부터 PR까지\nspec → build → review → PR 사이클을 자동화하는 Claude Code 플러그인',
      cta1: '시작하기 →',
      cta2: 'GitHub에서 보기',
    },
    skills: {
      label: 'Skills',
      title: '5가지 핵심 스킬',
      desc: '카드를 클릭하면 해당 스킬 상세로 이동합니다.',
      detailLabel: 'Skills / Details',
      detailTitle: '스킬 상세',
    },
    agents: {
      label: 'Agents',
      title: '14개 전용 에이전트',
      desc: '각 단계마다 전용 에이전트가 독립적으로 동작합니다.',
      phases: { spec: 'Spec 단계', build: 'Build 단계', review: 'Review 단계', pr: 'PR 단계' },
    },
    workflow: {
      label: 'Workflow',
      title: '원스톱 자동화',
      desc: '단 두 번의 확인으로 PR까지 완성됩니다.',
    },
    install: {
      label: 'Install',
      title: '시작하기',
      desc: 'Claude Code 터미널에서 두 줄로 설치합니다.',
      comment1: '# 전제 조건: Claude Code, pnpm/npm/yarn/bun, gh CLI',
      comment2: '# Claude Code 터미널에서 실행',
    },
    faq: { label: 'FAQ', title: '자주 묻는 질문' },
    footer: 'fe-rail — Claude Code Plugin',
  },
  en: {
    nav: { back: '← Home', github: 'GitHub →' },
    hero: {
      badge: 'Claude Code Plugin',
      titlePre: 'Frontend Development',
      titleAccent: 'A to Z',
      titlePost: ',',
      titleLine2: 'with Claude Code',
      subtitle:
        'A Claude Code plugin that automates the full frontend workflow\n— spec → build → review → PR — for Next.js App Router / Vite SPA + TypeScript projects.',
      cta1: 'Get Started →',
      cta2: 'View on GitHub',
    },
    skills: {
      label: 'Skills',
      title: '5 Core Skills',
      desc: 'Click a card to jump to its detail section.',
      detailLabel: 'Skills / Details',
      detailTitle: 'Skill Details',
    },
    agents: {
      label: 'Agents',
      title: '14 Dedicated Agents',
      desc: 'Each phase has a dedicated agent running independently.',
      phases: { spec: 'Spec Phase', build: 'Build Phase', review: 'Review Phase', pr: 'PR Phase' },
    },
    workflow: {
      label: 'Workflow',
      title: 'One-Shot Automation',
      desc: 'From feature.md to PR with only two confirmations.',
    },
    install: {
      label: 'Install',
      title: 'Get Started',
      desc: 'Install in two lines from the Claude Code terminal.',
      comment1: '# Prerequisites: Claude Code, pnpm/npm/yarn/bun, gh CLI',
      comment2: '# Run inside Claude Code terminal',
    },
    faq: { label: 'FAQ', title: 'Frequently Asked Questions' },
    footer: 'fe-rail — Claude Code Plugin',
  },
} as const

const SKILLS: Record<
  Lang,
  Array<{ id: string; icon: string; name: string; title: string; desc: string; cmd: string }>
> = {
  ko: [
    {
      id: 'fe-spec',
      icon: '📋',
      name: 'fe-spec',
      title: '스펙 자동화',
      desc: '기능 요구사항을 구조화된 feature.md로 변환합니다. 갭 분석 → Figma 분석 → 외부 문서 조사 → 아키텍처 자문까지 4개 에이전트가 협력합니다.',
      cmd: '/fe-rail:fe-spec',
    },
    {
      id: 'fe-build',
      icon: '🔨',
      name: 'fe-build',
      title: '코드 구현',
      desc: '타입 정의 → 훅/서비스 → 컴포넌트 → 테스트 순서로 구현합니다. Biome 또는 ESLint·Prettier 자동 적용, tsc/린터 오류 자동 수정.',
      cmd: '/fe-rail:fe-build',
    },
    {
      id: 'fe-review',
      icon: '🔍',
      name: 'fe-review',
      title: '4축 코드 리뷰',
      desc: '타입 안전성·성능·접근성(WCAG AA)·코드 품질 4개 축으로 리뷰합니다. 각 축은 전용 에이전트가 독립적으로 감사합니다.',
      cmd: '/fe-rail:fe-review',
    },
    {
      id: 'fe-start',
      icon: '⚡',
      name: 'fe-start',
      title: '원스톱 자동화',
      desc: 'spec → build → review → PR 전 과정을 하나의 명령으로 실행합니다. 사람 개입은 두 번뿐입니다.',
      cmd: '/fe-rail:fe-start feature.md',
    },
    {
      id: 'fe-doc-sync',
      icon: '📝',
      name: 'fe-doc-sync',
      title: '문서 동기화',
      desc: 'hooks·skills·agents 변경 감지 시 CLAUDE.md와 README.md 수정안을 자동으로 제안합니다.',
      cmd: '/fe-rail:fe-doc-sync',
    },
  ],
  en: [
    {
      id: 'fe-spec',
      icon: '📋',
      name: 'fe-spec',
      title: 'Spec Automation',
      desc: 'Converts feature requirements into a structured feature.md. Four agents collaborate — gap analysis → Figma analysis → external docs research → architecture advice.',
      cmd: '/fe-rail:fe-spec',
    },
    {
      id: 'fe-build',
      icon: '🔨',
      name: 'fe-build',
      title: 'Code Implementation',
      desc: 'Implements in order: type definitions → hooks/services → components → tests. Applies Biome or ESLint·Prettier automatically and auto-fixes tsc/linter errors.',
      cmd: '/fe-rail:fe-build',
    },
    {
      id: 'fe-review',
      icon: '🔍',
      name: 'fe-review',
      title: '4-Axis Code Review',
      desc: 'Reviews across four axes — type safety, performance, accessibility (WCAG AA), and code quality. Each axis is audited by a dedicated agent independently.',
      cmd: '/fe-rail:fe-review',
    },
    {
      id: 'fe-start',
      icon: '⚡',
      name: 'fe-start',
      title: 'One-Shot Automation',
      desc: 'Runs the entire spec → build → review → PR pipeline in a single command. Human intervention occurs only twice.',
      cmd: '/fe-rail:fe-start feature.md',
    },
    {
      id: 'fe-doc-sync',
      icon: '📝',
      name: 'fe-doc-sync',
      title: 'Doc Sync',
      desc: 'Detects changes to hooks, skills, and agents and automatically proposes updates to CLAUDE.md and README.md.',
      cmd: '/fe-rail:fe-doc-sync',
    },
  ],
}

const AGENTS_KO = {
  spec: [
    { name: 'fe-analyst', role: '요구사항 갭 분석 (6갭 / 7섹션)', model: 'opus' },
    { name: 'fe-vision', role: 'Figma·UI 스크린샷·PDF 분석', model: 'sonnet' },
    { name: 'fe-researcher', role: '외부 문서·라이브러리 조사', model: 'sonnet' },
    {
      name: 'fe-architect',
      role: 'Next.js(RSC 경계) / Vite SPA(TanStack Router·React Router 7) 아키텍처 자문',
      model: 'opus',
    },
  ],
  build: [
    { name: 'fe-explorer', role: '코드베이스 탐색', model: 'haiku' },
    { name: 'fe-test-author', role: 'BDD 시나리오 + TDD Red-Green-Refactor', model: 'sonnet' },
    { name: 'fe-build-fixer', role: 'tsc·린터(ESLint/Biome) 오류 최소 diff 수정', model: 'sonnet' },
  ],
  review: [
    { name: 'fe-reviewer', role: '4축 통합 리뷰', model: 'opus' },
    {
      name: 'fe-a11y-auditor',
      role: 'a11y 8축 감사 (Tailwind 팔레트 Color Contrast 포함)',
      model: 'sonnet',
    },
    {
      name: 'fe-perf-auditor',
      role: 'Next.js(RSC·next/image·next/font) / Vite SPA(번들·fetchpriority) 성능 감사',
      model: 'sonnet',
    },
    { name: 'fe-test-runner', role: '테스트 실행 + 실패 분류', model: 'sonnet' },
    { name: 'fe-refactor-advisor', role: '6차원 리팩토링 분석 + Before/After', model: 'opus' },
  ],
  pr: [
    { name: 'fe-git-operator', role: '커밋 분리·메시지 규칙·안전한 스테이징', model: 'sonnet' },
    { name: 'fe-pr-author', role: 'PR 본문 작성 + gh pr create', model: 'sonnet' },
  ],
}

const AGENTS_EN = {
  spec: [
    { name: 'fe-analyst', role: 'Requirements gap analysis (6 gaps / 7 sections)', model: 'opus' },
    { name: 'fe-vision', role: 'Figma · UI screenshot · PDF analysis', model: 'sonnet' },
    { name: 'fe-researcher', role: 'External docs & library research', model: 'sonnet' },
    {
      name: 'fe-architect',
      role: 'Next.js(RSC boundary) / Vite SPA(TanStack Router · React Router 7) architecture advice',
      model: 'opus',
    },
  ],
  build: [
    { name: 'fe-explorer', role: 'Codebase exploration', model: 'haiku' },
    { name: 'fe-test-author', role: 'BDD scenarios + TDD Red-Green-Refactor', model: 'sonnet' },
    {
      name: 'fe-build-fixer',
      role: 'Minimal diff fixes for tsc/linter (ESLint/Biome) errors',
      model: 'sonnet',
    },
  ],
  review: [
    { name: 'fe-reviewer', role: 'Integrated 4-axis review', model: 'opus' },
    {
      name: 'fe-a11y-auditor',
      role: 'a11y 8-axis audit (Tailwind palette Color Contrast included)',
      model: 'sonnet',
    },
    {
      name: 'fe-perf-auditor',
      role: 'Next.js(RSC · next/image · next/font) / Vite SPA(bundle · fetchpriority) performance audit',
      model: 'sonnet',
    },
    { name: 'fe-test-runner', role: 'Test execution + failure classification', model: 'sonnet' },
    {
      name: 'fe-refactor-advisor',
      role: '6-dimension refactoring analysis + Before/After',
      model: 'opus',
    },
  ],
  pr: [
    {
      name: 'fe-git-operator',
      role: 'Commit splitting · message rules · safe staging',
      model: 'sonnet',
    },
    { name: 'fe-pr-author', role: 'PR body writing + gh pr create', model: 'sonnet' },
  ],
}

const WORKFLOW: Record<Lang, Array<{ label: string; desc: string }>> = {
  ko: [
    { label: 'feature.md 작성', desc: '요구사항을 구조화된 스펙 파일로 변환' },
    { label: '/fe-rail:fe-start 실행', desc: '단 하나의 명령으로 전체 파이프라인 시작' },
    { label: '"구현할까요?" 승인', desc: '계획 확인 후 구현 시작' },
    { label: '자동 구현 + 4축 리뷰', desc: '코드 작성, tsc/lint 검증, 코드 리뷰' },
    { label: '"커밋할까요?" 승인', desc: '최종 확인 후 커밋 & PR 자동 생성' },
  ],
  en: [
    { label: 'Write feature.md', desc: 'Convert requirements into a structured spec file' },
    { label: 'Run /fe-rail:fe-start', desc: 'Start the full pipeline with a single command' },
    { label: 'Approve "Shall I implement?"', desc: 'Approve the plan and begin implementation' },
    {
      label: 'Auto implementation + review',
      desc: 'Code generation, tsc/lint validation, code review',
    },
    {
      label: 'Approve "Shall I commit?"',
      desc: 'Final confirmation, then commit & auto PR creation',
    },
  ],
}

const FAQS: Record<Lang, Array<{ q: string; a: string }>> = {
  ko: [
    {
      q: 'fe-rail은 어떤 프로젝트에 사용하나요?',
      a: 'React 또는 Next.js + TypeScript 프로젝트라면 어디든 사용할 수 있습니다. 번들러나 모노레포 구조와 무관하게 동작합니다.',
    },
    {
      q: '기존 프로젝트에 설치해도 되나요?',
      a: '네, 신규·기존 프로젝트 모두 설치 가능합니다. 플러그인은 프로젝트 파일을 수정하지 않으며, Claude Code 환경에 에이전트·훅·스킬을 추가하는 방식으로 동작합니다.',
    },
    {
      q: 'feature.md를 직접 작성해야 하나요?',
      a: '아니요. /fe-rail:fe-spec을 실행하면 요구사항을 입력받아 자동으로 feature.md를 생성합니다. 직접 작성해도 무방합니다.',
    },
    {
      q: '훅이 기존 워크플로우를 방해하지 않나요?',
      a: '훅은 위험한 명령만 차단하고, 품질 관련 항목은 경고만 출력합니다. ESLint/Prettier 자동 수정은 편집 후 즉시 적용됩니다.',
    },
    {
      q: '어떤 테스트 프레임워크를 지원하나요?',
      a: 'Vitest + Testing Library를 기본으로 지원합니다. BDD 시나리오 기반 TDD 사이클을 자동화합니다.',
    },
  ],
  en: [
    {
      q: 'What projects is fe-rail designed for?',
      a: 'Any React or Next.js + TypeScript project. It works regardless of bundler (Vite, Webpack, etc.) or monorepo structure.',
    },
    {
      q: 'Can I install it in an existing project?',
      a: 'Yes. fe-rail works with both new and existing projects. The plugin does not modify project files — it adds agents, hooks, and skills to the Claude Code environment.',
    },
    {
      q: 'Do I need to write feature.md manually?',
      a: 'No. Running /fe-rail:fe-spec will prompt you for requirements and generate feature.md automatically. Manual authoring is also supported.',
    },
    {
      q: 'Will hooks interfere with my existing workflow?',
      a: 'Hooks only block genuinely dangerous commands. Quality-related items emit warnings only. ESLint/Prettier auto-fixes are applied immediately after each edit.',
    },
    {
      q: 'What test frameworks are supported?',
      a: 'Vitest + Testing Library is the default. The TDD cycle (Red → Green → Refactor) is automated from BDD scenarios.',
    },
  ],
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const langSwitch: Variants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' } },
}

export default function FeRailPage() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<Lang>('ko')

  const t = TEXT[lang]
  const skills = SKILLS[lang]
  const agents = lang === 'ko' ? AGENTS_KO : AGENTS_EN
  const workflow = WORKFLOW[lang]
  const faqs = FAQS[lang]

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const sectionClass =
    'px-12 py-32 border-t border-[rgba(99,102,241,0.08)] even:bg-white/[0.02] max-[768px]:px-6 max-[768px]:py-20'
  const innerClass = 'max-w-[1200px] mx-auto w-full'
  const labelClass = 'text-[0.72rem] text-[#818cf8] tracking-[0.3em] uppercase mb-3'
  const titleClass =
    'text-[clamp(1.8rem,4vw,3.5rem)] font-extrabold tracking-[-0.025em] leading-[1.1] mb-4 text-[#f1f5f9]'
  const descClass =
    'text-[0.95rem] text-[#64748b] leading-[1.8] max-w-[560px] mb-16 max-[768px]:mb-10'

  return (
    <div
      className="min-h-screen text-[#f1f5f9] overflow-x-hidden"
      style={{
        backgroundColor: '#070b1a',
        backgroundImage: 'radial-gradient(rgba(99,102,241,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        fontFamily: 'var(--font-syne), sans-serif',
      }}
    >
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-12 py-5 bg-[rgba(7,11,26,0.88)] backdrop-blur-[20px] border-b border-[rgba(99,102,241,0.12)] max-[768px]:px-6 max-[768px]:py-4">
        <button
          type="button"
          onClick={() => void navigate('/')}
          className="inline-flex items-center gap-2 text-[0.75rem] text-[#64748b] tracking-[0.1em] bg-none border-none cursor-pointer p-0 transition-colors duration-200 hover:text-[#818cf8]"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          {t.nav.back}
        </button>
        <div
          className="text-[0.9rem] font-bold tracking-[0.2em] uppercase"
          style={{
            fontFamily: 'var(--font-mono), monospace',
            background: 'linear-gradient(135deg, #818cf8, #67e8f9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          fe-rail
        </div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setLang((l) => (l === 'ko' ? 'en' : 'ko'))}
            aria-label="언어 전환 / Toggle language"
            className="relative flex items-center text-[0.72rem] font-semibold tracking-[0.08em] bg-white/5 border-[1.5px] border-[rgba(99,102,241,0.22)] rounded-[100px] cursor-pointer p-0 overflow-hidden transition-[border-color,box-shadow] duration-200 shadow-[0_1px_4px_rgba(99,102,241,0.08)] hover:border-[rgba(99,102,241,0.45)] hover:shadow-[0_2px_10px_rgba(99,102,241,0.18)]"
            style={{ fontFamily: 'var(--font-mono), monospace' }}
          >
            <span
              className="absolute top-[2px] bottom-[2px] w-[calc(50%-2px)] bg-linear-to-br from-[#6366f1] to-[#4f46e5] rounded-[100px] transition-[left] duration-[250ms] shadow-[0_2px_8px_rgba(99,102,241,0.4)]"
              style={{ left: lang === 'ko' ? '2px' : 'calc(50%)' }}
            />
            <span
              className="relative z-[1] py-[0.38rem] px-[0.9rem] transition-colors duration-[250ms]"
              style={{ color: lang === 'ko' ? '#ffffff' : '#475569' }}
            >
              한
            </span>
            <span
              className="relative z-[1] py-[0.38rem] px-[0.9rem] transition-colors duration-[250ms]"
              style={{ color: lang !== 'ko' ? '#ffffff' : '#475569' }}
            >
              EN
            </span>
          </button>
          <a
            href="https://github.com/sh5623/fe-rail"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[0.75rem] text-[#64748b] tracking-[0.1em] no-underline transition-colors duration-200 hover:text-[#818cf8]"
            style={{ fontFamily: 'var(--font-mono), monospace' }}
          >
            {t.nav.github}
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center items-center px-12 pt-32 pb-24 relative overflow-hidden text-center max-[768px]:px-6 max-[768px]:pt-28 max-[768px]:pb-20">
        <div
          className="absolute w-[700px] h-[700px] rounded-full pointer-events-none top-[-180px] right-[-120px] max-[768px]:w-[385px] max-[768px]:h-[385px]"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)',
            animation: 'orbFloat 9s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none bottom-[-80px] left-[-80px] max-[768px]:w-[275px] max-[768px]:h-[275px]"
          style={{
            background: 'radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 65%)',
            animation: 'orbFloat 13s ease-in-out infinite reverse',
          }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center z-[1]"
        >
          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`badge-${lang}`}
                variants={langSwitch}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div
                  className="inline-flex items-center gap-[0.6rem] text-[0.72rem] text-[#818cf8] tracking-[0.18em] uppercase bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.22)] rounded-[100px] py-[0.45rem] pl-3 pr-[1.1rem] mb-8 backdrop-blur-[8px]"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  <span className="w-[7px] h-[7px] rounded-full bg-[#818cf8] shrink-0 animate-[pulse_2.2s_ease-in-out_infinite]" />
                  {t.hero.badge}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`title-${lang}`}
                variants={langSwitch}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <h1 className="text-[clamp(2.4rem,7vw,6rem)] font-extrabold leading-[1.1] tracking-[-0.03em] mb-6 max-w-[900px] text-[#f1f5f9] relative z-[1] max-[768px]:text-[clamp(2rem,8vw,3rem)]">
                  {t.hero.titlePre}{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #818cf8 0%, #34d399 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {t.hero.titleAccent}
                  </span>
                  {t.hero.titlePost}
                  <br />
                  {t.hero.titleLine2}
                </h1>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`sub-${lang}`}
                variants={langSwitch}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <p
                  className="text-[clamp(0.88rem,1.4vw,1.05rem)] text-[#64748b] leading-[1.85] max-w-[620px] mb-10 relative z-[1]"
                  style={{ fontFamily: 'var(--font-mono), monospace' }}
                >
                  {t.hero.subtitle.split('\n').map((line, i) => {
                    return (
                      <span
                        // biome-ignore lint/suspicious/noArrayIndexKey: text split by newline, no stable ID
                        key={i}
                      >
                        {line}
                        {i === 0 && <br />}
                      </span>
                    )
                  })}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="flex gap-4 justify-center flex-wrap relative z-[1]">
              <button
                type="button"
                onClick={() => scrollTo('install')}
                className="inline-flex items-center gap-2 py-[0.9rem] px-[2.25rem] bg-linear-to-br from-[#6366f1] to-[#4f46e5] text-white no-underline border-none rounded-[10px] transition-all duration-[250ms] shadow-[0_4px_20px_rgba(99,102,241,0.4)] cursor-pointer hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(99,102,241,0.55)] max-[480px]:flex-1 max-[480px]:justify-center"
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {t.hero.cta1}
              </button>
              <a
                href="https://github.com/sh5623/fe-rail"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-[0.9rem] px-[2.25rem] text-[#818cf8] border-[1.5px] border-[rgba(99,102,241,0.28)] no-underline rounded-[10px] transition-all duration-[250ms] cursor-pointer bg-[rgba(99,102,241,0.06)] backdrop-blur-[8px] hover:border-[rgba(99,102,241,0.55)] hover:bg-[rgba(99,102,241,0.12)] hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(99,102,241,0.2)] max-[480px]:flex-1 max-[480px]:justify-center"
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {t.hero.cta2}
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Skills */}
      <section id="skills" className={sectionClass}>
        <div className={innerClass}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`skills-header-${lang}`}
              variants={langSwitch}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className={labelClass} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {t.skills.label}
                </div>
                <h2 className={titleClass}>{t.skills.title}</h2>
                <p className={descClass} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {t.skills.desc}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-3 gap-5 max-[1024px]:grid-cols-2 max-[580px]:grid-cols-1">
              {skills.map((skill) => (
                <motion.div key={`${skill.id}-${lang}`} variants={fadeUp}>
                  <SkillCard {...skill} onClick={() => scrollTo(skill.id)} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Skill Details */}
      <section className={sectionClass}>
        <div className={innerClass}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`detail-header-${lang}`}
              variants={langSwitch}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className={labelClass} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {t.skills.detailLabel}
                </div>
                <h2 className={titleClass}>{t.skills.detailTitle}</h2>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-2 gap-5 max-[768px]:grid-cols-1">
              {skills.map((skill) => (
                <motion.div key={`detail-${skill.id}-${lang}`} variants={fadeUp}>
                  <div id={skill.id} style={{ scrollMarginTop: '100px' }}>
                    <div className="relative bg-white/[0.03] border border-[rgba(99,102,241,0.12)] rounded-[16px] p-8 overflow-hidden transition-all duration-[250ms] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-linear-to-r before:from-[#6366f1] before:to-[#34d399] before:scale-x-0 before:origin-left before:transition-transform before:duration-[350ms] before:rounded-tl-[16px] before:rounded-tr-[16px] hover:border-[rgba(99,102,241,0.28)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.12)] hover:bg-white/5 hover:before:scale-x-100">
                      <span className="text-[2rem] block mb-4">{skill.icon}</span>
                      <h3 className="text-[1.05rem] font-bold mb-[0.6rem] tracking-[-0.01em] text-[#f1f5f9]">
                        {skill.name}
                      </h3>
                      <p className="text-[0.85rem] text-[#64748b] leading-[1.75]">{skill.desc}</p>
                      <span
                        className="inline-block text-[0.72rem] text-[#34d399] bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.18)] py-[0.3rem] px-[0.85rem] rounded-[6px] mt-4 tracking-[0.04em]"
                        style={{ fontFamily: 'var(--font-mono), monospace' }}
                      >
                        {skill.cmd}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className={sectionClass}>
        <div className={innerClass}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`agents-header-${lang}`}
              variants={langSwitch}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className={labelClass} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {t.agents.label}
                </div>
                <h2 className={titleClass}>{t.agents.title}</h2>
                <p className={descClass} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {t.agents.desc}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          {(Object.keys(agents) as Array<keyof typeof agents>).map((phase) => (
            <motion.div
              key={`${phase}-${lang}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div
                className="text-[0.7rem] text-[#818cf8] tracking-[0.22em] uppercase mb-[0.9rem] flex items-center gap-3 after:content-[''] after:flex-1 after:h-px after:bg-[rgba(99,102,241,0.15)]"
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              >
                {t.agents.phases[phase]}
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3 mb-10">
                {agents[phase].map((agent) => (
                  <div
                    key={agent.name}
                    className="bg-white/[0.03] border border-[rgba(99,102,241,0.12)] rounded-[12px] px-6 py-5 transition-all duration-200 hover:border-[rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 hover:bg-white/5"
                  >
                    <div
                      className="text-[0.8rem] text-[#818cf8] mb-[0.45rem] font-semibold"
                      style={{ fontFamily: 'var(--font-mono), monospace' }}
                    >
                      {agent.name}
                    </div>
                    <div className="text-[0.8rem] text-[#64748b] leading-[1.55]">{agent.role}</div>
                    <div
                      className="text-[0.62rem] text-[rgba(52,211,153,0.8)] mt-3 tracking-[0.05em]"
                      style={{ fontFamily: 'var(--font-mono), monospace' }}
                    >
                      model: {agent.model}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className={sectionClass}>
        <div className={innerClass}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`workflow-header-${lang}`}
              variants={langSwitch}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className={labelClass} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {t.workflow.label}
                </div>
                <h2 className={titleClass}>{t.workflow.title}</h2>
                <p className={descClass} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {t.workflow.desc}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={`workflow-steps-${lang}`}
              variants={langSwitch}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="flex flex-col max-w-[520px]">
                  {workflow.map((step, i) => (
                    <motion.div key={step.label} variants={fadeUp}>
                      <div
                        className={`flex gap-6 items-start relative ${i < workflow.length - 1 ? "pb-9 before:content-[''] before:absolute before:left-[19px] before:top-[42px] before:w-px before:h-[calc(100%-42px)] before:bg-linear-to-b before:from-[rgba(99,102,241,0.3)] before:to-transparent" : ''}`}
                      >
                        <div
                          className="w-10 h-10 rounded-full bg-[rgba(99,102,241,0.1)] border-[1.5px] border-[rgba(99,102,241,0.25)] flex items-center justify-center text-[0.78rem] text-[#818cf8] font-bold shrink-0"
                          style={{ fontFamily: 'var(--font-mono), monospace' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="pt-[0.45rem]">
                          <div
                            className="text-[0.88rem] font-semibold text-[#f1f5f9] mb-[0.35rem]"
                            style={{ fontFamily: 'var(--font-mono), monospace' }}
                          >
                            {step.label}
                          </div>
                          <div className="text-[0.82rem] text-[#64748b] leading-[1.65]">
                            {step.desc}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Install */}
      <section id="install" className={sectionClass}>
        <div className={innerClass}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`install-header-${lang}`}
              variants={langSwitch}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className={labelClass} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {t.install.label}
                </div>
                <h2 className={titleClass}>{t.install.title}</h2>
                <p className={descClass} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {t.install.desc}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          >
            <pre
              className="bg-[#020617] border border-[rgba(99,102,241,0.15)] rounded-[14px] py-7 px-8 text-[0.82rem] leading-[1.9] text-[#e2e8f0] overflow-x-auto shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(99,102,241,0.08)] max-[768px]:py-5 max-[768px]:px-5 max-[768px]:text-[0.75rem]"
              style={{ fontFamily: 'var(--font-mono), monospace' }}
            >
              <span className="text-[#475569]">{t.install.comment1}</span>
              {'\n\n'}
              <span className="text-[#475569]">{t.install.comment2}</span>
              {'\n'}
              <span className="text-[#34d399]">/plugin marketplace add sh5623/fe-rail</span>
              {'\n'}
              <span className="text-[#34d399]">/plugin install fe-rail@fe-rail-market</span>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={sectionClass}>
        <div className={innerClass}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`faq-header-${lang}`}
              variants={langSwitch}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className={labelClass} style={{ fontFamily: 'var(--font-mono), monospace' }}>
                  {t.faq.label}
                </div>
                <h2 className={titleClass}>{t.faq.title}</h2>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={`faq-list-${lang}`}
              variants={langSwitch}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="max-w-[800px]">
                  {faqs.map((faq) => (
                    <motion.div key={faq.q} variants={fadeUp}>
                      <div className="bg-white/[0.03] border border-[rgba(99,102,241,0.1)] rounded-[14px] py-7 px-8 mb-3 transition-all duration-200 hover:border-[rgba(99,102,241,0.22)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.08)] hover:bg-white/5">
                        <div className="text-[0.98rem] font-bold text-[#f1f5f9] mb-[0.65rem] tracking-[-0.01em]">
                          {faq.q}
                        </div>
                        <div
                          className="text-[0.88rem] text-[#64748b] leading-[1.8]"
                          style={{ fontFamily: 'var(--font-mono), monospace' }}
                        >
                          {faq.a}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <footer
        className="px-12 py-8 flex justify-between items-center border-t border-[rgba(99,102,241,0.08)] text-[0.68rem] text-[#334155] tracking-[0.1em] bg-black/20 max-[768px]:px-6 max-[768px]:py-6 max-[768px]:flex-col max-[768px]:gap-1 max-[768px]:text-center"
        style={{ fontFamily: 'var(--font-mono), monospace' }}
      >
        <span>{t.footer}</span>
        <span>by 이승호</span>
      </footer>
    </div>
  )
}
