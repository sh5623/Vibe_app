import { MarqueeBand, MarqueeTrack, MarqueeItem } from '../styled';

const marqueeRaw = [
  'React', '★', 'Next.js', '★', 'TypeScript', '★', 'Vue.js', '★',
  'Emotion CSS', '★', 'Tailwind CSS', '★',
  'Jotai', '★', 'Redux', '★', 'React Query', '★',
  'Turborepo', '★', 'Vite', '★',
  'Frontend Dev', '★'
];

export default function Marquee() {
  return (
    <MarqueeBand>
      <MarqueeTrack>
        {[...marqueeRaw, ...marqueeRaw].map((item, i) => (
          <MarqueeItem key={i}>{item}</MarqueeItem>
        ))}
      </MarqueeTrack>
    </MarqueeBand>
  );
}
