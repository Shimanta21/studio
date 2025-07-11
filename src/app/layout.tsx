import type { Metadata } from 'next';
import './globals.css';
import { AppContextProvider } from '@/context/app-context';
import { Toaster } from '@/components/ui/toaster';
import { AuthWrapper } from '@/components/auth-wrapper';

export const metadata: Metadata = {
  title: 'StockPilot',
  description: 'Inventory Management System by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppContextProvider>
            <AuthWrapper>
              {children}
            </AuthWrapper>
            <Toaster />
        </AppContextProvider>
      </body>
    </html>
  );
}
