import { useEffect, useState } from 'react';
import { supabase } from '../db/supabase';
import { AuthContext } from './authContextValue';

export { AuthContext } from './authContextValue';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!supabase) {
      Promise.resolve().then(() => setUser(null));
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = (email, password) =>
    supabase?.auth.signInWithPassword({ email, password }) ?? Promise.resolve({ error: { message: 'Supabase no configurado' } });

  const signUpWithEmail = (email, password) =>
    supabase?.auth.signUp({ email, password }) ?? Promise.resolve({ error: { message: 'Supabase no configurado' } });

  const signInWithGoogle = () =>
    supabase?.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });

  const signOut = () => supabase?.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
