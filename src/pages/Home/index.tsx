import { useNavigate } from 'react-router-dom';
import { HomeCard } from '../../components/HomeCard';
import { Container } from './styles';

export const Home = () => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate('/invitation');
    };

    return (
        <Container>
            <HomeCard
                title="초대장이 도착했습니다."
                buttonText="보러가기"
                onClick={handleNavigate}
            />
            {/* <HomeCard
                title="초대장 컴포넌트2"
                buttonText="보러가기"
                onClick={handleNavigate}
            /> */}
        </Container>
    );
};
