import {
  Section, SectionHeader, SectionNumber, SectionTitle,
  AboutGrid, AboutText, StatGrid, StatCard,
} from '../styled';

export default function About() {
  return (
    <Section id="about">
      <SectionHeader>
        <SectionNumber>[ 01 ]</SectionNumber>
        <SectionTitle>ABOUT</SectionTitle>
      </SectionHeader>
      <AboutGrid>
        <div>
          <AboutText>
            단순한 화면 구현을 넘어, <strong>복잡한 비즈니스 맥락을 이해하고
              지속 가능한 코드 구조로 전환</strong>하여 사용자 경험을 완성하는
            프론트엔드 개발자입니다. 총 7년의 경력 동안 금융·공공 SI부터
            대규모 B2C 서비스까지 다양한 도메인을 경험했습니다.
          </AboutText>
          <AboutText>
            현재 <strong>여기어때컴퍼니</strong>에서 광고센터 구축 및 고도화,
            가격경쟁력 대시보드 CMS, 해외 숙소 공급사 관리 시스템 등을 개발하며
            기획·디자인·백엔드·QA 팀과 협업해 안정적인 서비스 오픈을
            주도하고 있습니다.
          </AboutText>
          <AboutText>
            React / Next.js를 주력으로, Vue.js까지 유연하게 활용합니다.
            TypeScript 환경의 디자인 시스템 도입, Dynamic Import를 통한
            빌드 최적화, OS별 웹뷰 브릿지 공통화 등 기술적 문제 해결에
            강점을 가지고 있습니다.
          </AboutText>
        </div>
        <StatGrid>
          <StatCard>
            <div className="num">7+</div>
            <div className="label">Years Exp</div>
          </StatCard>
          <StatCard>
            <div className="num">10+</div>
            <div className="label">Projects</div>
          </StatCard>
          <StatCard>
            <div className="num">FE</div>
            <div className="label">Role</div>
          </StatCard>
          <StatCard>
            <div className="num">2</div>
            <div className="label">Companies</div>
          </StatCard>
        </StatGrid>
      </AboutGrid>
    </Section>
  );
}
