interface HomeCardProps {
  title: React.ReactNode;
  buttonText: string;
  onClick: () => void;
}

export function HomeCard({ title, buttonText, onClick }: HomeCardProps) {
  return (
    <div className="relative max-w-[420px] w-full h-[320px] bg-white rounded-[20px] px-10 py-[60px] shadow-[0_10px_40px_rgba(0,0,0,0.05)] text-center flex flex-col items-center justify-center gap-10 overflow-hidden before:content-[''] before:absolute before:top-[15px] before:left-[15px] before:right-[15px] before:bottom-[15px] before:border before:border-[#e0d8c8] before:rounded-[12px] before:pointer-events-none max-[480px]:px-5 max-[480px]:py-10">
      <h1 className="text-[2rem] font-normal text-[#5d4037] tracking-[-0.02em] m-0 [&_span]:block [&_span]:mt-2 [&_span]:text-[1.2rem] [&_span]:text-[#8c7b75] max-[480px]:text-[1.6rem] max-[480px]:[&_span]:text-[1rem]">
        {title}
      </h1>
      <button
        onClick={onClick}
        className="bg-[#8c7b75] text-white border-none py-4 px-8 text-[1.1rem] rounded-[50px] cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(93,64,55,0.2)] z-[1] hover:bg-[#5d4037] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(93,64,55,0.3)] active:translate-y-0 max-[480px]:py-[14px] max-[480px]:px-7 max-[480px]:text-[1rem]"
        style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
      >
        {buttonText}
      </button>
    </div>
  );
}
