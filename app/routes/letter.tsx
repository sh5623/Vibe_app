import type { Route } from './+types/letter';

export function meta(_: Route.MetaArgs) {
  return [{ title: '편지 | Vibe' }];
}

export default function LetterPage() {
  return (
    <div
      className="min-h-screen py-[60px] px-5 flex justify-center items-center"
      style={{ backgroundColor: '#f8f6f2' }}
    >
      <div
        className="relative max-w-[500px] w-full bg-white rounded-[4px] px-[50px] py-[60px] shadow-[0_10px_40px_rgba(0,0,0,0.05)] min-h-[600px] flex flex-col overflow-hidden max-[480px]:px-[30px] max-[480px]:py-10 max-[480px]:min-h-[500px]"
        style={{
          backgroundImage: 'linear-gradient(rgba(224,216,200,0.2) 1px, transparent 1px)',
          backgroundSize: '100% 32px',
          backgroundPosition: '0 54px',
        }}
      >
        <div
          className="text-[1.2rem] text-[#5d4037] mb-10 border-b border-[#e0d8c8] pb-2 w-fit min-w-[100px]"
          style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
        >
          To. 사랑하는 아람이에게
        </div>

        <div
          className="flex-1 text-[1.1rem] text-[#5d4037] leading-[1.8] mb-10 z-[1]"
          style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
        >
          아람이에게.<br />
          <br />
          벌써 우리 도하가 첫 생일을 맞이했네. 돌잔치를 끝내구 지난 1년을 되돌아보니 가장 먼저 생각나는 건 도하의 1년의 시간이 아닌, 아람이의 1년동안의 모습이였어.<br />
          <br />
          임신 기간동안 무거운 몸으로 고생하고, 도하를 낳던 그 순간이 아직도 생생해. 그리고 집에 돌아와 밤잠 설쳐가며 도하를 돌보던 모습, 서로 다른 의견으로 다투던 날들, 도하를 흐뭇하게 바라보던 같은 눈빛.<br />
          <br />
          도하의 첫 뒤집기, 되집기, 이유식 등 모든 순간 함께 할 수 있어서 행복했어.<br />
          <br />
          1년 동안 우리 가족의 든든한 버팀목이 되어줘서 고마워. 언제나 도하 엄마보다는 아람이 라는 이름을 지켜주고 그만큼 아람이를 더 소중하게 여기고 잘해볼게!<br />
          <br />
          사랑해 아람아
        </div>

        <div
          className="text-right text-[1.1rem] text-[#5d4037] mt-auto"
          style={{ fontFamily: "'Gowun Dodum', sans-serif" }}
        >
          From. 승호가
        </div>
      </div>
    </div>
  );
}
