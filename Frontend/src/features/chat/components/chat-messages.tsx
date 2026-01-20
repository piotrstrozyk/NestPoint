import { Message } from '@/features/chat/hooks/use-fetch-messages';
import { MessagesList } from './messages';

interface ChatMessagesProps {
  messages: Message[];
  userId: number;
  loading: boolean;
  error: Error | null;
}

export default function ChatMessages({
  messages,
  userId,
  loading,
  error,
}: ChatMessagesProps) {
  return (
    <>
      {/* Loading / Error */}
      {loading && (
        <p className='py-4 text-center text-gray-500 dark:text-gray-400'>
          Loading messages…
        </p>
      )}
      {error && (
        <p className='py-4 text-center text-red-500'>Failed to load chat.</p>
      )}

      {/* Messages List */}
      <MessagesList
        messages={messages.map((m) => ({
          ...m,
          senderId: String(m.senderId),
        }))}
        userId={String(userId)}
      />
    </>
  );
}
