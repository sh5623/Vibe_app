export default function About() {
  return (
    <section
      id="about"
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
          [ 01 ]
        </span>
        <h2 className="text-[clamp(2.2rem,5.5vw,5rem)] font-extrabold tracking-[-0.025em] leading-[1] text-[#0f172a]">
          ABOUT
        </h2>
      </div>

      <div className="grid grid-cols-[1.1fr_0.9fr] gap-20 items-start max-[1024px]:gap-12 max-[768px]:grid-cols-1 max-[768px]:gap-12">
        <div>
          {[
            <>
              단순한 화면 구현을 넘어,{' '}
              <strong>복잡한 비즈니스 맥락을 이해하고 지속 가능한 코드 구조로 전환</strong>하여
              사용자 경험을 완성하는 프론트엔드 개발자입니다. 총 7년의 경력 동안 금융·공공 SI부터
              대규모 B2C 서비스까지 다양한 도메인을 경험했습니다.
            </>,
            <>
              현재 <strong>여기어때컴퍼니</strong>에서 광고센터 구축 및 고도화, 가격경쟁력 대시보드
              CMS, 해외 숙소 공급사 관리 시스템 등을 개발하며 기획·디자인·백엔드·QA 팀과 협업해
              안정적인 서비스 오픈을 주도하고 있습니다.
            </>,
            <>
              React / Next.js를 주력으로, Vue.js까지 유연하게 활용합니다. TypeScript 환경의 디자인
              시스템 도입, Dynamic Import를 통한 빌드 최적화, OS별 웹뷰 브릿지 공통화 등 기술적 문제
              해결에 강점을 가지고 있습니다.
            </>,
            <>
              최근에는 <strong>fe-rail</strong>을 직접 설계·구현했습니다. Claude Code 플러그인으로,
              spec → build → review → PR 사이클을 자동화하여 프론트엔드 개발 흐름 전체를 단일
              워크플로로 연결합니다. AI 도구를 개발 생산성에 실질적으로 통합하는 데 관심을 갖고
              있습니다.
            </>,
          ].map((text, i) => {
            return (
              <p
                // biome-ignore lint/suspicious/noArrayIndexKey: static text-only array, no stable ID available
                key={i}
                className="text-[clamp(1rem,1.4vw,1.1rem)] leading-[1.85] text-[#64748b] mb-5 [&_strong]:text-[#0f172a] [&_strong]:font-bold"
              >
                {text}
              </p>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { num: '7+', label: 'Years Exp' },
            { num: '10+', label: 'Projects' },
            { num: 'FE', label: 'Role' },
            { num: '2', label: 'Companies' },
          ].map(({ num, label }) => (
            <div
              key={label}
              className="relative bg-white border border-[rgba(79,70,229,0.12)] rounded-[16px] p-8 py-8 px-7 transition-all duration-[250ms] overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-linear-to-r before:from-[#4f46e5] before:to-[#06b6d4] before:scale-x-0 before:origin-left before:transition-transform before:duration-[350ms] before:rounded-tl-[16px] before:rounded-tr-[16px] hover:border-[rgba(79,70,229,0.25)] hover:-translate-y-[5px] hover:shadow-[0_16px_40px_rgba(79,70,229,0.1)] hover:before:scale-x-100"
            >
              <div
                className="text-[2.5rem] font-extrabold leading-[1] mb-2"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {num}
              </div>
              <div
                className="text-[0.68rem] tracking-[0.2em] text-[#94a3b8] uppercase"
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
