import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isCheckingAuth: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setHydrated: (state: boolean) => void;
  setCheckingAuth: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,
      isCheckingAuth: true,
      login: (token, user) => set({ token, user, isAuthenticated: true, isCheckingAuth: false }),
      logout: () => set({ token: null, user: null, isAuthenticated: false, isCheckingAuth: false }),
      setHydrated: (state: boolean) => set({ isHydrated: state }),
      setCheckingAuth: (state: boolean) => set({ isCheckingAuth: state }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user info, not the token
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
