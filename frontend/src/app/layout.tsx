import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/lib/context/AuthContext';

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-prompt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ticket Support MA',
  description: 'ระบบจัดการ Ticket Support',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className="font-prompt">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
