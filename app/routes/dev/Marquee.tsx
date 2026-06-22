const marqueeRaw = [
  'React', '★', 'Next.js', '★', 'TypeScript', '★', 'Vue.js', '★',
  'Emotion CSS', '★', 'Tailwind CSS', '★',
  'Jotai', '★', 'Redux', '★', 'React Query', '★',
  'Turborepo', '★', 'Vite', '★',
  'Frontend Dev', '★',
];

export default function Marquee() {
  return (
    <div className="overflow-hidden bg-gradient-to-r from-[#4f46e5] via-[#06b6d4] to-[#4f46e5] bg-[length:200%_100%] py-[0.9rem]">
      <div className="flex w-max animate-[marquee_22s_linear_infinite]">
        {[...marqueeRaw, ...marqueeRaw].map((item, i) => (
          <span
            key={i}
            className="text-[0.72rem] font-semibold tracking-[0.3em] uppercase text-white/92 px-10 whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--font-mono), monospace' }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
