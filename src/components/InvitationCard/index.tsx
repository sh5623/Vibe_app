import { Card, Header, ImageContainer, Section, InvitationTitle, DetailText, Divider } from './styles';
import dohaImage from '../../assets/doha.jpg';

export const InvitationCard = () => {
    return (
        <Card>
            <Header>도하의 첫번째 생일</Header>

            <ImageContainer>
                <img src={dohaImage} alt="도하의 사진" />
            </ImageContainer>

            <Section>
                <InvitationTitle>Invitation</InvitationTitle>
                <Divider />
                <DetailText className="date">2026년 2월 4일(수) 오후 12시</DetailText>
                <DetailText className="location">
                    안토 우디플레이트 <a href="https://map.naver.com/p/entry/place/1428814911?c=15.00,0,0,0,dh&placePath=/home?from=map&fromPanelNum=1&additionalHeight=76&timestamp=202602032108&locale=ko&svcName=map_pcv5" target="_blank" rel="noopener noreferrer">(약도보기)</a>
                </DetailText>
            </Section>
        </Card>
    );
};
