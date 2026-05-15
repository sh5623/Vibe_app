'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { SkillCard } from './SkillCard';
import {
  PageWrapper,
  Nav,
  NavButton,
  NavAnchor,
  NavLogo,
  LangToggle,
  HeroSection,
  HeroOrb,
  HeroBadge,
  HeroTitle,
  HeroSubtitle,
  CTARow,
  CTAPrimary,
  CTASecondary,
  SectionOuter,
  SectionInner,
  SectionLabel,
  SectionTitle,
  SectionDesc,
  SkillsGrid,
  SkillDetailSection,
  SkillDetailGrid,
  SkillDetailCard,
  SkillDetailTitle,
  SkillDetailDesc,
  AgentPhaseLabel,
  AgentGrid,
  AgentCard,
  WorkflowList,
  WorkflowStep,
  WorkflowNum,
  WorkflowContent,
  CodeBlock,
  FAQList,
  FAQItem,
  PageFooter,
} from './styled';

type Lang = 'ko' | 'en';

// ─── 콘텐츠 ───────────────────────────────────────────────────────────────────

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
        'React / Next.js + TypeScript 프로젝트에서 기획부터 PR까지\nspec → build → review → PR 사이클을 자동화하는 Claude Code 플러그인',
      cta1: '시작하기 →',
      cta2: 'GitHub에서 보기',
    },
    skills: {
      label: 'Skills',
      title: '5가지 핵심 스킬',
      desc: '카드를 클릭하면 해당 스킬 상세로 이동합니다.',
      detailLabel: 'Skills / Details',
      detailTitle: '스킬 상세',
      btnText: '자세히 보기',
    },
    agents: {
      label: 'Agents',
      title: '14개 전용 에이전트',
      desc: '각 단계마다 전용 에이전트가 독립적으로 동작합니다.',
      phases: {
        spec: 'Spec 단계',
        build: 'Build 단계',
        review: 'Review 단계',
        pr: 'PR 단계',
      },
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
      comment1: '# 전제 조건: Claude Code, pnpm, gh CLI',
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
        'A Claude Code plugin that automates the full frontend workflow\n— spec → build → review → PR — for React / Next.js + TypeScript projects.',
      cta1: 'Get Started →',
      cta2: 'View on GitHub',
    },
    skills: {
      label: 'Skills',
      title: '5 Core Skills',
      desc: 'Click a card to jump to its detail section.',
      detailLabel: 'Skills / Details',
      detailTitle: 'Skill Details',
      btnText: 'Learn More',
    },
    agents: {
      label: 'Agents',
      title: '14 Dedicated Agents',
      desc: 'Each phase has a dedicated agent running independently.',
      phases: {
        spec: 'Spec Phase',
        build: 'Build Phase',
        review: 'Review Phase',
        pr: 'PR Phase',
      },
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
      comment1: '# Prerequisites: Claude Code, pnpm, gh CLI',
      comment2: '# Run inside Claude Code terminal',
    },
    faq: { label: 'FAQ', title: 'Frequently Asked Questions' },
    footer: 'fe-rail — Claude Code Plugin',
  },
} as const;

const SKILLS: Record<Lang, Array<{ id: string; icon: string; name: string; title: string; desc: string; cmd: string }>> = {
  ko: [
    { id: 'fe-spec', icon: '📋', name: 'fe-spec', title: '스펙 자동화', desc: '기능 요구사항을 구조화된 feature.md로 변환합니다. 갭 분석 → Figma 분석 → 외부 문서 조사 → 아키텍처 자문까지 4개 에이전트가 협력합니다.', cmd: '/fe-rail:fe-spec' },
    { id: 'fe-build', icon: '🔨', name: 'fe-build', title: '코드 구현', desc: '타입 정의 → 훅/서비스 → 컴포넌트 → 테스트 순서로 구현합니다. ESLint·Prettier 자동 적용, tsc/eslint 오류 자동 수정.', cmd: '/fe-rail:fe-build' },
    { id: 'fe-review', icon: '🔍', name: 'fe-review', title: '4축 코드 리뷰', desc: '타입 안전성·성능·접근성(WCAG AA)·코드 품질 4개 축으로 리뷰합니다. 각 축은 전용 에이전트가 독립적으로 감사합니다.', cmd: '/fe-rail:fe-review' },
    { id: 'fe-start', icon: '⚡', name: 'fe-start', title: '원스톱 자동화', desc: 'spec → build → review → PR 전 과정을 하나의 명령으로 실행합니다. 사람 개입은 두 번뿐입니다.', cmd: '/fe-rail:fe-start feature.md' },
    { id: 'fe-doc-sync', icon: '📝', name: 'fe-doc-sync', title: '문서 동기화', desc: 'hooks·skills·agents 변경 감지 시 CLAUDE.md와 README.md 수정안을 자동으로 제안합니다.', cmd: '/fe-rail:fe-doc-sync' },
  ],
  en: [
    { id: 'fe-spec', icon: '📋', name: 'fe-spec', title: 'Spec Automation', desc: 'Converts feature requirements into a structured feature.md. Four agents collaborate — gap analysis → Figma analysis → external docs research → architecture advice.', cmd: '/fe-rail:fe-spec' },
    { id: 'fe-build', icon: '🔨', name: 'fe-build', title: 'Code Implementation', desc: 'Implements in order: type definitions → hooks/services → components → tests. Applies ESLint·Prettier automatically and auto-fixes tsc/eslint errors.', cmd: '/fe-rail:fe-build' },
    { id: 'fe-review', icon: '🔍', name: 'fe-review', title: '4-Axis Code Review', desc: 'Reviews across four axes — type safety, performance, accessibility (WCAG AA), and code quality. Each axis is audited by a dedicated agent independently.', cmd: '/fe-rail:fe-review' },
    { id: 'fe-start', icon: '⚡', name: 'fe-start', title: 'One-Shot Automation', desc: 'Runs the entire spec → build → review → PR pipeline in a single command. Human intervention occurs only twice.', cmd: '/fe-rail:fe-start feature.md' },
    { id: 'fe-doc-sync', icon: '📝', name: 'fe-doc-sync', title: 'Doc Sync', desc: 'Detects changes to hooks, skills, and agents and automatically proposes updates to CLAUDE.md and README.md.', cmd: '/fe-rail:fe-doc-sync' },
  ],
};

const AGENTS_KO = {
  spec: [
    { name: 'fe-analyst', role: '요구사항 갭 분석 (6갭 / 7섹션)', model: 'opus' },
    { name: 'fe-vision', role: 'Figma·UI 스크린샷·PDF 분석', model: 'sonnet' },
    { name: 'fe-researcher', role: '외부 문서·라이브러리 조사', model: 'sonnet' },
    { name: 'fe-architect', role: 'Next.js 아키텍처·RSC 경계 자문', model: 'opus' },
  ],
  build: [
    { name: 'fe-explorer', role: '코드베이스 탐색', model: 'haiku' },
    { name: 'fe-test-author', role: 'BDD 시나리오 + TDD Red-Green-Refactor', model: 'sonnet' },
    { name: 'fe-build-fixer', role: 'tsc/eslint 오류 최소 diff 수정', model: 'sonnet' },
  ],
  review: [
    { name: 'fe-reviewer', role: '4축 통합 리뷰', model: 'sonnet' },
    { name: 'fe-a11y-auditor', role: 'WCAG AA 접근성 정밀 감사', model: 'sonnet' },
    { name: 'fe-perf-auditor', role: 'RSC·번들·Image·Font 성능 감사', model: 'sonnet' },
    { name: 'fe-test-runner', role: '테스트 실행 + 실패 분류', model: 'sonnet' },
    { name: 'fe-refactor-advisor', role: '6차원 리팩토링 분석', model: 'sonnet' },
  ],
  pr: [
    { name: 'fe-git-operator', role: '커밋 분리·메시지 규칙·안전한 스테이징', model: 'sonnet' },
    { name: 'fe-pr-author', role: 'PR 본문 작성 + gh pr create', model: 'sonnet' },
  ],
};

const AGENTS_EN = {
  spec: [
    { name: 'fe-analyst', role: 'Requirements gap analysis (6 gaps / 7 sections)', model: 'opus' },
    { name: 'fe-vision', role: 'Figma · UI screenshot · PDF analysis', model: 'sonnet' },
    { name: 'fe-researcher', role: 'External docs & library research', model: 'sonnet' },
    { name: 'fe-architect', role: 'Next.js architecture · RSC boundary advice', model: 'opus' },
  ],
  build: [
    { name: 'fe-explorer', role: 'Codebase exploration', model: 'haiku' },
    { name: 'fe-test-author', role: 'BDD scenarios + TDD Red-Green-Refactor', model: 'sonnet' },
    { name: 'fe-build-fixer', role: 'Minimal diff fixes for tsc/eslint errors', model: 'sonnet' },
  ],
  review: [
    { name: 'fe-reviewer', role: 'Integrated 4-axis review', model: 'sonnet' },
    { name: 'fe-a11y-auditor', role: 'WCAG AA accessibility audit', model: 'sonnet' },
    { name: 'fe-perf-auditor', role: 'RSC · bundle · Image · Font performance audit', model: 'sonnet' },
    { name: 'fe-test-runner', role: 'Test execution + failure classification', model: 'sonnet' },
    { name: 'fe-refactor-advisor', role: '6-dimension refactoring analysis', model: 'sonnet' },
  ],
  pr: [
    { name: 'fe-git-operator', role: 'Commit splitting · message rules · safe staging', model: 'sonnet' },
    { name: 'fe-pr-author', role: 'PR body writing + gh pr create', model: 'sonnet' },
  ],
};

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
    { label: 'Auto implementation + review', desc: 'Code generation, tsc/lint validation, code review' },
    { label: 'Approve "Shall I commit?"', desc: 'Final confirmation, then commit & auto PR creation' },
  ],
};

const FAQS: Record<Lang, Array<{ q: string; a: string }>> = {
  ko: [
    { q: 'fe-rail은 어떤 프로젝트에 사용하나요?', a: 'React 또는 Next.js + TypeScript 프로젝트라면 어디든 사용할 수 있습니다. 번들러나 모노레포 구조와 무관하게 동작합니다.' },
    { q: '기존 프로젝트에 설치해도 되나요?', a: '네, 신규·기존 프로젝트 모두 설치 가능합니다. 플러그인은 프로젝트 파일을 수정하지 않으며, Claude Code 환경에 에이전트·훅·스킬을 추가하는 방식으로 동작합니다.' },
    { q: 'feature.md를 직접 작성해야 하나요?', a: '아니요. /fe-rail:fe-spec을 실행하면 요구사항을 입력받아 자동으로 feature.md를 생성합니다. 직접 작성해도 무방합니다.' },
    { q: '훅이 기존 워크플로우를 방해하지 않나요?', a: '훅은 위험한 명령만 차단하고, 품질 관련 항목은 경고만 출력합니다. ESLint/Prettier 자동 수정은 편집 후 즉시 적용됩니다.' },
    { q: '어떤 테스트 프레임워크를 지원하나요?', a: 'Vitest + Testing Library를 기본으로 지원합니다. BDD 시나리오 기반 TDD 사이클을 자동화합니다.' },
  ],
  en: [
    { q: 'What projects is fe-rail designed for?', a: 'Any React or Next.js + TypeScript project. It works regardless of bundler (Vite, Webpack, etc.) or monorepo structure.' },
    { q: 'Can I install it in an existing project?', a: 'Yes. fe-rail works with both new and existing projects. The plugin does not modify project files — it adds agents, hooks, and skills to the Claude Code environment.' },
    { q: 'Do I need to write feature.md manually?', a: 'No. Running /fe-rail:fe-spec will prompt you for requirements and generate feature.md automatically. Manual authoring is also supported.' },
    { q: 'Will hooks interfere with my existing workflow?', a: 'Hooks only block genuinely dangerous commands. Quality-related items emit warnings only. ESLint/Prettier auto-fixes are applied immediately after each edit.' },
    { q: 'What test frameworks are supported?', a: 'Vitest + Testing Library is the default. The TDD cycle (Red → Green → Refactor) is automated from BDD scenarios.' },
  ],
};

// ─── 애니메이션 ────────────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const langSwitch: Variants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' } },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FeRailPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('ko');

  const t = TEXT[lang];
  const skills = SKILLS[lang];
  const agents = lang === 'ko' ? AGENTS_KO : AGENTS_EN;
  const workflow = WORKFLOW[lang];
  const faqs = FAQS[lang];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PageWrapper>
      {/* Navigation */}
      <Nav>
        <NavButton onClick={() => router.push('/')}>{t.nav.back}</NavButton>
        <NavLogo>fe-rail</NavLogo>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <LangToggle
            $active={lang === 'ko'}
            onClick={() => setLang((l) => (l === 'ko' ? 'en' : 'ko'))}
            aria-label="언어 전환 / Toggle language"
          >
            <span className="slider" />
            <span className="opt opt-ko">한</span>
            <span className="opt opt-en">EN</span>
          </LangToggle>
          <NavAnchor
            href="https://github.com/sh5623/fe-rail"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.nav.github}
          </NavAnchor>
        </div>
      </Nav>

      {/* Hero */}
      <HeroSection>
        <HeroOrb $color="rgba(99,102,241,0.22)" $size="700px" $top="-180px" $right="-120px" />
        <HeroOrb
          $color="rgba(52,211,153,0.12)"
          $size="500px"
          $bottom="-80px"
          $left="-80px"
          $delay="13s"
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}
        >
          <motion.div variants={fadeUp}>
            <HeroBadge>
              <span className="dot" />
              {t.hero.badge}
            </HeroBadge>
          </motion.div>

          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              <motion.div key={`hero-title-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
                <HeroTitle>
                  {t.hero.titlePre} <span className="accent">{t.hero.titleAccent}</span>
                  {t.hero.titlePost}
                  <br />
                  {t.hero.titleLine2}
                </HeroTitle>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              <motion.div key={`hero-sub-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
                <HeroSubtitle>
                  {t.hero.subtitle.split('\n').map((line, i) => (
                    <span key={i}>{line}{i === 0 && <br />}</span>
                  ))}
                </HeroSubtitle>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              <motion.div key={`hero-cta-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
                <CTARow>
                  <CTAPrimary
                    href="#install"
                    onClick={(e) => { e.preventDefault(); scrollTo('install'); }}
                  >
                    {t.hero.cta1}
                  </CTAPrimary>
                  <CTASecondary
                    href="https://github.com/sh5623/fe-rail"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.hero.cta2}
                  </CTASecondary>
                </CTARow>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </HeroSection>

      {/* Skills — SkillCard 라우팅 */}
      <SectionOuter id="skills">
        <SectionInner>
          <AnimatePresence mode="wait">
            <motion.div key={`skills-header-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <SectionLabel>{t.skills.label}</SectionLabel>
                <SectionTitle>{t.skills.title}</SectionTitle>
                <SectionDesc>{t.skills.desc}</SectionDesc>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <SkillsGrid>
              {skills.map((skill) => (
                <motion.div key={skill.id} variants={fadeUp}>
                  <AnimatePresence mode="wait">
                    <motion.div key={`skill-card-${skill.id}-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
                      <SkillCard
                        icon={skill.icon}
                        name={skill.name}
                        title={skill.title}
                        desc={skill.desc}
                        cmd={skill.cmd}
                        onClick={() => scrollTo(skill.id)}
                      />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ))}
            </SkillsGrid>
          </motion.div>
        </SectionInner>
      </SectionOuter>

      {/* Skill Details */}
      <SectionOuter>
        <SectionInner>
          <AnimatePresence mode="wait">
            <motion.div key={`detail-header-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <SectionLabel>{t.skills.detailLabel}</SectionLabel>
                <SectionTitle>{t.skills.detailTitle}</SectionTitle>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <SkillDetailGrid>
              {skills.map((skill) => (
                <motion.div key={`${skill.id}-${lang}`} variants={fadeUp}>
                  <SkillDetailSection id={skill.id}>
                    <SkillDetailCard>
                      <span className="icon">{skill.icon}</span>
                      <SkillDetailTitle>{skill.name}</SkillDetailTitle>
                      <SkillDetailDesc>{skill.desc}</SkillDetailDesc>
                      <span className="cmd">{skill.cmd}</span>
                    </SkillDetailCard>
                  </SkillDetailSection>
                </motion.div>
              ))}
            </SkillDetailGrid>
          </motion.div>
        </SectionInner>
      </SectionOuter>

      {/* Agents */}
      <SectionOuter id="agents">
        <SectionInner>
          <AnimatePresence mode="wait">
            <motion.div key={`agents-header-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <SectionLabel>{t.agents.label}</SectionLabel>
                <SectionTitle>{t.agents.title}</SectionTitle>
                <SectionDesc>{t.agents.desc}</SectionDesc>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {(Object.keys(agents) as Array<keyof typeof agents>).map((phase) => (
            <AnimatePresence mode="wait" key={phase}>
              <motion.div
                key={`agent-phase-${phase}-${lang}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <AgentPhaseLabel>{t.agents.phases[phase]}</AgentPhaseLabel>
                <AgentGrid>
                  {agents[phase].map((agent) => (
                    <AgentCard key={agent.name}>
                      <div className="name">{agent.name}</div>
                      <div className="role">{agent.role}</div>
                      <div className="model">model: {agent.model}</div>
                    </AgentCard>
                  ))}
                </AgentGrid>
              </motion.div>
            </AnimatePresence>
          ))}
        </SectionInner>
      </SectionOuter>

      {/* Workflow */}
      <SectionOuter id="workflow">
        <SectionInner>
          <AnimatePresence mode="wait">
            <motion.div key={`workflow-header-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <SectionLabel>{t.workflow.label}</SectionLabel>
                <SectionTitle>{t.workflow.title}</SectionTitle>
                <SectionDesc>{t.workflow.desc}</SectionDesc>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div key={`workflow-steps-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
              <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <WorkflowList>
                  {workflow.map((step, i) => (
                    <motion.div key={i} variants={fadeUp}>
                      <WorkflowStep>
                        <WorkflowNum>{String(i + 1).padStart(2, '0')}</WorkflowNum>
                        <WorkflowContent>
                          <div className="label">{step.label}</div>
                          <div className="desc">{step.desc}</div>
                        </WorkflowContent>
                      </WorkflowStep>
                    </motion.div>
                  ))}
                </WorkflowList>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </SectionInner>
      </SectionOuter>

      {/* Install */}
      <SectionOuter id="install">
        <SectionInner>
          <AnimatePresence mode="wait">
            <motion.div key={`install-header-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <SectionLabel>{t.install.label}</SectionLabel>
                <SectionTitle>{t.install.title}</SectionTitle>
                <SectionDesc>{t.install.desc}</SectionDesc>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`install-code-${lang}`}
              variants={langSwitch}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
              >
                <CodeBlock>
                  <span className="comment">{t.install.comment1}</span>
                  {'\n\n'}
                  <span className="comment">{t.install.comment2}</span>
                  {'\n'}
                  <span className="cmd">/plugin marketplace add sh5623/fe-rail</span>
                  {'\n'}
                  <span className="cmd">/plugin install fe-rail@fe-rail-market</span>
                </CodeBlock>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </SectionInner>
      </SectionOuter>

      {/* FAQ */}
      <SectionOuter id="faq">
        <SectionInner>
          <AnimatePresence mode="wait">
            <motion.div key={`faq-header-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <SectionLabel>{t.faq.label}</SectionLabel>
                <SectionTitle>{t.faq.title}</SectionTitle>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div key={`faq-list-${lang}`} variants={langSwitch} initial="enter" animate="center" exit="exit">
              <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <FAQList>
                  {faqs.map((faq, i) => (
                    <motion.div key={i} variants={fadeUp}>
                      <FAQItem>
                        <div className="q">{faq.q}</div>
                        <div className="a">{faq.a}</div>
                      </FAQItem>
                    </motion.div>
                  ))}
                </FAQList>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </SectionInner>
      </SectionOuter>

      <PageFooter>
        <span>{t.footer}</span>
        <span>by 이승호</span>
      </PageFooter>
    </PageWrapper>
  );
}
