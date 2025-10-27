import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/unified';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: user => set({ user, isAuthenticated: !!user }),
      updateUser: (updates: Partial<User>) => {
        const state = get();
        if (state.user) {
          set({ user: { ...state.user, ...updates } });
        }
      },
      setLoading: isLoading => set({ isLoading }),
      logout: () => set({ user: null, isAuthenticated: false }),
      hasRole: (role: string): boolean => {
        const state = get();
        return state.user?.activeRole === role;
      },
      hasAnyRole: (roles: string[]): boolean => {
        const state = get();
        return state.user ? roles.includes(state.user.activeRole) : false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
