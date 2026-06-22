export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex justify-between items-center px-12 py-5 bg-[rgba(240,244,255,0.88)] backdrop-blur-[20px] border-b border-[rgba(79,70,229,0.1)] max-[768px]:px-6 max-[768px]:py-4">
      <div
        className="text-[0.88rem] font-bold tracking-[0.15em] uppercase"
        style={{
          fontFamily: 'var(--font-mono), monospace',
          background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        SH.DEV
      </div>
      <div className="flex gap-10 items-center max-[768px]:gap-4 max-[420px]:gap-3">
        {['about', 'stack', 'work', 'contact'].map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="relative text-[0.75rem] text-[#64748b] no-underline tracking-[0.12em] uppercase transition-colors duration-200 hover:text-[#4f46e5] after:content-[''] after:absolute after:-bottom-[3px] after:left-0 after:w-0 after:h-[1.5px] after:bg-gradient-to-r after:from-[#4f46e5] after:to-[#06b6d4] after:transition-[width] after:duration-[250ms] hover:after:w-full max-[480px]:text-[0.68rem]"
            style={{ fontFamily: 'var(--font-mono), monospace' }}
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </a>
        ))}
      </div>
    </nav>
  );
}
