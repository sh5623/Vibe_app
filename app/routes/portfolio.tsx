import { useRef, useEffect } from 'react';
import type { Route } from './+types/portfolio';
import { Heart, Stars, Instagram, ExternalLink } from 'lucide-react';
import BambiImage from '@/assets/Bambi.jpg';
import Bambi1 from '@/assets/Bambi/Bambi_1.jpeg';
import Bambi2 from '@/assets/Bambi/Bambi_2.jpeg';
import Bambi3 from '@/assets/Bambi/Bambi_3.jpeg';
import Bambi4 from '@/assets/Bambi/Bambi_4.jpeg';
import Bambi5 from '@/assets/Bambi/Bambi_5.jpeg';
import Bambi6 from '@/assets/Bambi/Bambi_6.jpeg';
import Bambi7 from '@/assets/Bambi/Bambi_7.jpeg';
import Bambi8 from '@/assets/Bambi/Bambi_8.jpeg';
import Work1 from '@/assets/Bambi/works/work_1.jpg';
import Work2 from '@/assets/Bambi/works/work_2.jpg';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Bambi Portfolio | Vibe' }];
}

const galleryImages = [
  { src: Bambi1, alt: '밤비 갤러리 1' },
  { src: Bambi2, alt: '밤비 갤러리 2' },
  { src: Bambi3, alt: '밤비 갤러리 3' },
  { src: Bambi4, alt: '밤비 갤러리 4' },
  { src: Bambi5, alt: '밤비 갤러리 5' },
  { src: Bambi6, alt: '밤비 갤러리 6' },
  { src: Bambi7, alt: '밤비 갤러리 7' },
  { src: Bambi8, alt: '밤비 갤러리 8' },
];

const sliderImages = [...galleryImages, ...galleryImages];

const workItems = [
  {
    title: '강아지 미스트 모델',
    brand: '펫생각 (ThinkPets)',
    description: '데일리케어 이지브러싱 강아지 미스트 (150ml) 메인 모델',
    image: Work1,
    link: 'https://thinkpets.co.kr/product/%EB%8D%B0%EC%9D%BC%EB%A6%AC%EC%BC%80%EC%96%BC-%EC%9D%B4%EC%A7%80%EB%B8%8C%EB%9F%AC%EC%8B%B1-%EA%B0%95%EC%95%84%EC%A7%80-%EB%AF%B8%EC%8A%A4%ED%8A%B8-150ml/297/category/76/display/1/',
  },
  {
    title: '강아지 영양제 모델',
    brand: '마이펫닥터',
    description: '시그니처 기관지 2.0 영양제 모델',
    image: Work2,
    link: 'https://drmypet.co.kr/product/%EB%A7%88%EC%9D%B4%ED%8E%AB%EB%8B%A5%ED%84%B0-%EC%8B%9C%EA%B7%B8%EB%8B%88%EC%B2%98-%EA%B8%B0%EA%B4%80%EC%A7%80-20-%EC%98%81%EC%96%91%EC%A0%9C/948/category/90/display/1/',
  },
];

export default function Portfolio() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let currentScroll = scrollContainer.scrollLeft;

    const playScroll = () => {
      if (!isDragging.current) {
        if (Math.abs(scrollContainer.scrollLeft - currentScroll) > 5) {
          currentScroll = scrollContainer.scrollLeft;
        } else {
          currentScroll += 2.5;
          if (currentScroll >= scrollContainer.scrollWidth / 2) {
            currentScroll = 0;
          }
          scrollContainer.scrollLeft = currentScroll;
        }
      } else {
        currentScroll = scrollContainer.scrollLeft;
      }
      animationId = requestAnimationFrame(playScroll);
    };

    animationId = requestAnimationFrame(playScroll);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    startScrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = startScrollLeft.current - walk;
  };

  const handleUpOrLeave = () => {
    isDragging.current = false;
  };

  return (
    <div
      className="min-h-screen text-white px-8 py-16 flex flex-col items-center overflow-x-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 100%)',
      }}
    >
      {/* Hero */}
      <section className="text-center mb-16 flex flex-col items-center gap-6 animate-[fadeInUp_1s_ease-out]">
        <h1
          className="text-[clamp(3rem,8vw,6rem)] font-extrabold m-0 tracking-[-0.05em] leading-[1.2]"
          style={{
            background: 'linear-gradient(to right, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          HI, I'M BAMBI
        </h1>
        <p className="text-[clamp(1.2rem,3vw,1.8rem)] text-[#94a3b8] mt-4 font-light">
          The cutest Papillon with big pretty ears 🦋
        </p>
        <a
          href="https://www.instagram.com/bambi.__.i?igsh=d3U2ZHRybjNpdjQz&utm_source=qr"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 py-3 px-6 text-white no-underline rounded-[30px] font-semibold text-[1.1rem] transition-all duration-300 shadow-[0_4px_15px_rgba(220,39,67,0.3)] hover:-translate-y-[3px] hover:shadow-[0_6px_20px_rgba(220,39,67,0.5)]"
          style={{
            background:
              'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
          }}
        >
          <Instagram size={20} />
          Follow on Instagram
        </a>
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[1200px]">
        {/* Image Card */}
        <div className="bg-white/[0.03] backdrop-blur-[10px] border border-white/5 rounded-[24px] p-4 h-[500px] flex shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-[5px] hover:bg-white/5 animate-[fadeInUp_1s_ease-out_0.2s_both]">
          <div className="relative w-full h-full rounded-[16px] overflow-hidden">
            <img
              src={BambiImage}
              alt="밤비 사진"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.05]"
            />
          </div>
        </div>

        {/* Info Cards */}
        <div className="flex flex-col gap-8">
          <div
            className="flex flex-col justify-center bg-gradient-to-br from-white/5 to-white/[0.01] backdrop-blur-[10px] border border-white/5 rounded-[24px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-[5px] hover:bg-white/5 animate-[fadeInUp_1s_ease-out_0.1s_both]"
          >
            <Heart size={24} color="#f43f5e" className="mb-4 animate-[float_3s_ease-in-out_infinite]" />
            <h3 className="text-[1.8rem] mb-6 text-[#e2e8f0] font-semibold">Profile</h3>
            <p className="text-[1.2rem] text-[#cbd5e1] mb-3 leading-[1.6]">
              이름:{' '}
              <span
                className="text-white font-bold"
                style={{
                  background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                밤비 (Bambi)
              </span>
            </p>
            <p className="text-[1.2rem] text-[#cbd5e1] mb-3 leading-[1.6]">견종: 파피용 (Papillon)</p>
            <p className="text-[1.2rem] text-[#cbd5e1] mb-3 leading-[1.6]">생일: 2021년 4월생</p>
          </div>

          <div
            className="flex flex-col justify-center bg-gradient-to-br from-white/5 to-white/[0.01] backdrop-blur-[10px] border border-white/5 rounded-[24px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-[5px] hover:bg-white/5 animate-[fadeInUp_1s_ease-out_0.2s_both]"
          >
            <Stars size={24} color="#fbbf24" className="mb-4 animate-[float_3s_ease-in-out_infinite]" />
            <h3 className="text-[1.8rem] mb-6 text-[#e2e8f0] font-semibold">Charm Points</h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-4">
              {['✨ 이쁘고 아주 큰 귀 (나비 같은 매력!)', '✨ 반짝이는 눈망울', '✨ 활발하고 사랑스러운 성격'].map((item) => (
                <li
                  key={item}
                  className="text-[1.2rem] text-[#cbd5e1] bg-white/[0.02] py-4 px-6 rounded-[12px] border border-white/5"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Work Section */}
      <section className="w-full max-w-[1200px] mt-24 flex flex-col items-center gap-8 animate-[fadeInUp_1s_ease-out_0.3s_both]">
        <h2
          className="text-[clamp(2rem,5vw,3rem)] font-bold text-[#e2e8f0] mb-8 relative after:content-[''] after:absolute after:-bottom-[10px] after:left-1/2 after:-translate-x-1/2 after:w-[60px] after:h-[4px] after:bg-gradient-to-r after:from-[#f43f5e] after:to-[#fbbf24] after:rounded-[2px]"
        >
          Modeling Work
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 w-full">
          {workItems.map((work, index) => (
            <a
              key={index}
              href={work.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/[0.03] backdrop-blur-[10px] border border-white/5 rounded-[24px] p-6 shadow-[0_4px_30px_rgba(0,0,0,0.1)] no-underline flex flex-col gap-6 transition-all duration-300 hover:-translate-y-[8px] hover:bg-white/[0.08] hover:shadow-[0_10px_40px_rgba(0,0,0,0.2)] [&:hover_.work-img]:scale-[1.08]"
            >
              <div className="relative w-full h-[250px] rounded-[16px] overflow-hidden">
                <img
                  src={work.image}
                  alt={work.title}
                  className="work-img w-full h-full object-cover transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[1.4rem] text-white m-0 font-semibold">{work.title}</h3>
                <p className="text-[1rem] text-[#94a3b8] m-0 leading-[1.5]">
                  <strong>{work.brand}</strong>
                  <br />
                  {work.description}
                </p>
                <div className="inline-flex items-center gap-2 text-[#f43f5e] font-semibold text-[0.9rem] mt-2">
                  보러가기 <ExternalLink size={16} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="w-full max-w-[1200px] mt-24 flex flex-col items-center gap-8 animate-[fadeInUp_1s_ease-out_0.4s_both]">
        <h2
          className="text-[clamp(2rem,5vw,3rem)] font-bold text-[#e2e8f0] mb-8 relative after:content-[''] after:absolute after:-bottom-[10px] after:left-1/2 after:-translate-x-1/2 after:w-[60px] after:h-[4px] after:bg-gradient-to-r after:from-[#38bdf8] after:to-[#818cf8] after:rounded-[2px]"
        >
          Photo Gallery
        </h2>
        <div
          ref={scrollRef}
          className="w-screen max-w-full overflow-x-auto overflow-y-hidden py-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleUpOrLeave}
          onMouseUp={handleUpOrLeave}
          onMouseMove={handleMouseMove}
          onTouchStart={() => { isDragging.current = true; }}
          onTouchEnd={() => { isDragging.current = false; }}
        >
          <div className="flex gap-6 w-max">
            {sliderImages.map((image, index) => (
              <div
                key={index}
                className="shrink-0 w-[300px] h-[350px] bg-white/[0.03] backdrop-blur-[10px] border border-white/5 rounded-[24px] p-2 shadow-[0_4px_30px_rgba(0,0,0,0.1)] select-none transition-all duration-300 hover:-translate-y-[5px] hover:bg-white/5"
              >
                <div
                  className="relative w-full h-full rounded-[16px] overflow-hidden [&:hover_img]:scale-[1.1]"
                  onDragStart={(e) => e.preventDefault()}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-500"
                    draggable={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
