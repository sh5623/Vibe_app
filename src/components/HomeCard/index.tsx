import { Card, Title, Button } from './styles';

interface HomeCardProps {
    title: React.ReactNode;
    buttonText: string;
    onClick: () => void;
}

export const HomeCard = ({ title, buttonText, onClick }: HomeCardProps) => {
    return (
        <Card>
            <Title>
                {title}
            </Title>
            <Button onClick={onClick}>
                {buttonText}
            </Button>
        </Card>
    );
};
