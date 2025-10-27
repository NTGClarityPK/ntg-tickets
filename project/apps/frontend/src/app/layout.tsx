import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '../components/providers/Providers';
import { ConditionalLayout } from '@/components/layouts/ConditionalLayout';
import { LanguageDetector } from '../components/language/LanguageDetector';
import { RTLProvider } from '../components/providers/RTLProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NTG Ticket',
  description: 'IT Support - Ticket Management System',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
};

type Props = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: Props) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html dir='auto' lang='en'>
      <body className={inter.className}>
        <LanguageDetector />
        <NextIntlClientProvider messages={messages}>
          <RTLProvider>
            <Providers>
              <ConditionalLayout>{children}</ConditionalLayout>
            </Providers>
          </RTLProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
