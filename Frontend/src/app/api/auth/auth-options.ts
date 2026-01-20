import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[next-auth] authorize() hit with:', credentials);
        console.log(
          '[next-auth] SPRING_LOGIN_URL =',
          process.env.SPRING_LOGIN_URL,
        );

        const res = await fetch(process.env.SPRING_LOGIN_URL!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: credentials?.username,
            password: credentials?.password,
          }),
        });

        console.log('[next-auth] Spring responded with status', res.status);

        if (!res.ok) {
          throw new Error('Invalid credentials');
        }
        const user = await res.json();
        return {
          id: user.userId,
          name: user.username,
          role: user.roles[0],
          accessToken: user.token,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.accessToken = token.accessToken;
      session.user.role = token.role;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
