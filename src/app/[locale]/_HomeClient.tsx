'use client';

import { useState, useEffect } from 'react';
import SiteHeader from '@/components/header/SiteHeader';
import CataloguePage from '@/components/catalogue/CataloguePage';
import { supabase } from '@/lib/supabase';

export default function HomeClient({ locale }: { locale: string }) {
  const [user, setUser]         = useState<{ id: string; email: string } | null>(null);
  const [authOpen, setAuthOpen]   = useState(false);
  const [dashOpen, setDashOpen]   = useState(false);
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
    <main className="min-h-screen" style={{ background: 'var(--parch)' }}>
      <SiteHeader
        locale={locale}
        user={user}
        onAuthOpen={() => setAuthOpen(true)}
        onDashOpen={() => setDashOpen(true)}
        onAdminOpen={() => setAdminOpen(true)}
      />
      <CataloguePage
        locale={locale}
        user={user}
        authOpen={authOpen}
        dashOpen={dashOpen}
        adminOpen={adminOpen}
        setAuthOpen={setAuthOpen}
        setDashOpen={setDashOpen}
        setAdminOpen={setAdminOpen}
      />
    </main>
  );
}
