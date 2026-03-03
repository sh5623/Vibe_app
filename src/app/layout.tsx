import type { Metadata } from 'next';
import EmotionRegistry from '../lib/registry';
import { GlobalStyles } from '../styles/global';
import QueryProvider from '@/providers/QueryProvider';

export const metadata: Metadata = {
    title: 'Vibe App',
    description: 'Special Invitation for you',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body>
                <QueryProvider>
                    <EmotionRegistry>
                        <GlobalStyles />
                        {children}
                    </EmotionRegistry>
                </QueryProvider>
            </body>
        </html>
    );
}
