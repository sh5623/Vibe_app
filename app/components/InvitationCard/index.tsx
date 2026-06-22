import dohaImage from '@/assets/doha.jpg';

export function InvitationCard() {
  return (
    <div className="relative max-w-[420px] w-full bg-white rounded-[20px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.05)] text-center flex flex-col items-center overflow-hidden before:content-[''] before:absolute before:top-[15px] before:left-[15px] before:right-[15px] before:bottom-[15px] before:border before:border-[#e0d8c8] before:rounded-[12px] before:pointer-events-none max-[480px]:px-5 max-[480px]:py-[30px]">
      <h1
        className="text-[1.8rem] font-normal text-[#5d4037] mb-[30px] tracking-[-0.02em] mt-[10px] max-[480px]:text-[1.5rem] max-[480px]:mb-5"
      >
        도하의 첫번째 생일
      </h1>

      <div className="w-full mb-10 relative">
        <img
          src={dohaImage}
          alt="도하의 사진"
          className="w-full h-auto rounded-[150px_150px_20px_20px] shadow-[0_8px_16px_rgba(0,0,0,0.1)] block object-cover"
        />
      </div>

      <div className="flex flex-col gap-3 w-full px-[10px] z-[1]">
        <h2
          className="text-[1.4rem] text-[#a89f91] tracking-[0.15em] font-normal mb-5 max-[480px]:text-[1.2rem]"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
        >
          Invitation
        </h2>
        <div className="w-[40px] h-px bg-[#e0d8c8] mx-auto my-[10px] mb-5" />
        <p
          className="text-[1.2rem] font-semibold text-[#4a4a4a] my-1 leading-[1.7] whitespace-pre-wrap max-[480px]:text-[1.1rem]"
        >
          2026년 2월 4일(수) 오후 12시
        </p>
        <p
          className="text-[1.1rem] text-[#8c7b75] my-1 leading-[1.7] whitespace-pre-wrap max-[480px]:text-[1rem]"
        >
          안토 우디플레이트{' '}
          <a
            href="https://map.naver.com/p/entry/place/1428814911?c=15.00,0,0,0,dh&placePath=/home?from=map&fromPanelNum=1&additionalHeight=76&timestamp=202602032108&locale=ko&svcName=map_pcv5"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6d6d6d] underline text-[0.9rem] ml-[5px] hover:text-[#4a4a4a]"
          >
            (약도보기)
          </a>
        </p>
      </div>
    </div>
  );
}
