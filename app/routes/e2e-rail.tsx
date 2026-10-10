import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Ban,
  Bot,
  Check,
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
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import type { LinksFunction } from 'react-router'
import { useNavigate } from 'react-router'
import { Collapse, CountUp, EASE_OUT, PageMotion, TypeLines, useCycle } from '@/components/Motion'
import type { Route } from './+types/e2e-rail'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
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
/* ───────────── 「테스트 리포트 원장」 토큰 ─────────────
 * 이 페이지의 색은 아래 PALETTE 가 전부다. 루트 요소에 CSS 변수로 한 번 깔고(PALETTE_VARS),
 * 클래스는 `text-(--ink)`·`border-(--hairline)` 처럼 변수만 가리킨다. 상태색 4개(pass·fail·warn·skip)만
 * 유채색이고, 언제나 글리프나 글과 함께 나온다(색만으로 말하지 않는다).
 */
const PALETTE = {
  bg: '#F4F6F9',
  surface: '#FFFFFF',
  subtle: '#EEF1F5',
  zebra: '#F8F9FB',
  ink: '#0B0F14',
  muted: '#4B5563',
  faint: '#6B7280',
  hairline: '#D7DCE3',
  pass: '#15803D',
  passTint: '#E8F5EC',
  fail: '#B91C1C',
  failTint: '#FBEAEA',
  warn: '#B45309',
  warnTint: '#FDF3E6',
  skip: '#6B7280',
  skipTint: '#EEF1F5',
} as const

const PALETTE_VARS: CSSProperties & Record<`--${string}`, string> = {
  '--bg': PALETTE.bg,
  '--surface': PALETTE.surface,
  '--subtle': PALETTE.subtle,
  '--zebra': PALETTE.zebra,
  '--ink': PALETTE.ink,
  '--muted': PALETTE.muted,
  '--faint': PALETTE.faint,
  '--hairline': PALETTE.hairline,
  '--pass': PALETTE.pass,
  '--pass-tint': PALETTE.passTint,
  '--fail': PALETTE.fail,
  '--fail-tint': PALETTE.failTint,
  '--warn': PALETTE.warn,
  '--warn-tint': PALETTE.warnTint,
  '--skip': PALETTE.skip,
  '--skip-tint': PALETTE.skipTint,
}

/** streak 칸이 비었을 때 — pass 와 같은 색의 투명값(framer 가 색 사이를 보간한다) */
const PASS_CLEAR = 'rgba(21, 128, 61, 0)'

type Status = 'pass' | 'fail' | 'warn' | 'skip' | 'ink'

const STATUS: Record<
  Status,
  { text: string; border: string; tint: string; solid: string; glyph: string }
> = {
  pass: {
    text: 'text-(--pass)',
    border: 'border-(--pass)',
    tint: 'bg-(--pass-tint)',
    solid: 'bg-(--pass) text-(--surface)',
    glyph: '✓',
  },
  fail: {
    text: 'text-(--fail)',
    border: 'border-(--fail)',
    tint: 'bg-(--fail-tint)',
    solid: 'bg-(--fail) text-(--surface)',
    glyph: '✕',
  },
  warn: {
    text: 'text-(--warn)',
    border: 'border-(--warn)',
    tint: 'bg-(--warn-tint)',
    solid: 'bg-(--warn) text-(--surface)',
    glyph: '!',
  },
  skip: {
    text: 'text-(--skip)',
    border: 'border-(--skip)',
    tint: 'bg-(--skip-tint)',
    solid: 'bg-(--skip) text-(--surface)',
    glyph: '○',
  },
  ink: {
    text: 'text-(--ink)',
    border: 'border-(--ink)',
    tint: 'bg-(--subtle)',
    solid: 'bg-(--ink) text-(--surface)',
    glyph: '■',
  },
}

const sans =
  "[font-family:'IBM_Plex_Sans_KR',ui-sans-serif,system-ui,'Apple_SD_Gothic_Neo',sans-serif]"
const mono =
  "[font-family:'JetBrains_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] tabular-nums"

const panelClass =
  'bg-(--surface) border border-(--hairline) rounded-[4px] shadow-[0_1px_2px_rgba(11,15,20,0.06)]'
const focusClass =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ink)'
const codeInlineClass = `${mono} text-[0.88em] text-(--ink) bg-(--subtle) border border-(--hairline) rounded-[3px] px-1 py-px`
const btnPrimaryClass =
  'inline-flex items-center gap-2 min-h-12 py-3 px-6 text-[0.875rem] font-semibold bg-(--ink) text-(--surface) rounded-[4px] border-b-2 border-(--ink) cursor-pointer transition-[transform,border-color] duration-200 hover:-translate-y-px hover:border-(--pass)'
const btnSecondaryClass =
  'inline-flex items-center gap-2 min-h-12 py-3 px-6 text-[0.875rem] font-semibold text-(--ink) bg-(--surface) border border-(--ink) rounded-[4px] no-underline transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-(--subtle)'

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
  muted: 'text-(--muted)',
  base: 'text-(--ink)',
  accent: 'text-(--ink) font-semibold',
  warn: 'text-(--warn)',
}

interface TermLine {
  key: string
  text: string
  /** 있으면 한 번에 나타나는 줄의 색. 없으면 한 글자씩 타이핑하는 줄이다 */
  className?: string
}

/** 히어로 터미널 — `$` 명령 줄을 타이핑한 뒤 선택 블록 출력이 한 줄씩 나타난다 */
const HERO_LINES: TermLine[] = SELECTION_BLOCK.map((l) =>
  l.key === 'cmd'
    ? { key: l.key, text: l.text }
    : { key: l.key, text: l.text, className: toneClass[l.tone] }
)

/** 히어로 리포트 — 타이핑하는 줄은 `$` 명령 줄뿐이다(className 없는 줄) */
const HERO_TYPED: TermLine[] = HERO_LINES.filter((l) => l.className === undefined)
const HERO_CHAR_MS = 26
/** 명령 줄을 다 치는 데 걸리는 시간 — 글자 수 × 글자 간격 + TypeLines 의 줄 간격 기본값(170ms) */
const CMD_TYPE_MS = HERO_TYPED.reduce((ms, l) => ms + l.text.length * HERO_CHAR_MS + 170, 0)
/** 명령 줄 다음 리포트 행이 하나씩 들어오는 간격 */
const ROW_STEP_MS = 100

interface ReportRow {
  id: string
  /** 칩에 들어가는 그 줄의 키(change · selected …). 들여 쓴 근거 줄은 null */
  chip: string | null
  value: string
  status: Status
  glyph: string
  valueClass: string
  /** 마지막 final 줄 — 굵은 잉크 선 아래의 마감 행 */
  closing: boolean
}

const TONE_STATUS: Record<BlockLine['tone'], Status> = {
  muted: 'skip',
  base: 'skip',
  accent: 'pass',
  warn: 'warn',
}
const ROW_GLYPH: Partial<Record<string, string>> = { change: '±', final: '→' }

/**
 * 히어로 리포트의 행 — SELECTION_BLOCK 의 출력 줄을 「키 칩 + 값」으로 나눠 보여 준다(글은 그대로).
 * selected 줄은 spec 마다 한 행(PASS 행)으로, 들여 쓴 줄은 그 아래 근거 행으로 둔다.
 */
const REPORT_ROWS: ReportRow[] = SELECTION_BLOCK.flatMap((l): ReportRow[] => {
  if (l.key === 'cmd') return []
  const valueClass = toneClass[l.tone]
  if (l.text.startsWith(' ')) {
    return [
      {
        id: l.key,
        chip: null,
        value: l.text.trim(),
        status: 'skip',
        glyph: '↳',
        valueClass,
        closing: false,
      },
    ]
  }
  const colon = l.text.indexOf(':')
  const chip = colon > 0 ? l.text.slice(0, colon) : null
  const value = colon > 0 ? l.text.slice(colon + 1).trim() : l.text
  const closing = l.key === 'final'
  const status: Status = closing ? 'ink' : TONE_STATUS[l.tone]
  const glyph = ROW_GLYPH[l.key] ?? STATUS[status].glyph
  const values = l.key === 'selected' ? value.split(' · ') : [value]
  return values.map((v) => ({
    id: `${l.key}:${v}`,
    chip,
    value: v,
    status,
    glyph,
    valueClass,
    closing,
  }))
})
const REPORT_TOTAL = REPORT_ROWS.length

const ROW_SURFACE: Record<Status | 'closing', string> = {
  pass: 'bg-(--pass-tint)',
  warn: 'bg-(--warn-tint)',
  fail: 'bg-(--fail-tint)',
  skip: 'bg-(--surface)',
  ink: 'bg-(--surface)',
  closing: 'bg-(--subtle)',
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

const OUTCOME_META: Record<Scenario['outcome'], { label: string; exit: string; status: Status }> = {
  partial: { label: 'PARTIAL', exit: '종료 0', status: 'pass' },
  full: { label: 'FULL', exit: '종료 10', status: 'warn' },
  ignore: { label: 'IGNORED', exit: '종료 0', status: 'skip' },
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
  status: Status
}

const VERIFY_EXITS: VerifyExit[] = [
  {
    code: '0',
    word: 'verified',
    desc: '이 앱 · 이 모드 · 이 지문 · 통과 · 필터 없음인 실행이 원장에 있다',
    status: 'pass',
  },
  {
    code: '20',
    word: 'stale',
    desc: '그 뒤로 코드가 바뀌었거나, 이전 검증 정책으로 기록된 줄뿐이다',
    status: 'warn',
  },
  {
    code: '21',
    word: 'insufficient',
    desc: '요구한 수준(full 또는 selected)에 못 미치는 실행뿐이다',
    status: 'fail',
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
  status: Status
}

const SHADOW_OUTCOMES: ShadowOutcome[] = [
  {
    id: 'hit',
    label: 'hit',
    effect: 'streak +1',
    desc: '실패한 spec이 모두 선택 안에 있었다. 통과한 실행도 hit이다',
    status: 'pass',
  },
  {
    id: 'miss',
    label: 'miss',
    effect: 'streak → 0',
    desc: '선택이 놓친 spec을 적고 처음부터 다시 센다',
    status: 'fail',
  },
  {
    id: 'trivial',
    label: 'trivial',
    effect: 'streak 유지',
    desc: '선택이 이미 전수였다. 증거가 되지 않는다',
    status: 'warn',
  },
  {
    id: 'unpaired',
    label: 'unpaired',
    effect: 'streak 유지',
    desc: '이 코드에 대해 계산된 선택이 없다',
    status: 'skip',
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

/** promoteAfter 기본값(3)만큼의 streak 칸 */
const STREAK_SLOTS = [1, 2, 3] as const

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
  pop = false,
}: {
  children: ReactNode
  className?: string
  delay?: number
  /** true 면 살짝 작은 크기에서 튀어나오듯 들어온다 (행 하나하나를 강조할 때) */
  pop?: boolean
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : pop ? { opacity: 0, y: 10, scale: 0.96 } : { opacity: 0, y: 14 }}
      whileInView={pop ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  )
}

/** 상태 칩 — 색만으로 말하지 않도록 글리프와 글을 함께 둔다. 글은 데이터 그대로(대소문자 변환 없음). */
function StatusChip({
  status,
  children,
  solid = false,
  glyph = true,
}: {
  status: Status
  children: ReactNode
  /** true 면 상태색 바탕에 흰 글자(리포트 헤더 요약용) */
  solid?: boolean
  /** false 면 글리프를 뺀다(행 앞에 글리프 칸이 따로 있을 때) */
  glyph?: boolean
}) {
  const s = STATUS[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 min-h-6 px-2 rounded-[3px] border text-[0.7rem] font-semibold tracking-[0.04em] leading-none whitespace-nowrap ${mono} ${
        solid ? `${s.solid} border-transparent` : `bg-(--surface) ${s.border} ${s.text}`
      }`}
    >
      {glyph && <span aria-hidden="true">{s.glyph}</span>}
      {children}
    </span>
  )
}

function SectionHead({
  id,
  index,
  icon,
  label,
  title,
  desc,
  tone = 'accent',
}: {
  id?: string
  /** 리포트 절 번호(장식) */
  index: string
  icon?: ReactNode
  label: string
  title: string
  desc?: ReactNode
  tone?: 'accent' | 'warn' | 'bad'
}) {
  const toneText =
    tone === 'warn' ? 'text-(--warn)' : tone === 'bad' ? 'text-(--fail)' : 'text-(--ink)'
  return (
    <Reveal className={desc === undefined ? 'mb-10' : 'mb-12 max-[768px]:mb-8'}>
      <div className="flex items-center justify-between gap-4 border-t-2 border-(--ink) pt-3 mb-8 max-[768px]:mb-6">
        <div
          className={`inline-flex flex-wrap items-center gap-x-2 text-[0.75rem] tracking-[0.18em] uppercase font-semibold ${toneText} ${mono}`}
        >
          <span aria-hidden="true" className="text-(--ink)">
            § {index}
          </span>
          <span aria-hidden="true" className="text-(--muted)">
            ·
          </span>
          <span>{label}</span>
        </div>
        {icon && <span className={`shrink-0 ${toneText}`}>{icon}</span>}
      </div>
      <h2
        id={id}
        className="text-[clamp(1.6rem,3.4vw,2.6rem)] font-bold tracking-[-0.025em] leading-[1.22] text-(--ink) max-w-[820px] mb-4"
      >
        {title}
      </h2>
      {desc !== undefined && (
        <p className="text-[1rem] text-(--muted) leading-[1.75] max-w-[680px]">{desc}</p>
      )}
    </Reveal>
  )
}

/** 터미널 줄을 타이핑으로 보여 준다(스크린리더 사본은 TypeLines 가 함께 렌더한다). 전부 span 이라 `<pre>` 안에 넣을 수 있다. */
function TypedBlock({
  lines,
  typedClassName,
  charMs,
}: {
  lines: TermLine[]
  /** 타이핑하는 줄(className 없는 줄)의 색 */
  typedClassName: string
  charMs?: number
}) {
  const shown: ReactNode[] = lines.map((l) =>
    l.className === undefined ? (
      l.text
    ) : (
      <span key={l.key} className={l.className}>
        {l.text}
      </span>
    )
  )
  return (
    <TypeLines
      lines={shown}
      className={typedClassName}
      charMs={charMs}
      caretClassName="bg-(--ink)"
    />
  )
}

function CodeLines({ lines }: { lines: { key: string; text: string; tone: 'muted' | 'cmd' }[] }) {
  return (
    <pre
      className={`m-0 bg-(--surface) border border-(--hairline) rounded-[4px] py-4 px-5 text-[0.82rem] leading-[1.9] text-(--ink) overflow-x-auto max-[768px]:px-4 max-[768px]:text-[0.76rem] ${mono}`}
    >
      <TypedBlock
        lines={lines.map((l) =>
          l.tone === 'cmd'
            ? { key: l.key, text: l.text }
            : { key: l.key, text: l.text, className: 'text-(--faint)' }
        )}
        typedClassName="text-(--pass)"
        charMs={18}
      />
    </pre>
  )
}

/**
 * 히어로 오른쪽 — 선택 블록을 Playwright HTML 리포트처럼 보여 준다.
 * `$` 명령 줄을 친 뒤 행이 차례로 들어오고(칩은 작은 스프링으로 튀어나온다), 맨 위 진행선이 그만큼 찬다.
 * 행은 처음부터 DOM 에 있는 실제 글이라 스크린리더는 등장 순서와 무관하게 전부 읽는다.
 * 모션 최소화면 처음부터 전부 보여 준다.
 */
function SelectionReport() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [landed, setLanded] = useState(0)

  useEffect(() => {
    if (reduce || !inView || landed >= REPORT_TOTAL) return
    const timer = setTimeout(
      () => setLanded((n) => n + 1),
      landed === 0 ? CMD_TYPE_MS : ROW_STEP_MS
    )
    return () => clearTimeout(timer)
  }, [reduce, inView, landed])

  const shown = reduce ? REPORT_TOTAL : landed

  return (
    <figure className={`${panelClass} overflow-hidden m-0`}>
      <figcaption className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 bg-(--subtle) border-b border-(--hairline)">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-(--hairline)">
          <motion.span
            className="block h-full bg-(--pass) origin-left"
            initial={false}
            animate={{ scaleX: shown / REPORT_TOTAL }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          />
        </span>
        <span className="inline-flex items-center gap-2 text-[0.875rem] font-semibold text-(--ink)">
          <Terminal className="w-4 h-4" aria-hidden="true" />
          선택 실행마다 붙는 선택 블록
        </span>
        <StatusChip status="pass" solid>
          PARTIAL · exit 0
        </StatusChip>
      </figcaption>
      <div
        ref={ref}
        className={`px-4 py-3 border-b border-(--hairline) bg-(--surface) text-[0.8rem] leading-[1.7] whitespace-pre-wrap wrap-anywhere ${mono}`}
      >
        <TypedBlock lines={HERO_TYPED} typedClassName="text-(--ink)" charMs={HERO_CHAR_MS} />
      </div>
      <ol className="list-none m-0 p-0">
        {REPORT_ROWS.map((row, i) => {
          const on = i < shown
          return (
            <motion.li
              key={row.id}
              className={`grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 px-4 py-2.5 text-[0.8rem] leading-[1.6] ${mono} ${
                row.closing
                  ? 'border-t-2 border-(--ink)'
                  : 'border-t border-(--hairline) first:border-t-0'
              } ${ROW_SURFACE[row.closing ? 'closing' : row.status]}`}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              {row.chip === null ? (
                <>
                  <span aria-hidden="true" />
                  <span className={`sm:pl-[7.25rem] wrap-anywhere ${row.valueClass}`}>
                    <span aria-hidden="true" className="text-(--faint)">
                      {row.glyph}{' '}
                    </span>
                    {row.value}
                  </span>
                </>
              ) : (
                <>
                  <span aria-hidden="true" className={`font-bold ${STATUS[row.status].text}`}>
                    {row.glyph}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
                    <motion.span
                      className="inline-flex shrink-0 sm:w-[6.5rem]"
                      initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                      animate={on ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 24, delay: 0.05 }}
                    >
                      <StatusChip status={row.status} glyph={false}>
                        {row.chip}
                      </StatusChip>
                    </motion.span>
                    <span
                      className={`flex-1 basis-[12rem] min-w-0 whitespace-pre-wrap wrap-anywhere ${row.valueClass}`}
                    >
                      {row.value}
                    </span>
                  </div>
                </>
              )}
            </motion.li>
          )
        })}
      </ol>
    </figure>
  )
}

/** 연속 hit 칸 — 통과 초록으로 차는 작은 체크박스. 장식이라 aria-hidden — 같은 내용은 3/4 단계의 글이 말한다. */
function StreakMeter({ filled }: { filled: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
      {STREAK_SLOTS.map((slot) => {
        const on = slot <= filled
        return (
          <motion.span
            key={slot}
            className="grid place-items-center w-4 h-4 rounded-[2px] border border-(--pass)"
            initial={false}
            animate={{
              backgroundColor: on ? PALETTE.pass : PASS_CLEAR,
              scale: on && slot === filled ? [1, 1.25, 1] : 1,
            }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <motion.span
              className="grid place-items-center"
              initial={false}
              animate={{ opacity: on ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="w-3 h-3 text-(--surface)" strokeWidth={3.5} />
            </motion.span>
          </motion.span>
        )
      })}
    </span>
  )
}

/**
 * 섀도 4단계. 3단계 행의 streak 칸이 1 → 2 → 3 으로 차고, 다 차면 4단계(사람이 promote) 행이 통과 색으로 켜진다.
 * 이 목록만 다시 그리도록 페이지에서 떼어 둔다. 모션 최소화면 칸은 전부 찬 채로 멈추고 강조는 없다.
 */
function ShadowStepList() {
  const ref = useRef<HTMLOListElement>(null)
  const phase = useCycle(STREAK_SLOTS.length + 1, 1200, ref)
  const filled = phase === null ? STREAK_SLOTS.length : Math.min(phase + 1, STREAK_SLOTS.length)
  const promoted = phase === STREAK_SLOTS.length
  const meterIndex = SHADOW_STEPS.length - 2
  const promoteIndex = SHADOW_STEPS.length - 1

  return (
    <ol ref={ref} className={`${panelClass} overflow-hidden list-none p-0 m-0 mb-10`}>
      {SHADOW_STEPS.map((s, i) => {
        const lit = promoted && i === promoteIndex
        return (
          <li
            key={s.n}
            className={`relative border-t border-(--hairline) first:border-t-0 transition-colors duration-500 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-(--pass) before:transition-opacity before:duration-500 ${
              lit ? 'bg-(--pass-tint) before:opacity-100' : 'bg-(--surface) before:opacity-0'
            }`}
          >
            <Reveal
              delay={i * 0.05}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 px-5 py-5 max-[560px]:grid-cols-[2.75rem_minmax(0,1fr)] max-[560px]:px-4"
            >
              <div className={`text-[0.85rem] font-semibold text-(--ink) pt-0.5 ${mono}`}>
                {s.n}/{SHADOW_STEPS.length}
              </div>
              <div>
                <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2 mb-1.5">
                  <h3 className="text-[1.05rem] font-bold text-(--ink) leading-[1.5]">{s.title}</h3>
                  {i === meterIndex && <StreakMeter filled={filled} />}
                  {i === promoteIndex && (
                    <motion.span
                      aria-hidden="true"
                      className="grid place-items-center w-4 h-4 rounded-[2px] bg-(--pass)"
                      initial={false}
                      animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.9 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 24 }}
                    >
                      <Check className="w-3 h-3 text-(--surface)" strokeWidth={3.5} />
                    </motion.span>
                  )}
                </div>
                <p className="text-[0.9375rem] text-(--muted) leading-[1.7]">{s.desc}</p>
              </div>
            </Reveal>
          </li>
        )
      })}
    </ol>
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

  const sectionClass = 'px-12 py-24 border-t border-(--hairline) max-[768px]:px-5 max-[768px]:py-16'
  const innerClass = 'max-w-[1200px] mx-auto w-full'
  const navLinkClass = `inline-flex items-center gap-1.5 min-h-11 text-[0.78rem] text-(--muted) tracking-[0.08em] underline-offset-4 transition-colors duration-200 hover:text-(--ink) hover:underline ${focusClass} ${mono}`
  const kvRowClass =
    'grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-1 px-5 py-4 border-t border-(--hairline) first:border-t-0 max-[560px]:grid-cols-1'
  const kvKeyClass = `text-[0.72rem] text-(--muted) tracking-[0.04em] uppercase font-semibold pt-1 ${mono}`
  const thClass = `py-3 px-5 text-[0.72rem] text-(--ink) uppercase tracking-[0.04em] font-semibold ${mono}`
  const noteClass = 'text-[0.9375rem] text-(--muted) leading-[1.8] max-w-[720px]'

  return (
    <PageMotion>
      <div
        className={`motion-scope min-h-dvh bg-(--bg) text-(--ink) overflow-x-hidden antialiased ${sans}`}
        style={PALETTE_VARS}
      >
        <a
          href="#main"
          className={`sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-(--ink) focus:text-(--surface) focus:rounded-[4px] focus:py-2 focus:px-4 text-[0.8rem] font-semibold ${focusClass} ${mono}`}
        >
          본문으로 건너뛰기
        </a>

        {/* Nav */}
        <nav
          aria-label="페이지 상단"
          className="fixed top-0 left-0 right-0 z-[100] px-12 bg-(--surface) border-b border-(--hairline) max-[768px]:px-4"
        >
          <div className={`${innerClass} flex items-center justify-between h-14`}>
            <button
              type="button"
              onClick={() => void navigate('/dev')}
              className={`${navLinkClass} px-2 bg-transparent cursor-pointer`}
            >
              ← Home
            </button>
            <div
              className={`inline-flex items-center gap-2 text-[0.85rem] font-bold tracking-[0.14em] uppercase text-(--ink) ${mono}`}
            >
              <span className="w-2 h-2 rounded-full bg-(--pass)" aria-hidden="true" />
              e2e-rail
            </div>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${navLinkClass} px-2`}
            >
              <Github className="w-3.5 h-3.5" aria-hidden="true" />
              GitHub
            </a>
          </div>
        </nav>

        <main id="main">
          {/* Hero */}
          <header className="pt-32 pb-20 px-12 max-[768px]:pt-24 max-[768px]:pb-14 max-[768px]:px-5">
            <div
              className={`${innerClass} grid grid-cols-1 gap-12 items-start min-[1100px]:grid-cols-12`}
            >
              <div className="min-[1100px]:col-span-6">
                <Reveal>
                  <span
                    className={`inline-flex items-center gap-2 text-[0.72rem] text-(--ink) tracking-[0.16em] uppercase font-semibold border border-(--ink) bg-(--surface) rounded-[3px] py-1.5 px-3 mb-7 ${mono}`}
                  >
                    <TestTubeDiagonal className="w-3.5 h-3.5" aria-hidden="true" />
                    Claude Code · Codex Plugin
                  </span>
                  <h1 className="text-[clamp(2.1rem,4.8vw,3.6rem)] font-bold tracking-[-0.035em] leading-[1.15] mb-6 text-(--ink)">
                    바뀐 코드가 닿는
                    <br />
                    테스트만,{' '}
                    <span className="underline decoration-(--pass) decoration-[0.09em] underline-offset-[0.16em]">
                      근거와 함께
                    </span>
                  </h1>
                  <p className="text-[1.0625rem] text-(--muted) leading-[1.75] max-w-[520px] mb-9">
                    Playwright E2E를 변경 기준으로 고르고, 모든 실행을 검증한 코드의 지문에 묶어
                    남기고, 측정값으로 나눠 돌립니다. 판정할 수 없을 때는 좁히지 않고 전수로
                    넓힙니다.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => scrollTo('install')}
                      className={`${btnPrimaryClass} ${focusClass} ${mono}`}
                    >
                      설치 명령 보기 <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btnSecondaryClass} ${focusClass} ${mono}`}
                    >
                      GitHub에서 보기
                    </a>
                  </div>
                </Reveal>

                <Reveal delay={0.15} className="mt-12">
                  <dl className="grid grid-cols-4 gap-px m-0 bg-(--hairline) border-y-2 border-(--ink) max-[640px]:grid-cols-2">
                    {STATS.map((s) => (
                      <div key={s.label} className="bg-(--bg) py-4 px-4">
                        <dt className="sr-only">{s.label}</dt>
                        <dd className="m-0">
                          <div
                            className={`text-[1.75rem] font-bold leading-none text-(--ink) mb-2.5 ${mono}`}
                          >
                            <CountUp value={s.value} />
                          </div>
                          <div className="text-[0.8rem] text-(--muted) leading-[1.5]">
                            {s.label}
                          </div>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              </div>

              <Reveal delay={0.1} className="min-[1100px]:col-span-6">
                <SelectionReport />
              </Reveal>
            </div>
          </header>

          {/* 세 동사 */}
          <section className={sectionClass} aria-labelledby="verbs-title">
            <div className={innerClass}>
              <SectionHead
                id="verbs-title"
                index="01"
                icon={<Radar className="w-4 h-4" aria-hidden="true" />}
                label="Three verbs"
                title="고른다 · 남긴다 · 나눈다"
                desc="스킬 층이 하는 일은 에이전트의 보고를 바로잡는 것입니다. 선택 실행이나 재실행, 필터 실행을 전수 통과라고 말하지 못하게 하고, 선택 실행마다 근거를 적은 선택 블록을 붙이고, 통과했다고 말하기 전에 verify를 돌리게 합니다."
              />
              <ol
                className={`${panelClass} grid grid-cols-3 list-none p-0 m-0 max-[900px]:grid-cols-1`}
              >
                {VERBS.map((v, i) => (
                  <li
                    key={v.id}
                    className="border-(--hairline) border-l first:border-l-0 max-[900px]:border-l-0 max-[900px]:border-t max-[900px]:first:border-t-0"
                  >
                    <Reveal delay={i * 0.06} className="p-6 h-full">
                      <div className="flex items-center justify-between gap-3 mb-5 text-(--ink)">
                        <span
                          className={`text-[0.75rem] font-semibold tracking-[0.2em] text-(--muted) ${mono}`}
                        >
                          0{i + 1}
                        </span>
                        {v.icon}
                      </div>
                      <h3 className="text-[1.6rem] font-bold tracking-[-0.02em] text-(--ink) mb-2">
                        {v.verb}
                      </h3>
                      <p className="text-[1rem] text-(--ink) leading-[1.65] mb-2">{v.line}</p>
                      <p className="text-[0.9375rem] text-(--muted) leading-[1.7]">{v.detail}</p>
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
                index="02"
                icon={<Target className="w-4 h-4" aria-hidden="true" />}
                label="Select"
                title='모름은 "변경 없음"이 아니다. 넓힌다.'
                desc="변경 파일은 규칙표에서 처음 맞는 행으로 분류됩니다. 판단이 서지 않으면 앱 전수가 기본값입니다. 아래에서 파일을 하나 골라 보세요."
              />
              <Reveal className="grid grid-cols-1 gap-6 items-start min-[900px]:grid-cols-12">
                <div className="min-[900px]:col-span-5">
                  <div
                    id="sim-label"
                    className={`text-[0.72rem] text-(--muted) tracking-[0.04em] uppercase font-semibold mb-3 ${mono}`}
                  >
                    변경된 파일
                  </div>
                  <div
                    role="radiogroup"
                    aria-labelledby="sim-label"
                    className="flex flex-col gap-1.5"
                  >
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
                          className={`relative flex items-center justify-between gap-3 min-h-11 text-left rounded-[4px] border bg-(--surface) py-2.5 pl-4 pr-3.5 cursor-pointer transition-colors duration-200 ${focusClass} ${mono} text-[0.8rem] ${
                            active
                              ? 'border-(--ink) text-(--ink) font-semibold'
                              : 'border-(--hairline) text-(--muted) hover:border-(--muted) hover:text-(--ink)'
                          }`}
                        >
                          {active && (
                            // 선택 표시(왼쪽 잉크 막대)가 옵션 사이를 미끄러져 옮겨 간다
                            <motion.span
                              layoutId="e2e-rail-sim-active"
                              aria-hidden="true"
                              className="absolute inset-y-0 left-0 w-[2px] bg-(--ink) pointer-events-none"
                              transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                            />
                          )}
                          <span className="relative break-all">{s.file}</span>
                          {active && (
                            <Check
                              className="relative w-4 h-4 text-(--ink) shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* aria-live 영역 자체는 그대로 두고, 안쪽 내용만 시나리오 키로 바꿔 끼운다 */}
                <div
                  className={`${panelClass} overflow-hidden min-[900px]:col-span-7`}
                  aria-live="polite"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {scenario && (
                      <motion.div
                        key={scenario.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.26, ease: EASE_OUT },
                        }}
                        exit={{ opacity: 0, y: -6, transition: { duration: 0.14, ease: 'easeIn' } }}
                      >
                        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-(--subtle) border-b border-(--hairline)">
                          <StatusChip status={OUTCOME_META[scenario.outcome].status}>
                            {OUTCOME_META[scenario.outcome].label}
                          </StatusChip>
                          <span className={`text-[0.78rem] font-semibold text-(--muted) ${mono}`}>
                            {OUTCOME_META[scenario.outcome].exit}
                          </span>
                        </div>
                        <dl className="m-0">
                          <div className={kvRowClass}>
                            <dt className={kvKeyClass}>돌아가는 것</dt>
                            <dd className="m-0 text-[1.05rem] font-semibold text-(--ink)">
                              {scenario.result}
                            </dd>
                          </div>
                          <div className={kvRowClass}>
                            <dt className={kvKeyClass}>근거 (reason)</dt>
                            <dd className={`m-0 text-[0.85rem] text-(--ink) wrap-anywhere ${mono}`}>
                              {scenario.reason}
                            </dd>
                          </div>
                          <div className={kvRowClass}>
                            <dt className={kvKeyClass}>왜</dt>
                            <dd className="m-0 text-[0.9375rem] text-(--muted) leading-[1.75]">
                              {scenario.why}
                            </dd>
                          </div>
                        </dl>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>

              <Reveal className={`${panelClass} mt-6 overflow-x-auto`}>
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <caption className="sr-only">변경 파일 분류 규칙표</caption>
                  <thead>
                    <tr className="border-b-2 border-(--ink)">
                      <th scope="col" className={`${thClass} w-12`}>
                        #
                      </th>
                      <th scope="col" className={thClass}>
                        변경 파일
                      </th>
                      <th scope="col" className={thClass}>
                        결과
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {RULES.map((r) => (
                      <tr
                        key={r.n}
                        className="border-t border-(--hairline) first:border-t-0 even:bg-(--zebra)"
                      >
                        <td
                          className={`py-3.5 px-5 text-[0.85rem] font-semibold text-(--ink) ${mono}`}
                        >
                          {r.n}
                        </td>
                        <td className="py-3.5 px-5 text-[0.9375rem] text-(--ink) leading-[1.6]">
                          {r.match.replaceAll('`', '')}
                        </td>
                        <td
                          className={`py-3.5 px-5 text-[0.8rem] text-(--muted) leading-[1.6] ${mono}`}
                        >
                          {r.result}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Reveal>
              <Reveal>
                <p className={`${noteClass} mt-5`}>
                  기준 커밋이 없거나 git이 diff를 내지 못하면 모든 앱 전수(
                  <code className={codeInlineClass}>no-base</code>)입니다. 종료 코드 0은 모든 앱이
                  partial, 10은 어느 앱이 전수라는 뜻입니다.
                </p>
              </Reveal>
            </div>
          </section>

          {/* 원장 · verify */}
          <section className={sectionClass} aria-labelledby="ledger-title">
            <div className={innerClass}>
              <SectionHead
                id="ledger-title"
                index="03"
                icon={<Fingerprint className="w-4 h-4" aria-hidden="true" />}
                label="Ledger · Verify"
                title='"아까 통과했다"는 확인하는 것이지 가정하는 것이 아니다'
                desc="실행마다 코드의 지문과 결과를 .e2e-rail/ledger.jsonl에 한 줄씩 덧붙입니다. verify는 그 원장으로 정확히 이 코드가 통과했는지 답합니다."
              />
              <div className="grid grid-cols-1 gap-6 items-start min-[1100px]:grid-cols-12">
                <Reveal className={`${panelClass} min-[1100px]:col-span-5`}>
                  <div className="flex items-center justify-between gap-3 px-5 py-3 border-b-2 border-(--ink)">
                    <h3
                      className={`text-[0.75rem] text-(--ink) tracking-[0.14em] uppercase font-semibold ${mono}`}
                    >
                      지문 (fingerprint)
                    </h3>
                    <span aria-hidden="true" className={`text-[0.72rem] text-(--faint) ${mono}`}>
                      .e2e-rail/ledger.jsonl
                    </span>
                  </div>
                  <ul className="list-none px-5 py-3 m-0 grid gap-1">
                    {FINGERPRINT.map((f) => (
                      <li key={f.name} className="flex items-baseline gap-3 py-1.5">
                        <code
                          className={`text-[0.85rem] font-semibold text-(--ink) shrink-0 ${mono}`}
                        >
                          {f.name}
                        </code>
                        <span
                          aria-hidden="true"
                          className="relative -top-1 flex-1 min-w-6 border-b border-dotted border-(--faint)"
                        />
                        <span className="text-[0.9375rem] text-(--muted) text-right">{f.note}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <div
                  className={`${panelClass} overflow-hidden grid grid-cols-3 min-[1100px]:col-span-7 max-[640px]:grid-cols-1`}
                >
                  {VERIFY_EXITS.map((v, i) => (
                    <Reveal
                      key={v.code}
                      pop
                      delay={0.06 + i * 0.1}
                      className="border-(--hairline) border-l first:border-l-0 max-[640px]:border-l-0 max-[640px]:border-t max-[640px]:first:border-t-0"
                    >
                      <div
                        className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-(--hairline) ${STATUS[v.status].tint}`}
                      >
                        <span
                          className={`text-[1.9rem] font-bold leading-none ${STATUS[v.status].text} ${mono}`}
                        >
                          {v.code}
                        </span>
                        <StatusChip status={v.status}>{v.word}</StatusChip>
                      </div>
                      <p className="px-4 py-4 text-[0.9375rem] text-(--ink) leading-[1.7]">
                        {v.desc}
                      </p>
                    </Reveal>
                  ))}
                </div>
              </div>
              <Reveal className={`${panelClass} mt-6`}>
                <h3 className="flex items-center gap-2 px-5 py-3 border-b-2 border-(--ink) text-[1rem] font-bold text-(--ink)">
                  <Ban className="w-4 h-4 text-(--fail)" aria-hidden="true" />
                  검증으로 세지 않는 실행
                </h3>
                <ul className="list-none p-0 m-0">
                  {NOT_VERIFICATION.map((t) => (
                    <li
                      key={t}
                      className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 px-5 py-3 border-t border-(--hairline) first:border-t-0 text-[0.9375rem] text-(--ink) leading-[1.75]"
                    >
                      <span aria-hidden="true" className={`font-bold text-(--fail) ${mono}`}>
                        {STATUS.fail.glyph}
                      </span>
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
                index="04"
                icon={<ShieldAlert className="w-4 h-4" aria-hidden="true" />}
                label="Shadow mode"
                tone="warn"
                title="선택기는 전수를 대신하기 전에 신뢰를 얻는다"
                desc="전수가 어차피 도는 동안 선택을 옆에 두고 결과를 비교합니다. 그래서 섀도 기간의 비용은 0입니다."
              />
              <ShadowStepList />
              <Reveal>
                <h3
                  className={`text-[0.75rem] text-(--ink) tracking-[0.14em] uppercase font-semibold mb-4 ${mono}`}
                >
                  shadow record가 남기는 판정
                </h3>
              </Reveal>
              <ul className={`${panelClass} overflow-hidden list-none p-0 m-0`}>
                {SHADOW_OUTCOMES.map((o, i) => (
                  <li key={o.id} className="border-t border-(--hairline) first:border-t-0">
                    <Reveal
                      pop
                      delay={i * 0.07}
                      className="grid grid-cols-[9rem_8rem_minmax(0,1fr)] gap-x-6 items-baseline px-5 py-4 max-[760px]:grid-cols-1 max-[760px]:gap-y-2"
                    >
                      <div>
                        <StatusChip status={o.status}>{o.label}</StatusChip>
                      </div>
                      <div className={`text-[0.82rem] font-semibold text-(--ink) ${mono}`}>
                        {o.effect}
                      </div>
                      <p className="text-[0.9375rem] text-(--muted) leading-[1.7]">{o.desc}</p>
                    </Reveal>
                  </li>
                ))}
              </ul>
              <Reveal>
                <p className={`${noteClass} mt-8 border-l-2 border-(--warn) pl-5`}>
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
                index="05"
                icon={<LayoutGrid className="w-4 h-4" aria-hidden="true" />}
                label="Lock · Workers · Shard"
                title="워커 수는 e2e-rail이 정하지 않는다. 재서 정한다"
                desc="머신 하나에 무거운 실행은 하나입니다. 몇 개를 동시에 돌릴지, 몇 조각으로 나눌지는 같은 목록을 돌려 본 측정값이 정합니다."
              />
              <div className={panelClass}>
                {SHARD_CARDS.map((c, i) => (
                  <Reveal
                    key={c.title}
                    delay={i * 0.06}
                    className="grid grid-cols-12 gap-x-6 gap-y-3 items-start px-5 py-5 border-t border-(--hairline) first:border-t-0 max-[1000px]:grid-cols-1"
                  >
                    <h3 className="col-span-2 text-[1.15rem] font-bold text-(--ink) max-[1000px]:col-span-1">
                      {c.title}
                    </h3>
                    <code
                      className={`col-span-5 block min-w-0 text-[0.78rem] text-(--ink) bg-(--subtle) border border-(--hairline) rounded-[3px] py-2 px-3 overflow-x-auto whitespace-nowrap max-[1000px]:col-span-1 ${mono}`}
                    >
                      {c.command}
                    </code>
                    <p className="col-span-5 text-[0.9375rem] text-(--muted) leading-[1.75] max-[1000px]:col-span-1">
                      {c.desc}
                    </p>
                  </Reveal>
                ))}
              </div>
              <Reveal>
                <p className={`${noteClass} mt-6`}>
                  CI 템플릿은 <code className={codeInlineClass}>templates/ci/</code>에 있고 복사해서
                  씁니다: GitHub Actions 샤드 matrix, CodeBuild batch, 섀도 기간 게이트용 buildspec
                  스니펫. e2e-rail이 대신 설치하지는 않습니다.
                </p>
              </Reveal>
            </div>
          </section>

          {/* 플러그인 층 */}
          <section className={sectionClass} aria-labelledby="plugin-title">
            <div className={innerClass}>
              <SectionHead
                id="plugin-title"
                index="06"
                icon={<Bot className="w-4 h-4" aria-hidden="true" />}
                label="Plugin layer"
                title="CLI를 정직하게 쓰도록 강제하는 스킬 다섯 개"
                desc={
                  <>
                    에이전트가 선택을 전수 통과로 보고하는 일을 막는 층입니다. 읽기 전용 에이전트{' '}
                    <code className={codeInlineClass}>e2e-impact-analyst</code>는 그래프가 못 보는
                    문자열 이동, 모달 오프너, 런타임 라우트, URL 상태, 모바일 분기를 점검하고 근거와
                    함께 --add 후보만 돌려줍니다. 삭제는 제안하지 않습니다.
                  </>
                }
              />
              <Reveal className={`${panelClass} overflow-x-auto`}>
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <caption className="sr-only">e2e-rail 스킬 다섯 개</caption>
                  <thead>
                    <tr className="border-b-2 border-(--ink)">
                      <th scope="col" className={thClass}>
                        스킬
                      </th>
                      <th scope="col" className={thClass}>
                        언제
                      </th>
                      <th scope="col" className={thClass}>
                        무엇을 강제하나
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SKILLS.map((s) => (
                      <tr
                        key={s.name}
                        className="border-t border-(--hairline) first:border-t-0 align-top even:bg-(--zebra)"
                      >
                        <th
                          scope="row"
                          className={`py-4 px-5 text-[0.82rem] text-(--ink) font-semibold whitespace-nowrap ${mono}`}
                        >
                          {s.name}
                        </th>
                        <td className="py-4 px-5 text-[0.9375rem] text-(--ink)">{s.when}</td>
                        <td className="py-4 px-5 text-[0.9375rem] text-(--muted) leading-[1.7]">
                          {s.enforces}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Reveal>
              <Reveal>
                <p className={`${noteClass} mt-5`}>
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
                index="07"
                icon={<Ban className="w-4 h-4" aria-hidden="true" />}
                label="Limits"
                tone="bad"
                title="정적 분석이 잘못 좁힐 수 있는 곳"
                desc="아래 경우에는 선택이 여전히 틀릴 수 있습니다. 각각 완화책이 있고, 누군가 선택을 믿기 전에 섀도 모드가 새어 나간 것을 셉니다."
              />
              <ul className={`${panelClass} list-none p-0 m-0`}>
                {LIMITS.map((l, i) => (
                  <li key={l.title} className="border-t border-(--hairline) first:border-t-0">
                    <Reveal
                      delay={i * 0.05}
                      className="grid grid-cols-12 gap-x-6 gap-y-3 px-5 py-5 max-[900px]:grid-cols-1"
                    >
                      <div className="col-span-7 max-[900px]:col-span-1">
                        <h3 className="text-[1rem] font-bold text-(--ink) leading-[1.5] mb-1.5">
                          {l.title}
                        </h3>
                        <p className="text-[0.9375rem] text-(--muted) leading-[1.75]">{l.desc}</p>
                      </div>
                      <p className="col-span-5 text-[0.9375rem] text-(--ink) leading-[1.75] border-l border-(--hairline) pl-6 max-[900px]:col-span-1 max-[900px]:border-l-0 max-[900px]:pl-0">
                        <span className="inline-flex mr-2 align-[0.1em]">
                          <StatusChip status="pass">완화</StatusChip>
                        </span>
                        {l.fix}
                      </p>
                    </Reveal>
                  </li>
                ))}
              </ul>
              <Reveal>
                <p className={`${noteClass} mt-6`}>
                  잘못 좁히지는 않지만 늘 앱 전수로 도는 모양도 있습니다. 다른 라우트 파일에서 펼친{' '}
                  <code className={codeInlineClass}>export default [...]</code> 라우트 표, 로컬{' '}
                  <code className={codeInlineClass}>lazy()</code> 상수가 페이지인 리프, srcDir
                  아래의 코드 아닌 파일입니다. map --check가 어느 쪽인지 알려 줍니다.
                </p>
              </Reveal>
            </div>
          </section>

          {/* 변경 이력 */}
          <section className={sectionClass} aria-labelledby="changelog-title">
            <div className={innerClass}>
              <SectionHead
                id="changelog-title"
                index="08"
                icon={<Wrench className="w-4 h-4" aria-hidden="true" />}
                label="Changelog · v0.2.x"
                title="재현된 결함만 고쳤다"
                desc="v0.2.0과 v0.2.1은 외부 감사가 낸 결함이고, 모두 실제 Playwright 1.63으로 재현한 뒤에 고쳤습니다. v0.2.2는 149개 spec 앱에 도입하다 나온 결함입니다. 세 버전이 지키려는 것은 하나입니다. 실행을 실제보다 큰 검증으로 내놓지 않고, 추측으로 좁히지 않는다는 것."
              />
              <Reveal className={`${panelClass} overflow-hidden`}>
                <ul className="list-none p-0 m-0">
                  {FIXES.map((f) => (
                    <li
                      key={f.title}
                      className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-5 gap-y-2 px-6 py-5 items-start border-t border-(--hairline) first:border-t-0 max-[700px]:grid-cols-1 max-[700px]:px-5"
                    >
                      <span className="w-fit">
                        <StatusChip status="ink" glyph={false}>
                          v{f.version}
                        </StatusChip>
                      </span>
                      <div>
                        <p className="text-[1rem] text-(--ink) font-semibold leading-[1.6] mb-1">
                          {f.title}
                        </p>
                        <p className="text-[0.9375rem] text-(--muted) leading-[1.75]">{f.fix}</p>
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
                index="09"
                icon={<Terminal className="w-4 h-4" aria-hidden="true" />}
                label="Install"
                title="레포 하나에 약 30분"
                desc="스킬과 CI는 항상 레포에 설치된 CLI 사본을 부릅니다. 세션과 CI가 같은 코어를 돌려야 원장이 서로 비교되기 때문입니다."
              />
              <div className="grid grid-cols-1 gap-8 min-[1000px]:grid-cols-12">
                <div className="grid grid-cols-1 gap-5 min-[1000px]:col-span-7">
                  {INSTALL.map((b, i) => (
                    <Reveal key={b.id} delay={i * 0.05}>
                      <div
                        className={`text-[0.75rem] text-(--ink) font-semibold tracking-[0.08em] mb-2 ${mono}`}
                      >
                        {b.label}
                      </div>
                      <CodeLines lines={b.lines} />
                    </Reveal>
                  ))}
                </div>
                <Reveal delay={0.1} className="min-[1000px]:col-span-5">
                  <ol className="list-none p-0 m-0 border-t-2 border-(--ink)">
                    {SETUP_STEPS.map((s) => (
                      <li
                        key={s.n}
                        className="grid grid-cols-[2rem_minmax(0,1fr)] gap-4 items-start py-4 border-b border-(--hairline)"
                      >
                        <span
                          className={`w-8 h-8 rounded-[3px] border border-(--ink) text-(--ink) text-[0.8rem] font-semibold grid place-items-center shrink-0 ${mono}`}
                        >
                          {s.n}
                        </span>
                        <div>
                          <div className="text-[1rem] font-semibold text-(--ink)">{s.title}</div>
                          <div className="text-[0.9375rem] text-(--muted) leading-[1.7]">
                            {s.desc}
                          </div>
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
              <SectionHead id="faq-title" index="10" label="FAQ" title="자주 묻는 질문" />
              <Reveal className="max-w-[820px] border-b border-(--hairline)">
                {FAQS.map((faq, i) => {
                  const isOpen = openFaq === i
                  const panelId = `faq-panel-${i}`
                  return (
                    <div key={faq.q} className="border-t border-(--hairline)">
                      <h3 className="m-0">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : i)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          className={`w-full flex items-center justify-between gap-4 min-h-14 py-4 text-left bg-transparent cursor-pointer ${focusClass}`}
                        >
                          <span className="text-[1rem] font-bold text-(--ink) leading-[1.55]">
                            {faq.q}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`grid place-items-center w-7 h-7 shrink-0 rounded-[3px] border border-(--ink) text-[1rem] leading-none transition-colors duration-200 ${mono} ${
                              isOpen ? 'bg-(--ink) text-(--surface)' : 'bg-(--surface) text-(--ink)'
                            }`}
                          >
                            {isOpen ? '−' : '+'}
                          </span>
                        </button>
                      </h3>
                      <Collapse open={isOpen} id={panelId}>
                        <p className="text-[0.9375rem] text-(--muted) leading-[1.8] pb-5 pr-11 max-w-[720px] max-[560px]:pr-0">
                          {faq.a}
                        </p>
                      </Collapse>
                    </div>
                  )
                })}
              </Reveal>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="px-12 py-10 border-t border-(--hairline) max-[768px]:px-5">
          <div className={`${innerClass} flex items-center justify-between flex-wrap gap-4`}>
            <div className={`text-[0.75rem] text-(--muted) tracking-[0.05em] ${mono}`}>
              e2e-rail · Claude Code · Codex Plugin · v0.2.2 · MIT © 2026 Seungho
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void navigate('/dev')}
                className={`${navLinkClass} px-3 bg-transparent cursor-pointer`}
              >
                ← Home
              </button>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${navLinkClass} px-3`}
              >
                GitHub →
              </a>
            </div>
          </div>
        </footer>
      </div>
    </PageMotion>
  )
}
