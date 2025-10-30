import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import { authApi } from '../lib/apiClient';

export function useTokenRefresh() {
  const { data: session, update } = useSession();

  const refreshToken = useCallback(async () => {
    if (!session?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authApi.refreshToken(session.refreshToken);

      if (response.data?.data) {
        const { access_token, refresh_token } = response.data.data;

        // Update the session with new tokens
        await update({
          ...session,
          accessToken: access_token,
          refreshToken: refresh_token,
        });

        return { access_token, refresh_token };
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      throw error;
    }
  }, [session, update]);

  return { refreshToken };
}
