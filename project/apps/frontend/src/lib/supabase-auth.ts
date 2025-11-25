import { supabase } from './supabase';
import { API_CONFIG } from './constants';

/**
 * Supabase Auth Service
 * This service handles authentication using Supabase Auth
 */

export interface SupabaseAuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    activeRole: string;
  };
  access_token: string;
  refresh_token: string;
}

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  roles: string[] = ['END_USER']
): Promise<SupabaseAuthResponse> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/supabase/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        roles,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Sign up failed');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<SupabaseAuthResponse> {
  try {
    // eslint-disable-next-line no-console
    console.log('[supabase-auth] signIn called with email:', email);
    // eslint-disable-next-line no-console
    console.log('[supabase-auth] API URL:', `${API_CONFIG.BASE_URL}/api/v1/auth/supabase/signin`);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/supabase/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    // eslint-disable-next-line no-console
    console.log('[supabase-auth] Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      // eslint-disable-next-line no-console
      console.error('[supabase-auth] Sign in failed:', error);
      throw new Error(error.message || 'Sign in failed');
    }

    const data = await response.json();
    // eslint-disable-next-line no-console
    console.log('[supabase-auth] Sign in success, data:', data);
    // eslint-disable-next-line no-console
    console.log('[supabase-auth] Data structure check:', {
      hasData: !!data.data,
      hasUser: !!data.data?.user,
      hasAccessToken: !!data.data?.access_token,
      hasRefreshToken: !!data.data?.refresh_token,
    });

    // Store tokens in localStorage for API calls (primary method)
    if (data.data?.access_token && data.data?.refresh_token) {
      // eslint-disable-next-line no-console
      console.log('[supabase-auth] Storing tokens in localStorage...');
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      // eslint-disable-next-line no-console
      console.log('[supabase-auth] Tokens stored in localStorage');
    }

    // Also try to set Supabase session (non-blocking, for Supabase client features)
    if (data.data?.access_token && data.data?.refresh_token) {
      // eslint-disable-next-line no-console
      console.log('[supabase-auth] Setting Supabase session (async)...');
      // Set session asynchronously without blocking
      supabase.auth.setSession({
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
      }).then(({ data: error }) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.warn('[supabase-auth] Error setting Supabase session (non-critical):', error);
        } else {
          // eslint-disable-next-line no-console
          console.log('[supabase-auth] Supabase session set successfully');
        }
      }).catch((sessionError) => {
        // eslint-disable-next-line no-console
        console.warn('[supabase-auth] Supabase session set failed (non-critical):', sessionError);
        // This is non-critical - we have tokens in localStorage for API calls
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn('[supabase-auth] No tokens in response data:', data);
    }

    // eslint-disable-next-line no-console
    console.log('[supabase-auth] Returning data:', data.data);
    return data.data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[supabase-auth] Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  try {
    // Get token from localStorage or Supabase session
    const localAccessToken = localStorage.getItem('access_token');
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = localAccessToken || session?.access_token;

    if (accessToken) {
      // Call backend to sign out
      try {
        await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/supabase/signout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Backend signout failed (non-critical):', error);
      }
    }

    // Clear localStorage tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Sign out from Supabase
    await supabase.auth.signOut();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Sign out error:', error);
    // Clear tokens anyway
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    throw error;
  }
}

/**
 * Refresh session
 */
export async function refreshSession(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string }> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/supabase/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh session');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Refresh session error:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      // eslint-disable-next-line no-console
      console.warn('No Supabase session found');
      return null;
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.data.session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // eslint-disable-next-line no-console
      console.error('Failed to get current user:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data.data) {
      // eslint-disable-next-line no-console
      console.warn('No user data in response:', data);
      return null;
    }
    
    return data.data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Request password reset
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/v1/auth/supabase/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send password reset email');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Reset password error:', error);
    throw error;
  }
}

