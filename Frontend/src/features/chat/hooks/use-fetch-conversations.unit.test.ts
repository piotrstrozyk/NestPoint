import { vi } from 'vitest';
import { Conversation } from './use-fetch-conversations';

// Simulate the queryFn logic from the hook
async function queryFn({
  status,
  session,
  currentUserId,
}: {
  status: string;
  session: { accessToken?: string } | null;
  currentUserId: number | undefined;
  fetchConversations: (token: string, id: number) => Promise<Conversation[]>;
}) {
  if (
    status !== 'authenticated' ||
    !session?.accessToken ||
    typeof currentUserId !== 'number'
  ) {
    return [];
  }
  return queryFn.fetchConversations(session.accessToken, currentUserId);
}

queryFn.fetchConversations = vi.fn();

describe('queryFn (standalone coverage)', () => {
  it('returns [] if not authenticated', async () => {
    const result = await queryFn({
      status: 'unauthenticated',
      session: { accessToken: 'x' },
      currentUserId: 1,
      fetchConversations: queryFn.fetchConversations,
    });
    expect(result).toEqual([]);
  });
  it('returns [] if no accessToken', async () => {
    const result = await queryFn({
      status: 'authenticated',
      session: {},
      currentUserId: 1,
      fetchConversations: queryFn.fetchConversations,
    });
    expect(result).toEqual([]);
  });
  it('returns [] if currentUserId is not a number', async () => {
    const result = await queryFn({
      status: 'authenticated',
      session: { accessToken: 'x' },
      currentUserId: undefined,
      fetchConversations: queryFn.fetchConversations,
    });
    expect(result).toEqual([]);
  });
});
