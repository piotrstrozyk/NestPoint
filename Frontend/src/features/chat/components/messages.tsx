import { format } from 'date-fns';
import { FC, useEffect, useRef } from 'react';

interface Message {
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  timestamp: string;
}

interface MessagesListProps {
  messages: Message[];
  userId: string;
}

export const MessagesList: FC<MessagesListProps> = ({ messages, userId }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const ordered = [...messages];

  return (
    <div
      ref={listRef}
      className='flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto bg-white p-4 dark:bg-[#353435]'
      aria-live='polite'
    >
      {ordered.map((m, idx) => {
        const isMe = m.senderId === userId;
        return (
          <div
            key={idx}
            className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <div className='mr-2 flex-shrink-0'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-200'>
                    {m.senderName.charAt(0)}
                  </div>
                </div>
              )}

              <div
                className={`max-w-prose transform rounded-2xl px-4 py-2 whitespace-pre-wrap shadow transition-transform hover:-translate-y-0.5 focus:ring-2 focus:ring-sky-400 focus:outline-none ${
                  isMe
                    ? 'ml-2 justify-end bg-sky-300 text-white dark:bg-[#b93242]'
                    : 'mr-2 bg-gray-200 text-blue-900 dark:bg-gray-700 dark:text-gray-100'
                }`}
                tabIndex={0}
              >
                <div className='text-xs font-semibold'>
                  {isMe ? 'You' : m.senderName}
                </div>
                <div className='mt-1'>{m.content}</div>
              </div>

              {isMe && (
                <div className='ml-2 flex-shrink-0'>
                  <div className='bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white'>
                    You
                  </div>
                </div>
              )}
            </div>

            <div className='ml-12 text-[10px] text-white opacity-75'>
              {format(new Date(m.timestamp), 'HH:mm')}
            </div>
          </div>
        );
      })}
    </div>
  );
};
