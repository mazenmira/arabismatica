'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import AuthModal from '@/components/auth/AuthModal';
import Dashboard from '@/components/dashboard/Dashboard';
import AdminPanel from '@/components/catalogue/AdminPanel';

const ADMIN_UUID = 'c26b0742-6283-4707-93ec-d617fc809863';

interface AuthContextValue {
  user: { id: string; email: string } | null;
  isAdmin: boolean;
  setAuthOpen: (v: boolean) => void;
  setDashOpen:  (v: boolean) => void;
  setAdminOpen: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  setAuthOpen:  () => {},
  setDashOpen:  () => {},
  setAdminOpen: () => {},
});

export function AuthProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [user,      setUser]      = useState<{ id: string; email: string } | null>(null);
  const [authOpen,  setAuthOpen]  = useState(false);
  const [dashOpen,  setDashOpen]  = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser({ id: session.user.id, email: session.user.email ?? '' });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.id === ADMIN_UUID,
      setAuthOpen,
      setDashOpen,
      setAdminOpen,
    }}>
      {children}

      {authOpen && (
        <AuthModal
          locale={locale}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => setAuthOpen(false)}
        />
      )}
      {dashOpen && user && (
        <Dashboard
          locale={locale}
          userId={user.id}
          userEmail={user.email}
          onClose={() => setDashOpen(false)}
          onSignOut={async () => { await supabase.auth.signOut(); setDashOpen(false); }}
        />
      )}
      {adminOpen && user?.id === ADMIN_UUID && (
        <AdminPanel
          locale={locale}
          onClose={() => setAdminOpen(false)}
        />
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
