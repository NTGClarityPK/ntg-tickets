import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Organization } from '../types/unified';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setOrganization: (organization: Organization | null) => void;
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
      organization: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: user => set({ user, isAuthenticated: !!user }),
      setOrganization: organization => set({ organization }),
      updateUser: (updates: Partial<User>) => {
        const state = get();
        if (state.user) {
          set({ user: { ...state.user, ...updates } });
        }
      },
      setLoading: isLoading => set({ isLoading }),
      logout: () => {
        // Clear the state
        set({ user: null, organization: null, isAuthenticated: false });
        // Clear the persisted storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
      },
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
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks to prevent unnecessary re-renders
// Components should use these instead of accessing the store directly

/**
 * Selector hook for user. Only re-renders when user changes.
 * @example const user = useAuthUser();
 */
export const useAuthUser = () => useAuthStore(state => state.user);

/**
 * Selector hook for authentication status. Only re-renders when isAuthenticated changes.
 * @example const isAuthenticated = useAuthIsAuthenticated();
 */
export const useAuthIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);

/**
 * Selector hook for loading state. Only re-renders when isLoading changes.
 * @example const isLoading = useAuthIsLoading();
 */
export const useAuthIsLoading = () => useAuthStore(state => state.isLoading);

/**
 * Selector hook for user ID. Only re-renders when user ID changes.
 * @example const userId = useAuthUserId();
 */
export const useAuthUserId = () => useAuthStore(state => state.user?.id);

/**
 * Selector hook for user's active role. Only re-renders when activeRole changes.
 * @example const activeRole = useAuthActiveRole();
 */
export const useAuthActiveRole = () => useAuthStore(state => state.user?.activeRole);

/**
 * Selector hook for organization. Only re-renders when organization changes.
 * @example const organization = useAuthOrganization();
 */
export const useAuthOrganization = () => useAuthStore(state => state.organization);

/**
 * Selector hook for multiple auth values. Use when you need multiple values.
 * @example const { user, isAuthenticated } = useAuthState();
 */
export const useAuthState = () => useAuthStore(state => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
}));

/**
 * Selector hook for auth actions. Never causes re-renders (actions are stable).
 * @example const { setUser, logout } = useAuthActions();
 */
export const useAuthActions = () => useAuthStore(state => ({
  setUser: state.setUser,
  setOrganization: state.setOrganization,
  updateUser: state.updateUser,
  setLoading: state.setLoading,
  logout: state.logout,
  hasRole: state.hasRole,
  hasAnyRole: state.hasAnyRole,
}));