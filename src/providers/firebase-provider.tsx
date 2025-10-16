'use client';

import { ReactNode, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface FirebaseProviderProps {
  children: ReactNode;
}

function FirebaseAuthWrapper({ children }: FirebaseProviderProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  return (
    <AuthProvider>
      <FirebaseAuthWrapper>
        {children}
      </FirebaseAuthWrapper>
    </AuthProvider>
  );
}