import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { KEYS, read, remove, write } from '@/lib/storage';

/**
 * Stands in for TRD §8.2 — a signed, HTTP-only session cookie issued by
 * POST /api/v1/admin/login. A browser cannot set an HttpOnly cookie on itself,
 * so this frontend keeps a flag in localStorage instead and the real cookie
 * replaces it when the backend lands. It is deliberately not dressed up as
 * security: there is no secret here to protect.
 */

interface Session { name: string; role: 'owner' | 'staff'; at: string }

interface AdminAuth {
  session: Session | null;
  signIn: (s: Session) => void;
  signOut: () => void;
}

const Ctx = createContext<AdminAuth | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    read<Session | null>(KEYS.adminSession, null));

  const signIn = useCallback((s: Session) => { setSession(s); write(KEYS.adminSession, s); }, []);
  const signOut = useCallback(() => { setSession(null); remove(KEYS.adminSession); }, []);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth(): AdminAuth {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session } = useAdminAuth();
  const loc = useLocation();
  if (!session) return <Navigate to="/admin" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}
