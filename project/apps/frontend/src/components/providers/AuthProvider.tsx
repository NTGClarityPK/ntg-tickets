'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useAuthActions } from '../../stores/useAuthStore';
import { UserRole } from '../../types/unified';
import { getCurrentUser } from '../../lib/supabase-auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthActions();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      setLoading(true);

      try {
        // Check if user is already in store (from signin page)
        const existingUser = useAuthStore.getState()?.user;
        
        // Check Supabase session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          // eslint-disable-next-line no-console
          console.error('Session error:', sessionError);
        }

        if (session && mounted) {
          // Get user data from backend
          try {
            const userData = await getCurrentUser();

            if (userData && mounted) {
              // Get current user from store to check if we should preserve activeRole
              const currentUser = useAuthStore.getState()?.user || existingUser;
              let activeRole = (userData.activeRole || userData.roles?.[0]) as UserRole;

              // Preserve the current activeRole from Zustand store if it's valid
              if (
                currentUser?.activeRole &&
                userData.roles?.includes(currentUser.activeRole)
              ) {
                activeRole = currentUser.activeRole;
              }

              setUser({
                id: userData.id,
                email: userData.email,
                name: userData.name,
                roles: (userData.roles || []) as UserRole[],
                activeRole: activeRole || 'END_USER',
                isActive: userData.isActive ?? true,
                avatar: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            } else if (mounted) {
              // User data not found, but we have a session
              if (existingUser) {
                // eslint-disable-next-line no-console
                console.warn('Session exists but user data fetch failed, keeping existing user');
                // Keep existing user, don't clear
              } else if (session.user) {
                // Fallback: create basic user from session if backend call failed
                // eslint-disable-next-line no-console
                console.warn('Session exists but user data fetch failed, using session user as fallback');
                const metadata = session.user.user_metadata || {};
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: metadata.name || session.user.email?.split('@')[0] || 'User',
                  roles: (metadata.roles || ['END_USER']) as UserRole[],
                  activeRole: (metadata.roles?.[0] || 'END_USER') as UserRole,
                  isActive: true,
                  avatar: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              } else {
                // eslint-disable-next-line no-console
                console.warn('Session exists but user data not found, clearing auth');
                setUser(null);
              }
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error fetching user data:', error);
            if (mounted) {
              // If we have an existing user from signin, keep it
              if (!existingUser) {
                setUser(null);
              }
            }
          }
        } else if (mounted) {
          // No session - check if user is already in store (from signin page)
          if (!existingUser) {
            setUser(null);
          }
          // If existingUser exists, keep it (might be from signin page)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Auth initialization error:', error);
        if (mounted) {
          // Don't clear user if it exists (might be from signin)
          const existingUser = useAuthStore.getState()?.user;
          if (!existingUser) {
            setUser(null);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        try {
          const userData = await getCurrentUser();
          if (userData) {
            const currentUser = useAuthStore.getState()?.user;
            let activeRole = (userData.activeRole || userData.roles[0]) as UserRole;

            if (
              currentUser?.activeRole &&
              userData.roles?.includes(currentUser.activeRole)
            ) {
              activeRole = currentUser.activeRole;
            }

            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              roles: userData.roles as UserRole[],
              activeRole: activeRole,
              isActive: true,
              avatar: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error fetching user after sign in:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  // Show loading state during initialization
  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
