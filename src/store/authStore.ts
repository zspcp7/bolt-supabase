import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setSessionToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      sessionToken: null,

      setUser: (user: User | null) => set({ user }),
      setAuthenticated: (authenticated: boolean) => set({ isAuthenticated: authenticated }),
      setSessionToken: (token: string | null) => set({ sessionToken: token }),

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            // Fetch user profile
            const { data: profile } = await supabase
              .from('users')
              .select(`
                *,
                role:user_roles(*)
              `)
              .eq('id', data.user.id)
              .single();

            set({
              user: profile,
              isAuthenticated: true,
              sessionToken: data.session?.access_token || null,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message);
        }
      },

      signUp: async (email: string, password: string, userData = {}) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            // Create user profile
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                ...userData,
              })
              .select(`
                *,
                role:user_roles(*)
              `)
              .single();

            if (profileError) throw profileError;

            set({
              user: profile,
              isAuthenticated: true,
              sessionToken: data.session?.access_token || null,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message);
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          set({
            user: null,
            isAuthenticated: false,
            sessionToken: null,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message);
        }
      },

      updateUser: async (userData: Partial<User>) => {
        const { user } = get();
        if (!user) throw new Error('No user logged in');

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', user.id)
            .select(`
              *,
              role:user_roles(*)
            `)
            .single();

          if (error) throw error;

          set({
            user: data,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message);
        }
      },

      initialize: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select(`
                *,
                role:user_roles(*)
              `)
              .eq('id', session.user.id)
              .single();

            set({
              user: profile,
              isAuthenticated: true,
              sessionToken: session.access_token,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              sessionToken: null,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            sessionToken: null,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionToken: state.sessionToken,
      }),
    }
  )
);

// Listen to auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const { initialize } = useAuthStore.getState();
  
  if (event === 'SIGNED_OUT' || !session) {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      sessionToken: null,
      isLoading: false,
    });
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    await initialize();
  }
});