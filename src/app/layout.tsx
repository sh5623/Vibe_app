import type { Metadata } from 'next';
import { Syne, IBM_Plex_Mono } from 'next/font/google';
import EmotionRegistry from '../lib/registry';
import { GlobalStyles } from '../styles/global';
import QueryProvider from '@/providers/QueryProvider';

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-mono',
});

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
    <html lang="ko" className={`${syne.variable} ${ibmPlexMono.variable}`}>
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

