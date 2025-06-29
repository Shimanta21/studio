'use client';

import { useApp } from '@/context/app-context';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, appInitialized } = useApp();

  if (!appInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  // When not logged in, pages like /login will be rendered directly.
  // The context handles redirection from protected pages.
  return <>{children}</>;
}
