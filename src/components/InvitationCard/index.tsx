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
                <DetailText className="location">안토 우디플레이트</DetailText>
            </Section>
        </Card>
    );
};
