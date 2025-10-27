// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      activeRole: 'END_USER' | 'SUPPORT_STAFF' | 'SUPPORT_MANAGER' | 'ADMIN';
      image?: string | null;
    };
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
    activeRole: 'END_USER' | 'SUPPORT_STAFF' | 'SUPPORT_MANAGER' | 'ADMIN';
    image?: string | null;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    roles: string[];
    activeRole: 'END_USER' | 'SUPPORT_STAFF' | 'SUPPORT_MANAGER' | 'ADMIN';
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
