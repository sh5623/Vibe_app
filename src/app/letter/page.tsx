'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Container, Paper, ToSection, ContentSection, FromSection } from './styles';

export default function LetterPage() {
    const router = useRouter();

    return (
        <Container>
            <Paper>
                <ToSection>
                    To. 사랑하는 아람이에게
                </ToSection>

                <ContentSection>
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
                </ContentSection>

                <FromSection>
                    From. 승호가
                </FromSection>

            </Paper>
        </Container>
    );
}
