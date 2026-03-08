import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Default user credentials for this personal-use app
const DEFAULT_EMAIL = 'personal@newsintel.local';
const DEFAULT_PASSWORD = 'newsintel-personal-2026';

/**
 * Auto-authenticate hook for personal use.
 * Automatically signs in or creates a default user so the app works without a login screen.
 */
export function useAutoAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function autoAuth() {
      // Check if already logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        return;
      }

      // Try to sign in with default credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
      });

      if (signInData?.user) {
        setUser(signInData.user);
        setLoading(false);
        return;
      }

      // If user doesn't exist, create it
      if (signInError?.message?.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: DEFAULT_EMAIL,
          password: DEFAULT_PASSWORD,
        });

        if (signUpError) {
          console.error('Auto-auth signup failed:', signUpError);
          setLoading(false);
          return;
        }

        // With auto-confirm enabled, the user should be immediately signed in
        if (signUpData?.user) {
          // Sign in after signup
          const { data } = await supabase.auth.signInWithPassword({
            email: DEFAULT_EMAIL,
            password: DEFAULT_PASSWORD,
          });
          setUser(data?.user || null);
        }
      }

      setLoading(false);
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    autoAuth();

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
