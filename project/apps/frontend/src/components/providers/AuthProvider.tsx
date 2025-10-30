'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '../../stores/useAuthStore';
import { UserRole } from '../../types/unified';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
    } else if (status === 'authenticated' && session?.user) {
      try {
        // Validate required fields
        if (
          !session.user.id ||
          !session.user.email ||
          !session.user.name ||
          !session.user.activeRole
        ) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Get current user from store to check if we should preserve activeRole
        const currentUser = useAuthStore.getState().user;
        let activeRole = session.user.activeRole as UserRole;

        // Preserve the current activeRole from Zustand store if it's valid
        // This prevents the AuthProvider from overriding role switches
        if (
          currentUser?.activeRole &&
          session.user.roles?.includes(currentUser.activeRole)
        ) {
          activeRole = currentUser.activeRole;
        }

        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          roles: session.user.roles as UserRole[],
          activeRole: activeRole,
          isActive: true,
          avatar: session.user.image || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setLoading(false);
      } catch (error) {
        setUser(null);
        setLoading(false);
      }
    } else if (status === 'unauthenticated') {
      setUser(null);
      setLoading(false);
    }
  }, [session, status, setUser, setLoading]);

  return <>{children}</>;
}
