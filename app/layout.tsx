import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: 'Switch Code | Tech Education Platform',
  description: 'Empowering youth through certified training in programming, cybersecurity, and AI',
  keywords: ['coding', 'cybersecurity', 'AI', 'tech education', 'programming'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} font-sans`}>
        <ThemeProvider>
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
