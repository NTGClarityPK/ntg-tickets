import { useCallback } from 'react';
import { authApi } from '../lib/apiClient';
import { supabase } from '../lib/supabase';

export function useTokenRefresh() {
  const refreshToken = useCallback(async () => {
    // Get refresh token from localStorage or Supabase session
    const localRefreshToken = localStorage.getItem('refresh_token');
    const { data: { session } } = await supabase.auth.getSession();
    const refreshTokenValue = localRefreshToken || session?.refresh_token;

    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authApi.refreshToken(refreshTokenValue);

      if (response.data?.data) {
        const { access_token, refresh_token } = response.data.data;

        // Store new tokens in localStorage
        localStorage.setItem('access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }

        // Update Supabase session
        if (session) {
          await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || refreshTokenValue,
          });
        }

        return { access_token, refresh_token };
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      throw error;
    }
  }, []);

  return { refreshToken };
}
