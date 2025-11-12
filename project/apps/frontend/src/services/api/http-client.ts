import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { API_CONFIG } from '../../lib/constants';

/**
 * Base HTTP client with authentication interceptors
 * Handles token injection and automatic refresh on 401 errors
 */
export function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_CONFIG.BASE_URL}/api/v1`,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // First try to get token from localStorage (for role switches)
      const localAccessToken = localStorage.getItem('access_token');

      if (localAccessToken) {
        config.headers.Authorization = `Bearer ${localAccessToken}`;
      } else {
        // Fallback to NextAuth session
        const session = await getSession();

        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
      }

      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    response => {
      return response;
    },
    async error => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _isRefreshing?: boolean;
      };

      // Don't retry if this is already a refresh token request or if we've already retried
      const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
      if (
        isRefreshRequest ||
        originalRequest._retry ||
        originalRequest._isRefreshing
      ) {
        // If refresh token request failed, clear tokens and sign out
        if (isRefreshRequest && error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          await signOut({ callbackUrl: '/auth/signin' });
        }
        return Promise.reject(error);
      }

      if (error.response?.status === 401) {
        originalRequest._retry = true;

        try {
          // First try to get refresh token from localStorage
          const localRefreshToken = localStorage.getItem('refresh_token');

          if (localRefreshToken) {
            // Mark that we're refreshing to prevent recursive calls
            originalRequest._isRefreshing = true;

            // Try to refresh the token using localStorage token
            const refreshResponse = await axios.post(
              `${API_CONFIG.BASE_URL}/api/v1/auth/refresh`,
              { refresh_token: localRefreshToken }
            );

            if (refreshResponse.data?.data) {
              const { access_token, refresh_token } = refreshResponse.data.data;

              // Update localStorage with new tokens
              localStorage.setItem('access_token', access_token);
              if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token);
              }

              // Update the authorization header and retry the request
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
              originalRequest._isRefreshing = false;

              // Retry the original request
              return client(originalRequest);
            }
          } else {
            // Fallback to NextAuth session
            const session = await getSession();
            if (session?.refreshToken) {
              // Mark that we're refreshing to prevent recursive calls
              originalRequest._isRefreshing = true;

              // Try to refresh the token
              const refreshResponse = await axios.post(
                `${API_CONFIG.BASE_URL}/api/v1/auth/refresh`,
                { refresh_token: session.refreshToken }
              );

              if (refreshResponse.data?.data) {
                const { access_token } = refreshResponse.data.data;

                // Update the authorization header and retry the request
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                originalRequest._isRefreshing = false;

                // Retry the original request
                return client(originalRequest);
              }
            }
          }
        } catch (refreshError) {
          // If refresh fails, clear tokens and sign out the user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          await signOut({ callbackUrl: '/auth/signin' });
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

// Export singleton instance
export const httpClient = createHttpClient();


