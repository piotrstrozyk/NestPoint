import type { Account, Profile, Session, User } from 'next-auth';
import { AdapterUser } from 'next-auth/adapters';
import type { JWT } from 'next-auth/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authOptions } from '../../../../src/app/api/auth/auth-options';

type TestUser = User & { accessToken: string; role: string };
type TestJWT = JWT & { id: string; accessToken: string; role: string };

describe('authOptions', () => {
  describe('CredentialsProvider.authorize', () => {
    const OLD_ENV = process.env;
    const fakeUrl = 'https://fake.spring/login';
    let authorize: (credentials: Record<string, string>) => Promise<unknown>;

    beforeEach(() => {
      vi.resetAllMocks();
      process.env = { ...OLD_ENV, SPRING_LOGIN_URL: fakeUrl };
      const credsProvider = authOptions.providers[0] as ReturnType<
        typeof import('next-auth/providers/credentials').default
      >;
      authorize = credsProvider.options.authorize;
    });

    afterEach(() => {
      process.env = OLD_ENV;
    });

    it('returns user data on success', async () => {
      const userResponse = {
        userId: 'u1',
        username: 'bob',
        roles: ['admin'],
        token: 'tok123',
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => userResponse,
      });
      const result = await authorize({ username: 'bob', password: 'pw' });
      expect(result).toEqual({
        id: 'u1',
        name: 'bob',
        role: 'admin',
        accessToken: 'tok123',
      });
      expect(global.fetch).toHaveBeenCalledWith(fakeUrl, expect.any(Object));
    });

    it('throws on invalid credentials', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
      await expect(
        authorize({ username: 'bob', password: 'bad' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('callbacks.jwt', () => {
    it('copies user info to token if user is present', async () => {
      const token: TestJWT = { id: '', accessToken: '', role: '' };
      const user: TestUser = {
        id: 'u2',
        accessToken: 'tok2',
        role: 'user',
        name: 'test',
        email: null,
        image: null,
      };
      const updated = await authOptions.callbacks!.jwt!({
        token,
        user,
        account: null,
        trigger: undefined,
        session: undefined,
      });
      expect(updated).toMatchObject({
        id: 'u2',
        accessToken: 'tok2',
        role: 'user',
      });
    });
    it('returns token unchanged if no user', async () => {
      const token: TestJWT = { id: 'x', accessToken: 'tokx', role: 'guest' };
      const updated = await authOptions.callbacks!.jwt!({
        token,
        account: null,
      } as {
        token: JWT;
        user: User | AdapterUser;
        account: Account | null;
        profile?: Profile | undefined;
        trigger?: 'signIn' | 'signUp' | 'update' | undefined;
        isNewUser?: boolean | undefined;
        session?: Session | undefined;
      });
      expect(updated).toBe(token);
    });
  });

  describe('callbacks.session', () => {
    it('copies token info to session', async () => {
      const token: TestJWT = { id: 'u3', accessToken: 'tok3', role: 'admin' };
      const session: Session & { accessToken?: string } = {
        user: { id: '', name: 'alice', role: undefined },
        expires: '',
      };
      const updated = (await authOptions.callbacks!.session!({
        session,
        token,
      } as { session: Session; token: JWT; user: AdapterUser } & {
        newSession: Session;
        trigger: 'update';
      })) as Session & { accessToken?: string };
      expect(updated.user).toMatchObject({ id: 'u3', role: 'admin' });
      expect(updated.accessToken).toBe('tok3');
    });
  });
});
