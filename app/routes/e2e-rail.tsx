import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Ban,
  Bot,
  Check,
  ChevronDown,
  Fingerprint,
  Github,
  LayoutGrid,
  Radar,
  ShieldAlert,
  Target,
  Terminal,
  TestTubeDiagonal,
  Wrench,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import type { LinksFunction } from 'react-router'
import { useNavigate } from 'react-router'
import type { Route } from './+types/e2e-rail'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap',
  },
]

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'e2e-rail | Claude Code · Codex Plugin' },
    {
      name: 'description',
      content:
        '변경이 닿을 수 있는 Playwright spec만 근거와 함께 고르고, 모든 실행을 검증한 코드의 지문에 묶어 남기고, 측정값으로 샤드를 나누는 Claude Code · Codex 플러그인.',
    },
  ]
}

const GITHUB_URL = 'https://github.com/sh5623/e2e-rail'
const mono = "[font-family:'JetBrains_Mono',ui-monospace,SFMono-Regular,Menlo,monospace]"

const cardClass = 'bg-white/[0.03] border border-white/10 rounded-lg'
const focusClass =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ade80]'

/* ───────────── data ───────────── */

interface Verb {
  id: string
  icon: ReactNode
  verb: string
  line: string
  detail: string
}

const VERBS: Verb[] = [
  {
    id: 'select',
    icon: <Target className="w-5 h-5" aria-hidden="true" />,
    verb: '고른다',
    line: '변경이 닿을 수 있는 spec만, 각각 근거와 함께',
    detail: '판정할 수 없으면 좁히지 않고 전수로 넓힙니다.',
  },
  {
    id: 'record',
    icon: <Fingerprint className="w-5 h-5" aria-hidden="true" />,
    verb: '남긴다',
    line: '모든 실행을 검증한 코드의 지문에 묶어서',
    detail: '"아까 통과했다"를 가정하지 않고 verify로 확인합니다.',
  },
  {
    id: 'shard',
    icon: <LayoutGrid className="w-5 h-5" aria-hidden="true" />,
    verb: '나눈다',
    line: '머신당 무거운 실행 1개, 워커와 샤드는 측정값으로',
    detail: '락 하나가 레포와 워크트리를 가리지 않고 머신 전체를 맡습니다.',
  },
]

interface Stat {
  value: string
  label: string
}

const STATS: Stat[] = [
  { value: '0', label: '런타임 의존성 (Node CLI)' },
  { value: '5', label: '스킬 · init select gate measure shadow' },
  { value: '1', label: '읽기 전용 에이전트' },
  { value: '~30분', label: '레포 하나 세팅' },
]

interface BlockLine {
  key: string
  text: string
  tone: 'muted' | 'base' | 'accent' | 'warn'
}

const SELECTION_BLOCK: BlockLine[] = [
  { key: 'cmd', text: '$ pnpm exec e2e-rail select --base last-green', tone: 'muted' },
  {
    key: 'change',
    text: 'change:   order search filter (OrderSearchFilter.tsx +2 more)',
    tone: 'base',
  },
  { key: 'selected', text: 'selected: orders · order-detail', tone: 'accent' },
  { key: 'reason1', text: '  route:orders ← OrdersPage.tsx', tone: 'muted' },
  { key: 'reason2', text: '  api:**/api/orders/** ← /api/orders/list', tone: 'muted' },
  { key: 'added', text: 'added:    none      removed: none', tone: 'base' },
  { key: 'unmapped', text: 'unmapped: 1 (map --check lists them)', tone: 'warn' },
  { key: 'final', text: 'final:    full run in the integration step · trust shadow', tone: 'base' },
]

const toneClass: Record<BlockLine['tone'], string> = {
  muted: 'text-slate-400',
  base: 'text-slate-200',
  accent: 'text-[#4ade80]',
  warn: 'text-[#fbbf24]',
}

interface Scenario {
  id: string
  file: string
  outcome: 'partial' | 'full' | 'ignore'
  result: string
  reason: string
  why: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'src',
    file: 'src/features/orders/OrderSearchFilter.tsx',
    outcome: 'partial',
    result: 'orders · order-detail 두 spec',
    reason: 'route:orders ← OrdersPage.tsx',
    why: 'import 그래프가 변경 파일에서 위로 올라가 닿는 라우트를 찾고, 그 라우트를 방문하는 spec만 고릅니다. unmapped spec은 매번 함께 탑니다.',
  },
  {
    id: 'spec',
    file: 'e2e/orders.spec.ts',
    outcome: 'partial',
    result: 'e2e/orders.spec.ts 한 개',
    reason: 'spec-self:e2e/orders.spec.ts',
    why: 'spec 파일 자체가 바뀌면 그 spec만 돕니다. Playwright가 나열하지 않아 인덱스가 모르는 파일이면 앱 전수로 넓힙니다.',
  },
  {
    id: 'md',
    file: 'README.md',
    outcome: 'ignore',
    result: '실행 없음',
    reason: 'ignore: **/*.md',
    why: '문서는 실행을 일으키지 않습니다. 단 specDir 아래 테스트 파일은 무시 대상이 아닙니다.',
  },
  {
    id: 'tier',
    file: 'src/stores/cart.ts',
    outcome: 'full',
    result: '그 앱의 spec 전부',
    reason: 'tier-full:src/stores/**',
    why: '셸·스토어·레이아웃처럼 모든 페이지에 영향을 주는 경로는 설정의 tiers.full에 올려 둡니다. (예시 설정 기준)',
  },
  {
    id: 'shared',
    file: 'pnpm-lock.yaml',
    outcome: 'full',
    result: '모든 앱의 spec 전부',
    reason: 'shared:pnpm-lock.yaml',
    why: '레포 전체가 공유하는 파일은 앱을 가리지 않고 전수입니다. (예시 설정 기준)',
  },
  {
    id: 'svg',
    file: 'src/assets/logo.svg',
    outcome: 'full',
    result: '그 앱의 spec 전부',
    reason: 'graph-unresolved:src/assets/logo.svg',
    why: '코드가 아닌 파일은 import 그래프에 없습니다. 모름은 "변경 없음"이 아니므로 넓힙니다.',
  },
]

const OUTCOME_META: Record<Scenario['outcome'], { label: string; exit: string; color: string }> = {
  partial: { label: 'PARTIAL', exit: '종료 0', color: 'text-[#4ade80]' },
  full: { label: 'FULL', exit: '종료 10', color: 'text-[#fbbf24]' },
  ignore: { label: 'IGNORED', exit: '종료 0', color: 'text-slate-300' },
}

interface RuleRow {
  n: string
  match: string
  result: string
}

const RULES: RuleRow[] = [
  { n: '1', match: '`ignore` 또는 `tiers.ignore`에 맞음 · 원장 디렉터리 안', result: '무시' },
  { n: '2', match: '`shared`에 맞음', result: '전 앱 전수 (shared:<file>)' },
  { n: '3', match: '어느 앱 root에도 속하지 않음', result: '전 앱 전수 (unknown-root:<file>)' },
  { n: '4', match: '앱의 `tiers.full`에 맞음', result: '그 앱 전수 (tier-full:<glob>)' },
  { n: '5', match: 'specDir의 테스트 파일', result: '그 spec (spec-self:<file>)' },
  { n: '6', match: 'srcDir 아래', result: '닿는 spec · 사각지대가 있으면 앱 전수' },
  { n: '7', match: '그 밖의 앱 파일', result: '그 앱 전수 (app-other:<file>)' },
]

interface FingerprintField {
  name: string
  note: string
}

const FINGERPRINT: FingerprintField[] = [
  { name: 'head', note: '검증한 커밋' },
  { name: 'diff', note: '미커밋 변경 해시' },
  { name: 'untracked', note: '추적 안 되는 파일 해시' },
  { name: 'config', note: 'e2e-rail · Playwright 설정 해시' },
  { name: 'playwright', note: 'Playwright 버전' },
  { name: 'dist', note: 'preview 모드의 빌드 결과' },
]

interface VerifyExit {
  code: string
  word: string
  desc: string
  color: string
  border: string
}

const VERIFY_EXITS: VerifyExit[] = [
  {
    code: '0',
    word: 'verified',
    desc: '이 앱 · 이 모드 · 이 지문 · 통과 · 필터 없음인 실행이 원장에 있다',
    color: 'text-[#4ade80]',
    border: 'border-[#4ade80]/30',
  },
  {
    code: '20',
    word: 'stale',
    desc: '그 뒤로 코드가 바뀌었거나, 이전 검증 정책으로 기록된 줄뿐이다',
    color: 'text-[#fbbf24]',
    border: 'border-[#fbbf24]/30',
  },
  {
    code: '21',
    word: 'insufficient',
    desc: '요구한 수준(full 또는 selected)에 못 미치는 실행뿐이다',
    color: 'text-[#fb7185]',
    border: 'border-[#fb7185]/30',
  },
]

const NOT_VERIFICATION: string[] = [
  '재실행(rerun)은 절대 세지 않는다',
  '-g · --grep · --project 같은 테스트 필터는 filtered',
  '--retries · --timeout · -u · --ignore-snapshots는 검사를 느슨하게 하므로 filtered',
  '임의의 --test-list 실행과 measure workers 실행은 세지 않는다',
]

interface ShadowOutcome {
  id: string
  label: string
  effect: string
  desc: string
  color: string
}

const SHADOW_OUTCOMES: ShadowOutcome[] = [
  {
    id: 'hit',
    label: 'hit',
    effect: 'streak +1',
    desc: '실패한 spec이 모두 선택 안에 있었다. 통과한 실행도 hit이다',
    color: 'text-[#4ade80]',
  },
  {
    id: 'miss',
    label: 'miss',
    effect: 'streak → 0',
    desc: '선택이 놓친 spec을 적고 처음부터 다시 센다',
    color: 'text-[#fb7185]',
  },
  {
    id: 'trivial',
    label: 'trivial',
    effect: 'streak 유지',
    desc: '선택이 이미 전수였다. 증거가 되지 않는다',
    color: 'text-[#fbbf24]',
  },
  {
    id: 'unpaired',
    label: 'unpaired',
    effect: 'streak 유지',
    desc: '이 코드에 대해 계산된 선택이 없다',
    color: 'text-slate-300',
  },
]

interface Step {
  n: string
  title: string
  desc: string
}

const SHADOW_STEPS: Step[] = [
  {
    n: '1',
    title: 'trust shadow로 시작',
    desc: '선택 실행은 전부 shadowed로 기록되고, select --remove는 거부된다',
  },
  {
    n: '2',
    title: '라운드마다 전수 + record',
    desc: '합본 전수가 검증할 그 코드에서 select를 계산하고, 전수를 돌리고, shadow record',
  },
  {
    n: '3',
    title: '연속 hit이 promoteAfter(기본 3)에 도달',
    desc: 'shadow status가 promotable yes를 찍는다',
  },
  {
    n: '4',
    title: '사람이 shadow promote',
    desc: '자동 승격은 없다. 승격 뒤에도 전수는 합본 단계에서 돈다',
  },
]

interface ShardCard {
  title: string
  command: string
  desc: string
}

const SHARD_CARDS: ShardCard[] = [
  {
    title: '락',
    command: 'e2e-rail lock status',
    desc: '전수·샤드·워커 미지정 실행은 배타적인 heavy 락을, 나머지는 light 두 자리를 나눠 씁니다. 대기 중인 heavy가 있으면 새 light는 들어가지 못합니다.',
  },
  {
    title: '워커',
    command: 'e2e-rail measure workers 1,2,4 --test-list <file>',
    desc: '같은 목록을 워커 수마다 한 번씩, 매번 배타 락 아래서 돌려 벽시계·실패·재시도·부하를 비교합니다. 이긴 값은 사람이 run.workers에 적습니다.',
  },
  {
    title: '분산',
    command: 'e2e-rail shard plan --app <app> --count <n>',
    desc: '측정 시간으로 긴 spec부터 가장 가벼운 샤드에 나눕니다. shard merge는 한 분할의 모든 샤드가 정확히 이 코드에서 통과했을 때만 complete: yes를 찍습니다.',
  },
]

interface SkillRow {
  name: string
  when: string
  enforces: string
}

const SKILLS: SkillRow[] = [
  {
    name: 'e2e-rail:init',
    when: 'e2e-rail이 없는 레포',
    enforces: '설치, init, 설정 검토, map --check, unmapped 비율',
  },
  {
    name: 'e2e-rail:select',
    when: '변경에 E2E를 돌리기 전',
    enforces: 'select, impact-analyst 점검, --add와 --reason, 선택 블록',
  },
  {
    name: 'e2e-rail:gate',
    when: '돌리고 보고할 때',
    enforces: 'run 다음 같은 모드의 verify, 고정 보고 형식. 재실행·필터 실행은 전수 통과가 아니다',
  },
  {
    name: 'e2e-rail:measure',
    when: '느리거나 흔들리는 스위트',
    enforces: '느린 spec·재시도, measure workers, 그다음 샤드',
  },
  {
    name: 'e2e-rail:shadow',
    when: '라운드 마감',
    enforces: 'shadow record · status. 승격은 사람에게 제안만 한다',
  },
]

interface LimitItem {
  title: string
  desc: string
  fix: string
}

const LIMITS: LimitItem[] = [
  {
    title: '런타임 문자열 이동과 클릭으로만 가는 흐름',
    desc: "navigate('/x')처럼 문자열로 이동하는 페이지는 import 그래프가 따라가지 못합니다.",
    fix: '셸과 라우터를 tiers.full에 넣는다. impact-analyst가 이 경우를 찾는다',
  },
  {
    title: 'import.meta.glob',
    desc: '{ base }를 쓴 글롭은 간선으로 풀리지 않습니다.',
    fix: '글롭을 쓰는 모듈의 디렉터리를 tiers.full에 넣는다',
  },
  {
    title: 'tsconfig paths에 없는 Vite alias',
    desc: '그 별칭을 거친 import가 보이지 않습니다.',
    fix: '모든 alias를 paths에도 둔다',
  },
  {
    title: '헬퍼로 만든 라우트 배열 · errorElement',
    desc: '어댑터가 라우트 엔트리로 읽지 못하면 unresolved로 남아 앱 전수가 됩니다.',
    fix: 'const 배열 리터럴로 내보내고, errorElement 모듈은 tiers.full에 둔다',
  },
]

interface FixItem {
  version: string
  title: string
  fix: string
}

const FIXES: FixItem[] = [
  {
    version: '0.2.2',
    title: 'env로 켜고 끄는 라우트 목록이 앱 전체를 전수로 만들었다',
    fix: '149개 spec 앱에서 섀도 기록이 전부 trivial이었다. 같은 파일에 선언된 함수의 호출로 만든 const는 모든 return이 라우트 배열일 때 읽는다',
  },
  {
    version: '0.2.1',
    title: '움직이는 ref가 자동 재선택의 base를 바꿨다',
    fix: 'select가 base를 이름이 아니라 커밋 id로 저장한다. 그 사이 커밋이 diff에서 빠지는 일이 없다',
  },
  {
    version: '0.2.1',
    title: '이전 정책으로 기록된 원장 줄이 verify를 통과했다',
    fix: '모든 줄에 policy를 찍고 현재 정책의 줄만 센다. 올리면 전수를 한 번 다시 돌려야 한다',
  },
  {
    version: '0.2.1',
    title: '모드가 다른 샤드가 한 세트로 완성됐다',
    fix: '샤드를 모드별로 묶어 완성 여부를 판정한다',
  },
  {
    version: '0.2.0',
    title: '더러운 트리의 통과가 last-green을 HEAD로 옮겼다',
    fix: '지문에 clean을 추가했다. 깨끗한 트리의 전수 통과만 last-green을 옮긴다',
  },
  {
    version: '0.2.0',
    title: '검사를 느슨하게 하는 옵션이 전수 통과로 검증됐다',
    fix: '-G, --ignore-snapshots, -u, --retries 같은 인자는 모두 filtered로 기록하고 검증하지 않는다',
  },
]

interface InstallBlock {
  id: string
  label: string
  lines: { key: string; text: string; tone: 'muted' | 'cmd' }[]
}

const INSTALL: InstallBlock[] = [
  {
    id: 'cli',
    label: '1 · CLI (모든 런타임과 CI)',
    lines: [
      { key: 'c1', text: 'pnpm add -D github:sh5623/e2e-rail#v0.2.2', tone: 'cmd' },
      { key: 'c2', text: '# npm · yarn이면 npx e2e-rail …', tone: 'muted' },
    ],
  },
  {
    id: 'claude',
    label: '2 · Claude Code',
    lines: [
      { key: 'p1', text: '/plugin marketplace add sh5623/guardrail', tone: 'cmd' },
      { key: 'p2', text: '/plugin install e2e-rail@guardrail', tone: 'cmd' },
      { key: 'p3', text: '/reload-plugins', tone: 'cmd' },
    ],
  },
  {
    id: 'codex',
    label: '2 · Codex',
    lines: [
      {
        key: 'x1',
        text: 'codex plugin marketplace add https://github.com/sh5623/e2e-rail.git',
        tone: 'cmd',
      },
      { key: 'x2', text: 'codex plugin add e2e-rail@e2e-rail-codex', tone: 'cmd' },
      { key: 'x3', text: '# /hooks 에서 SessionStart 훅을 검토해 신뢰', tone: 'muted' },
    ],
  },
]

const SETUP_STEPS: Step[] = [
  { n: '1', title: 'CLI 설치', desc: 'pnpm add -D github:sh5623/e2e-rail#v0.2.2' },
  { n: '2', title: '플러그인 설치', desc: 'Claude Code 또는 Codex' },
  {
    n: '3',
    title: 'init',
    desc: 'e2e-rail.config.mjs를 쓰고 .gitignore를 고치고, 검토할 스크립트 3개를 출력',
  },
  {
    n: '4',
    title: 'map --check',
    desc: 'verdict가 가리키는 것을 고치고 unmapped spec에 리터럴 라우트를 준다',
  },
  {
    n: '5',
    title: '전수 게이트 교체',
    desc: 'run --full로 바꾸고 라운드마다 shadow 스킬로 마감',
  },
]

interface Faq {
  q: string
  a: string
}

const FAQS: Faq[] = [
  {
    q: '선택이 틀리면 어떻게 되나요?',
    a: '처음에는 섀도 모드라 전수가 그대로 돕니다. 선택을 전수 결과와 짝지어 hit과 miss를 세고, 연속 hit이 기준(기본 3)에 닿으면 사람이 승격합니다. 자동 승격은 없고, 승격한 뒤에도 전수는 합본 단계에서 돕니다.',
  },
  {
    q: '무엇이 필요한가요?',
    a: '호스트 레포에 Node 20 이상, @playwright/test 1.56 이상, typescript 5 이상이 필요합니다. 선택·샤드 실행이 --test-list를 쓰기 때문에 Playwright가 더 낮으면 e2e-rail이 거부합니다. typescript는 번들하지 않고 빌려 씁니다.',
  },
  {
    q: 'Claude Code가 없어도 쓸 수 있나요?',
    a: '코어는 의존성 0의 Node CLI라서 스크립트와 CI에서 그대로 부를 수 있습니다. 스킬 층은 Claude Code와 Codex 두 곳에 같은 다섯 개가 있습니다. 세션과 CI가 같은 코어를 돌려야 원장이 서로 비교되므로, 스킬도 레포에 설치된 사본을 부릅니다.',
  },
  {
    q: 'unmapped spec이 많으면요?',
    a: 'goto 리터럴을 읽을 수 없는 spec은 unmapped라서 모든 src 변경마다 돕니다. unmapped 비율이 선택이 아낄 수 있는 상한이고, map --check가 목록을 보여 줍니다. spec에 리터럴 라우트를 주면 줄어듭니다.',
  },
  {
    q: 'fe-rail · self-improvement와 같이 쓸 수 있나요?',
    a: '네. 같은 마켓(sh5623/guardrail)에서 따로 설치합니다.',
  },
]

/* ───────────── small pieces ───────────── */

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

function SectionHead({
  id,
  icon,
  label,
  title,
  desc,
  tone = 'accent',
}: {
  id?: string
  icon: ReactNode
  label: string
  title: string
  desc: ReactNode
  tone?: 'accent' | 'warn' | 'bad'
}) {
  const toneText =
    tone === 'warn' ? 'text-[#fbbf24]' : tone === 'bad' ? 'text-[#fb7185]' : 'text-[#4ade80]'
  return (
    <Reveal>
      <div
        className={`inline-flex items-center gap-2 text-[0.72rem] ${toneText} tracking-[0.3em] uppercase mb-3 font-semibold ${mono}`}
      >
        {icon} {label}
      </div>
      <h2
        id={id}
        className="text-[clamp(1.6rem,3.6vw,2.8rem)] font-extrabold tracking-[-0.02em] leading-[1.2] mb-4 text-slate-50 max-w-[780px]"
      >
        {title}
      </h2>
      <p className="text-[0.95rem] text-slate-400 leading-[1.85] max-w-[660px] mb-12 max-[768px]:mb-8">
        {desc}
      </p>
    </Reveal>
  )
}

function CodeLines({ lines }: { lines: { key: string; text: string; tone: 'muted' | 'cmd' }[] }) {
  return (
    <pre
      className={`bg-[#03060d] border border-white/10 rounded-lg py-5 px-6 text-[0.8rem] leading-[1.9] overflow-x-auto max-[768px]:px-4 max-[768px]:text-[0.74rem] ${mono}`}
    >
      {lines.map((l) => (
        <div key={l.key} className={l.tone === 'cmd' ? 'text-[#4ade80]' : 'text-slate-400'}>
          {l.text}
        </div>
      ))}
    </pre>
  )
}

/* ───────────── page ───────────── */

export default function E2eRailPage() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [scenarioId, setScenarioId] = useState<string>('src')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }

  const sectionClass = 'px-12 py-24 border-t border-white/[0.07] max-[768px]:px-6 max-[768px]:py-16'
  const innerClass = 'max-w-[1180px] mx-auto w-full'

  return (
    <div
      className="min-h-dvh text-slate-50 overflow-x-hidden"
      style={{
        backgroundColor: '#070b14',
        backgroundImage:
          'radial-gradient(ellipse 60% 40% at 80% 0%, rgba(74,222,128,0.08), transparent 70%)',
      }}
    >
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-[#4ade80] focus:text-[#052e16] focus:rounded-md focus:py-2 focus:px-4 text-[0.8rem] font-semibold ${mono}`}
      >
        본문으로 건너뛰기
      </a>

      {/* Nav */}
      <nav
        aria-label="페이지 상단"
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-12 py-3 bg-[rgba(7,11,20,0.88)] backdrop-blur-[12px] border-b border-white/[0.07] max-[768px]:px-4"
      >
        <button
          type="button"
          onClick={() => void navigate('/')}
          className={`inline-flex items-center min-h-11 px-2 text-[0.75rem] text-slate-400 tracking-[0.1em] bg-transparent border-none cursor-pointer transition-colors duration-200 hover:text-[#4ade80] ${focusClass} ${mono}`}
        >
          ← Home
        </button>
        <div
          className={`inline-flex items-center gap-2 text-[0.9rem] font-bold tracking-[0.12em] uppercase text-slate-50 ${mono}`}
        >
          <span className="w-2 h-2 rounded-full bg-[#4ade80]" aria-hidden="true" />
          e2e-rail
        </div>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 min-h-11 px-2 text-[0.75rem] text-slate-400 tracking-[0.1em] no-underline transition-colors duration-200 hover:text-[#4ade80] ${focusClass} ${mono}`}
        >
          <Github className="w-3.5 h-3.5" aria-hidden="true" />
          GitHub
        </a>
      </nav>

      <main id="main">
        {/* Hero */}
        <header className="pt-36 pb-24 px-12 max-[768px]:pt-28 max-[768px]:pb-14 max-[768px]:px-6">
          <div
            className={`${innerClass} grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-14 items-start max-[1000px]:grid-cols-1`}
          >
            <Reveal>
              <span
                className={`inline-flex items-center gap-2 text-[0.72rem] text-[#4ade80] tracking-[0.2em] uppercase font-semibold border border-[#4ade80]/30 bg-[#4ade80]/[0.07] rounded-full py-1.5 px-3.5 mb-7 ${mono}`}
              >
                <TestTubeDiagonal className="w-3.5 h-3.5" aria-hidden="true" />
                Claude Code · Codex Plugin
              </span>
              <h1 className="text-[clamp(2.1rem,5vw,3.7rem)] font-extrabold tracking-[-0.03em] leading-[1.14] mb-6 text-slate-50">
                바뀐 코드가 닿는
                <br />
                테스트만,{' '}
                <span className="text-[#4ade80] [text-shadow:0_0_24px_rgba(74,222,128,0.35)]">
                  근거와 함께
                </span>
              </h1>
              <p className="text-[1rem] text-slate-300 leading-[1.85] max-w-[500px] mb-9">
                Playwright E2E를 변경 기준으로 고르고, 모든 실행을 검증한 코드의 지문에 묶어 남기고,
                측정값으로 나눠 돌립니다. 판정할 수 없을 때는 좁히지 않고 전수로 넓힙니다.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => scrollTo('install')}
                  className={`inline-flex items-center gap-2 min-h-12 text-[0.85rem] font-semibold bg-[#4ade80] text-[#052e16] rounded-md py-3 px-6 border-none cursor-pointer transition-colors duration-200 hover:bg-[#86efac] ${focusClass} ${mono}`}
                >
                  설치 명령 보기 <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 min-h-12 text-[0.85rem] font-semibold text-slate-200 border border-white/20 rounded-md py-3 px-6 no-underline transition-colors duration-200 hover:border-white/40 hover:text-white ${focusClass} ${mono}`}
                >
                  GitHub에서 보기
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <figure className={`${cardClass} overflow-hidden m-0`}>
                <figcaption
                  className={`flex items-center justify-between gap-3 px-5 py-3 border-b border-white/[0.07] text-[0.7rem] text-slate-400 tracking-[0.08em] ${mono}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                    선택 실행마다 붙는 선택 블록
                  </span>
                  <span className="text-[#4ade80]">PARTIAL · exit 0</span>
                </figcaption>
                <div
                  className={`px-5 py-5 text-[0.78rem] leading-[1.95] overflow-x-auto max-[768px]:text-[0.72rem] ${mono}`}
                >
                  {SELECTION_BLOCK.map((l) => (
                    <div key={l.key} className={`whitespace-pre ${toneClass[l.tone]}`}>
                      {l.text}
                    </div>
                  ))}
                </div>
              </figure>
            </Reveal>
          </div>

          <Reveal delay={0.15} className={`${innerClass} mt-14`}>
            <dl className="grid grid-cols-4 gap-4 m-0 max-[768px]:grid-cols-2">
              {STATS.map((s) => (
                <div key={s.label} className="border-l-2 border-[#4ade80]/40 pl-4">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="m-0">
                    <div className={`text-[1.6rem] font-bold text-slate-50 ${mono}`}>{s.value}</div>
                    <div className="text-[0.78rem] text-slate-400 leading-[1.6]">{s.label}</div>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </header>

        {/* 세 동사 */}
        <section className={sectionClass} aria-labelledby="verbs-title">
          <div className={innerClass}>
            <SectionHead
              id="verbs-title"
              icon={<Radar className="w-3.5 h-3.5" aria-hidden="true" />}
              label="Three verbs"
              title="고른다 · 남긴다 · 나눈다"
              desc="스킬 층이 하는 일은 에이전트의 보고를 바로잡는 것입니다. 선택 실행이나 재실행, 필터 실행을 전수 통과라고 말하지 못하게 하고, 선택 실행마다 근거를 적은 선택 블록을 붙이고, 통과했다고 말하기 전에 verify를 돌리게 합니다."
            />
            <ol className="grid grid-cols-3 gap-5 list-none p-0 m-0 max-[900px]:grid-cols-1">
              {VERBS.map((v, i) => (
                <li key={v.id}>
                  <Reveal delay={i * 0.06} className={`${cardClass} p-6 h-full`}>
                    <div className="flex items-center gap-3 mb-4 text-[#4ade80]">
                      {v.icon}
                      <span className={`text-[0.72rem] tracking-[0.2em] ${mono}`}>0{i + 1}</span>
                    </div>
                    <h3 className="text-[1.4rem] font-extrabold text-slate-50 mb-2">{v.verb}</h3>
                    <p className="text-[0.92rem] text-slate-200 leading-[1.7] mb-2">{v.line}</p>
                    <p className="text-[0.84rem] text-slate-400 leading-[1.75]">{v.detail}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 선택 */}
        <section className={sectionClass} aria-labelledby="select-title">
          <div className={innerClass}>
            <SectionHead
              id="select-title"
              icon={<Target className="w-3.5 h-3.5" aria-hidden="true" />}
              label="Select"
              title='모름은 "변경 없음"이 아니다. 넓힌다.'
              desc="변경 파일은 규칙표에서 처음 맞는 행으로 분류됩니다. 판단이 서지 않으면 앱 전수가 기본값입니다. 아래에서 파일을 하나 골라 보세요."
            />
            <Reveal className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 max-[900px]:grid-cols-1">
              <div className={`${cardClass} p-5`}>
                <div
                  id="sim-label"
                  className={`text-[0.7rem] text-slate-400 tracking-[0.12em] uppercase mb-3 ${mono}`}
                >
                  변경된 파일
                </div>
                <div role="radiogroup" aria-labelledby="sim-label" className="flex flex-col gap-2">
                  {SCENARIOS.map((s) => {
                    const active = s.id === scenarioId
                    return (
                      // biome-ignore lint/a11y/useSemanticElements: styled radio button list, roles + aria-checked supplied
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setScenarioId(s.id)}
                        className={`flex items-center justify-between gap-3 min-h-11 text-left rounded-md border py-2.5 px-3.5 cursor-pointer transition-colors duration-200 ${focusClass} ${mono} text-[0.76rem] ${
                          active
                            ? 'border-[#4ade80]/50 bg-[#4ade80]/[0.08] text-slate-50'
                            : 'border-white/10 bg-transparent text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <span className="break-all">{s.file}</span>
                        {active && (
                          <Check className="w-4 h-4 text-[#4ade80] shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className={`${cardClass} p-6`} aria-live="polite">
                {scenario && (
                  <>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <span
                        className={`text-[0.72rem] tracking-[0.2em] font-bold ${OUTCOME_META[scenario.outcome].color} ${mono}`}
                      >
                        {OUTCOME_META[scenario.outcome].label}
                      </span>
                      <span className={`text-[0.72rem] text-slate-400 ${mono}`}>
                        {OUTCOME_META[scenario.outcome].exit}
                      </span>
                    </div>
                    <dl className="m-0 grid gap-4">
                      <div>
                        <dt className="text-[0.7rem] text-slate-400 tracking-[0.1em] uppercase mb-1">
                          돌아가는 것
                        </dt>
                        <dd className="m-0 text-[1.05rem] font-semibold text-slate-50">
                          {scenario.result}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[0.7rem] text-slate-400 tracking-[0.1em] uppercase mb-1">
                          근거 (reason)
                        </dt>
                        <dd className={`m-0 text-[0.84rem] text-[#4ade80] break-all ${mono}`}>
                          {scenario.reason}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[0.7rem] text-slate-400 tracking-[0.1em] uppercase mb-1">
                          왜
                        </dt>
                        <dd className="m-0 text-[0.86rem] text-slate-300 leading-[1.8]">
                          {scenario.why}
                        </dd>
                      </div>
                    </dl>
                  </>
                )}
              </div>
            </Reveal>

            <Reveal className={`${cardClass} mt-6 overflow-x-auto`}>
              <table className="w-full min-w-[560px] border-collapse text-left">
                <caption className="sr-only">변경 파일 분류 규칙표</caption>
                <thead>
                  <tr
                    className={`text-[0.7rem] text-slate-400 uppercase tracking-[0.08em] ${mono}`}
                  >
                    <th scope="col" className="py-3 px-5 font-medium w-12">
                      #
                    </th>
                    <th scope="col" className="py-3 px-5 font-medium">
                      변경 파일
                    </th>
                    <th scope="col" className="py-3 px-5 font-medium">
                      결과
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RULES.map((r) => (
                    <tr key={r.n} className="border-t border-white/[0.07]">
                      <td className={`py-3.5 px-5 text-[0.8rem] text-[#4ade80] ${mono}`}>{r.n}</td>
                      <td className="py-3.5 px-5 text-[0.84rem] text-slate-200 leading-[1.6]">
                        {r.match.replaceAll('`', '')}
                      </td>
                      <td
                        className={`py-3.5 px-5 text-[0.78rem] text-slate-300 leading-[1.6] ${mono}`}
                      >
                        {r.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
            <Reveal>
              <p className="text-[0.82rem] text-slate-400 mt-5 leading-[1.8] max-w-[720px]">
                기준 커밋이 없거나 git이 diff를 내지 못하면 모든 앱 전수(
                <code className={mono}>no-base</code>)입니다. 종료 코드 0은 모든 앱이 partial, 10은
                어느 앱이 전수라는 뜻입니다.
              </p>
            </Reveal>
          </div>
        </section>

        {/* 원장 · verify */}
        <section className={sectionClass} aria-labelledby="ledger-title">
          <div className={innerClass}>
            <SectionHead
              id="ledger-title"
              icon={<Fingerprint className="w-3.5 h-3.5" aria-hidden="true" />}
              label="Ledger · Verify"
              title='"아까 통과했다"는 확인하는 것이지 가정하는 것이 아니다'
              desc="실행마다 코드의 지문과 결과를 .e2e-rail/ledger.jsonl에 한 줄씩 덧붙입니다. verify는 그 원장으로 정확히 이 코드가 통과했는지 답합니다."
            />
            <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 max-[900px]:grid-cols-1">
              <Reveal className={`${cardClass} p-6`}>
                <h3
                  className={`text-[0.72rem] text-slate-400 tracking-[0.15em] uppercase mb-4 ${mono}`}
                >
                  지문 (fingerprint)
                </h3>
                <ul className="list-none p-0 m-0 grid gap-3">
                  {FINGERPRINT.map((f) => (
                    <li key={f.name} className="flex items-baseline gap-3">
                      <code className={`text-[0.8rem] text-[#4ade80] w-[84px] shrink-0 ${mono}`}>
                        {f.name}
                      </code>
                      <span className="text-[0.84rem] text-slate-300">{f.note}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.06} className="grid grid-cols-1 gap-4">
                {VERIFY_EXITS.map((v) => (
                  <div
                    key={v.code}
                    className={`${cardClass} ${v.border} p-5 grid grid-cols-[auto_1fr] gap-x-5 items-center`}
                  >
                    <div className={`text-[1.7rem] font-bold ${v.color} ${mono}`}>{v.code}</div>
                    <div>
                      <div className={`text-[0.84rem] font-semibold ${v.color} ${mono}`}>
                        {v.word}
                      </div>
                      <p className="text-[0.82rem] text-slate-300 leading-[1.7] mt-1">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </Reveal>
            </div>
            <Reveal className={`${cardClass} mt-6 p-6`}>
              <h3 className="flex items-center gap-2 text-[0.95rem] font-bold text-slate-50 mb-4">
                <Ban className="w-4 h-4 text-[#fb7185]" aria-hidden="true" />
                검증으로 세지 않는 실행
              </h3>
              <ul className="list-none p-0 m-0 grid gap-2.5">
                {NOT_VERIFICATION.map((t) => (
                  <li
                    key={t}
                    className="text-[0.86rem] text-slate-300 leading-[1.75] pl-4 relative"
                  >
                    <span
                      className="absolute left-0 top-[0.75em] w-1.5 h-px bg-[#fb7185]"
                      aria-hidden="true"
                    />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* 섀도 */}
        <section className={sectionClass} aria-labelledby="shadow-title">
          <div className={innerClass}>
            <SectionHead
              id="shadow-title"
              icon={<ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />}
              label="Shadow mode"
              tone="warn"
              title="선택기는 전수를 대신하기 전에 신뢰를 얻는다"
              desc="전수가 어차피 도는 동안 선택을 옆에 두고 결과를 비교합니다. 그래서 섀도 기간의 비용은 0입니다."
            />
            <ol className="grid grid-cols-4 gap-4 list-none p-0 m-0 mb-8 max-[1000px]:grid-cols-2 max-[560px]:grid-cols-1">
              {SHADOW_STEPS.map((s, i) => (
                <li key={s.n}>
                  <Reveal delay={i * 0.05} className={`${cardClass} p-5 h-full`}>
                    <div className={`text-[0.72rem] text-[#fbbf24] mb-2 ${mono}`}>
                      {s.n}/{SHADOW_STEPS.length}
                    </div>
                    <h3 className="text-[0.92rem] font-bold text-slate-50 mb-2 leading-[1.5]">
                      {s.title}
                    </h3>
                    <p className="text-[0.8rem] text-slate-400 leading-[1.7]">{s.desc}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
            <Reveal>
              <h3
                className={`text-[0.72rem] text-slate-400 tracking-[0.15em] uppercase mb-4 ${mono}`}
              >
                shadow record가 남기는 판정
              </h3>
            </Reveal>
            <ul className="grid grid-cols-4 gap-4 list-none p-0 m-0 max-[1000px]:grid-cols-2 max-[560px]:grid-cols-1">
              {SHADOW_OUTCOMES.map((o, i) => (
                <li key={o.id}>
                  <Reveal delay={i * 0.05} className={`${cardClass} p-5 h-full`}>
                    <div className={`text-[1.05rem] font-bold ${o.color} ${mono}`}>{o.label}</div>
                    <div className={`text-[0.74rem] text-slate-300 mb-3 ${mono}`}>{o.effect}</div>
                    <p className="text-[0.8rem] text-slate-400 leading-[1.7]">{o.desc}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
            <Reveal>
              <p className="text-[0.84rem] text-slate-300 leading-[1.85] mt-8 max-w-[720px] border-l-2 border-[#fbbf24]/50 pl-5">
                streak는 선택이 잡아낸 것만 셉니다. 선택이 진짜 고장을 잡는지는 씨앗 실패 훈련으로
                봅니다. 임시 브랜치에서 최근 변경이 건드리는 코드를 일부러 망가뜨리고, 그 spec이
                선택에 들어 있고 선택 실행이 실패하는지 확인합니다. 훈련의 전수 실행은 shadow
                record로 기록하지 않습니다.
              </p>
            </Reveal>
          </div>
        </section>

        {/* 락 · 워커 · 분산 */}
        <section className={sectionClass} aria-labelledby="shard-title">
          <div className={innerClass}>
            <SectionHead
              id="shard-title"
              icon={<LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />}
              label="Lock · Workers · Shard"
              title="워커 수는 e2e-rail이 정하지 않는다. 재서 정한다"
              desc="머신 하나에 무거운 실행은 하나입니다. 몇 개를 동시에 돌릴지, 몇 조각으로 나눌지는 같은 목록을 돌려 본 측정값이 정합니다."
            />
            <div className="grid grid-cols-3 gap-5 max-[1000px]:grid-cols-1">
              {SHARD_CARDS.map((c, i) => (
                <Reveal key={c.title} delay={i * 0.06} className={`${cardClass} p-6`}>
                  <h3 className="text-[1.1rem] font-bold text-slate-50 mb-3">{c.title}</h3>
                  <code
                    className={`block text-[0.72rem] text-[#4ade80] bg-[#03060d] border border-white/10 rounded-md py-2 px-3 mb-4 overflow-x-auto whitespace-nowrap ${mono}`}
                  >
                    {c.command}
                  </code>
                  <p className="text-[0.84rem] text-slate-400 leading-[1.8]">{c.desc}</p>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <p className="text-[0.82rem] text-slate-400 mt-6 leading-[1.8] max-w-[720px]">
                CI 템플릿은 <code className={mono}>templates/ci/</code>에 있고 복사해서 씁니다:
                GitHub Actions 샤드 matrix, CodeBuild batch, 섀도 기간 게이트용 buildspec 스니펫.
                e2e-rail이 대신 설치하지는 않습니다.
              </p>
            </Reveal>
          </div>
        </section>

        {/* 플러그인 층 */}
        <section className={sectionClass} aria-labelledby="plugin-title">
          <div className={innerClass}>
            <SectionHead
              id="plugin-title"
              icon={<Bot className="w-3.5 h-3.5" aria-hidden="true" />}
              label="Plugin layer"
              title="CLI를 정직하게 쓰도록 강제하는 스킬 다섯 개"
              desc={
                <>
                  에이전트가 선택을 전수 통과로 보고하는 일을 막는 층입니다. 읽기 전용 에이전트{' '}
                  <code className={`text-[#4ade80] ${mono}`}>e2e-impact-analyst</code>는 그래프가 못
                  보는 문자열 이동, 모달 오프너, 런타임 라우트, URL 상태, 모바일 분기를 점검하고
                  근거와 함께 --add 후보만 돌려줍니다. 삭제는 제안하지 않습니다.
                </>
              }
            />
            <Reveal className={`${cardClass} overflow-x-auto`}>
              <table className="w-full min-w-[620px] border-collapse text-left">
                <caption className="sr-only">e2e-rail 스킬 다섯 개</caption>
                <thead>
                  <tr
                    className={`text-[0.7rem] text-slate-400 uppercase tracking-[0.08em] ${mono}`}
                  >
                    <th scope="col" className="py-3 px-5 font-medium">
                      스킬
                    </th>
                    <th scope="col" className="py-3 px-5 font-medium">
                      언제
                    </th>
                    <th scope="col" className="py-3 px-5 font-medium">
                      무엇을 강제하나
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SKILLS.map((s) => (
                    <tr key={s.name} className="border-t border-white/[0.07] align-top">
                      <th
                        scope="row"
                        className={`py-4 px-5 text-[0.8rem] text-[#4ade80] font-medium whitespace-nowrap ${mono}`}
                      >
                        {s.name}
                      </th>
                      <td className="py-4 px-5 text-[0.84rem] text-slate-200">{s.when}</td>
                      <td className="py-4 px-5 text-[0.84rem] text-slate-400 leading-[1.7]">
                        {s.enforces}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
            <Reveal>
              <p className="text-[0.82rem] text-slate-400 mt-5 leading-[1.8] max-w-[720px]">
                SessionStart 훅이 여섯 규칙을 담은 doctrine을 모든 세션에 둡니다. Codex에는
                에이전트가 없어서 select 스킬이 같은 점검 목록을 직접 읽고 수행합니다.
              </p>
            </Reveal>
          </div>
        </section>

        {/* 한계 */}
        <section className={sectionClass} aria-labelledby="limits-title">
          <div className={innerClass}>
            <SectionHead
              id="limits-title"
              icon={<Ban className="w-3.5 h-3.5" aria-hidden="true" />}
              label="Limits"
              tone="bad"
              title="정적 분석이 잘못 좁힐 수 있는 곳"
              desc="아래 경우에는 선택이 여전히 틀릴 수 있습니다. 각각 완화책이 있고, 누군가 선택을 믿기 전에 섀도 모드가 새어 나간 것을 셉니다."
            />
            <ul className="grid grid-cols-2 gap-5 list-none p-0 m-0 max-[800px]:grid-cols-1">
              {LIMITS.map((l, i) => (
                <li key={l.title}>
                  <Reveal delay={i * 0.05} className={`${cardClass} p-6 h-full`}>
                    <h3 className="text-[0.95rem] font-bold text-slate-50 mb-2 leading-[1.5]">
                      {l.title}
                    </h3>
                    <p className="text-[0.84rem] text-slate-400 leading-[1.75] mb-4">{l.desc}</p>
                    <p className="text-[0.82rem] text-slate-200 leading-[1.7] border-t border-white/[0.07] pt-3">
                      <span className={`text-[#4ade80] mr-2 ${mono}`}>완화</span>
                      {l.fix}
                    </p>
                  </Reveal>
                </li>
              ))}
            </ul>
            <Reveal>
              <p className="text-[0.82rem] text-slate-400 mt-6 leading-[1.8] max-w-[720px]">
                잘못 좁히지는 않지만 늘 앱 전수로 도는 모양도 있습니다. 다른 라우트 파일에서 펼친{' '}
                <code className={mono}>export default [...]</code> 라우트 표, 로컬{' '}
                <code className={mono}>lazy()</code> 상수가 페이지인 리프, srcDir 아래의 코드 아닌
                파일입니다. map --check가 어느 쪽인지 알려 줍니다.
              </p>
            </Reveal>
          </div>
        </section>

        {/* 변경 이력 */}
        <section className={sectionClass} aria-labelledby="changelog-title">
          <div className={innerClass}>
            <SectionHead
              id="changelog-title"
              icon={<Wrench className="w-3.5 h-3.5" aria-hidden="true" />}
              label="Changelog · v0.2.x"
              title="재현된 결함만 고쳤다"
              desc="v0.2.0과 v0.2.1은 외부 감사가 낸 결함이고, 모두 실제 Playwright 1.63으로 재현한 뒤에 고쳤습니다. v0.2.2는 149개 spec 앱에 도입하다 나온 결함입니다. 세 버전이 지키려는 것은 하나입니다. 실행을 실제보다 큰 검증으로 내놓지 않고, 추측으로 좁히지 않는다는 것."
            />
            <Reveal className={`${cardClass} divide-y divide-white/[0.07]`}>
              <ul className="list-none p-0 m-0">
                {FIXES.map((f) => (
                  <li
                    key={f.title}
                    className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 p-6 items-start max-[700px]:grid-cols-1 border-t border-white/[0.07] first:border-t-0"
                  >
                    <span
                      className={`text-[0.7rem] font-bold text-[#4ade80] border border-[#4ade80]/30 bg-[#4ade80]/[0.07] rounded-full py-1 px-2.5 w-fit ${mono}`}
                    >
                      v{f.version}
                    </span>
                    <div>
                      <p className="text-[0.9rem] text-slate-50 font-semibold leading-[1.65] mb-1.5">
                        {f.title}
                      </p>
                      <p className="text-[0.84rem] text-slate-400 leading-[1.8]">{f.fix}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* 설치 */}
        <section id="install" className={sectionClass} aria-labelledby="install-title">
          <div className={innerClass}>
            <SectionHead
              id="install-title"
              icon={<Terminal className="w-3.5 h-3.5" aria-hidden="true" />}
              label="Install"
              title="레포 하나에 약 30분"
              desc="스킬과 CI는 항상 레포에 설치된 CLI 사본을 부릅니다. 세션과 CI가 같은 코어를 돌려야 원장이 서로 비교되기 때문입니다."
            />
            <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-8 max-[1000px]:grid-cols-1">
              <div className="grid grid-cols-1 gap-5">
                {INSTALL.map((b, i) => (
                  <Reveal key={b.id} delay={i * 0.05}>
                    <div className={`text-[0.72rem] text-slate-400 tracking-[0.1em] mb-2 ${mono}`}>
                      {b.label}
                    </div>
                    <CodeLines lines={b.lines} />
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.1}>
                <ol className="list-none p-0 m-0 grid gap-4">
                  {SETUP_STEPS.map((s) => (
                    <li key={s.n} className="grid grid-cols-[auto_1fr] gap-4 items-start">
                      <span
                        className={`w-7 h-7 rounded-full border border-[#4ade80]/40 text-[#4ade80] text-[0.75rem] flex items-center justify-center shrink-0 ${mono}`}
                      >
                        {s.n}
                      </span>
                      <div>
                        <div className="text-[0.9rem] font-semibold text-slate-50">{s.title}</div>
                        <div className="text-[0.82rem] text-slate-400 leading-[1.7]">{s.desc}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={sectionClass} aria-labelledby="faq-title">
          <div className={innerClass}>
            <Reveal>
              <div
                className={`inline-flex items-center gap-2 text-[0.72rem] text-[#4ade80] tracking-[0.3em] uppercase mb-3 font-semibold ${mono}`}
              >
                FAQ
              </div>
              <h2
                id="faq-title"
                className="text-[clamp(1.6rem,3.6vw,2.8rem)] font-extrabold tracking-[-0.02em] leading-[1.2] mb-10 text-slate-50"
              >
                자주 묻는 질문
              </h2>
            </Reveal>
            <Reveal className="max-w-[780px]">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i
                const panelId = `faq-panel-${i}`
                return (
                  <div key={faq.q} className="border-b border-white/[0.07] last:border-b-0">
                    <h3 className="m-0">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className={`w-full flex items-center justify-between gap-4 min-h-14 py-4 text-left bg-transparent border-none cursor-pointer ${focusClass}`}
                      >
                        <span className="text-[0.95rem] font-semibold text-slate-100">{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </h3>
                    {isOpen && (
                      <p
                        id={panelId}
                        className="text-[0.88rem] text-slate-300 leading-[1.9] pb-5 max-w-[660px]"
                      >
                        {faq.a}
                      </p>
                    )}
                  </div>
                )
              })}
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-12 py-10 border-t border-white/[0.07] flex items-center justify-between flex-wrap gap-4 max-[768px]:px-6">
        <div className={`text-[0.75rem] text-slate-400 tracking-[0.05em] ${mono}`}>
          e2e-rail · Claude Code · Codex Plugin · v0.2.2 · MIT © 2026 Seungho
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void navigate('/')}
            className={`min-h-11 px-3 text-[0.75rem] text-slate-400 bg-transparent border-none cursor-pointer transition-colors duration-200 hover:text-[#4ade80] ${focusClass} ${mono}`}
          >
            ← Home
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center min-h-11 px-3 text-[0.75rem] text-slate-400 no-underline transition-colors duration-200 hover:text-[#4ade80] ${focusClass} ${mono}`}
          >
            GitHub →
          </a>
        </div>
      </footer>
    </div>
  )
}
