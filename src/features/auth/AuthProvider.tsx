import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/shared/api/supabase';
import { mapAuthError } from './lib/authErrors';
import { normalizeDisplayName, normalizeEmail } from './lib/validation';

export interface AuthResult {
  error?: string;
  needsConfirmation?: boolean;
}

export interface SignUpInput {
  displayName: string;
  email: string;
  password: string;
}

export interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  displayName: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED: AuthResult = { error: 'La configuración de Supabase está pendiente.' };

function readDisplayName(user: User | null): string | null {
  const value: unknown = user?.user_metadata?.display_name;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password });
      return error ? { error: mapAuthError(error) } : {};
    } catch (error) {
      return { error: mapAuthError(error) };
    }
  }, []);

  const signUp = useCallback(async ({ displayName, email, password }: SignUpInput): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: { data: { display_name: normalizeDisplayName(displayName) } },
      });
      if (error) return { error: mapAuthError(error) };
      return data.session ? {} : { needsConfirmation: true };
    } catch (error) {
      return { error: mapAuthError(error) };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const user = session?.user ?? null;
  const value = useMemo<AuthContextValue>(
    () => ({
      configured: supabase !== null,
      loading,
      session,
      user,
      displayName: readDisplayName(user),
      signIn,
      signUp,
      signOut,
    }),
    [loading, session, user, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
