'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import type { AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (usuario: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar sessão atual
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const u = await res.json()
          setUser(u)
        } else {
          setUser(null)
        }
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    loadSession()
  }, [])

  const login = async (usuario: string, senha: string) => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim().toLowerCase(), senha })
      })
      if (!res.ok) {
        let msg = 'Falha ao autenticar'
        try {
          const err = await res.json()
          msg = err?.error || msg
        } catch {
          const text = await res.text()
          msg = text || msg
        }
        toast.error(msg)
        throw new Error(msg)
      }
      const me = await fetch('/api/auth/me')
      if (me.ok) setUser(await me.json())
      toast.success('Login realizado com sucesso!')
    } catch (error: any) {
      if (error?.message) console.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      toast.success('Logout realizado com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer logout')
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}