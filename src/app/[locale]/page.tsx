// v2.0
'use client';

import { useState, useEffect } from 'react';
import SiteHeader from '@/components/header/SiteHeader';
import CataloguePage from '@/components/catalogue/CataloguePage';
import { supabase } from '@/lib/supabase';

export default function Home({ params: { locale } }: { params: { locale: string } }) {
  const [user, setUser]         = useState<{ id: string; email: string } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);

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
      />
      <CataloguePage
        locale={locale}
        user={user}
        authOpen={authOpen}
        dashOpen={dashOpen}
        setAuthOpen={setAuthOpen}
        setDashOpen={setDashOpen}
      />
    </main>
  );
}
