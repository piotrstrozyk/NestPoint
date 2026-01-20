'use client';

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Fragment, useState } from 'react';
import useFetchConversations from '../hooks/use-fetch-conversations';
import ChatPane from './chat-pane';

type User = {
  id: number;
  firstName: string;
  lastName: string;
};

type Conversation = {
  id: number;
  tenant: User;
  owner: User;
  apartmentTitle: string;
  lastMessage?: {
    senderName: string;
    content: string;
    timestamp: string;
  };
  unreadCount: number;
};

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [activeSenderName, setActiveSenderName] = useState<string>('User');

  const { conversations, loading: isLoading, error } = useFetchConversations();

  const { data: session } = useSession();
  const userId = session?.user?.id as number;

  // Helper function to determine the other party's name in a conversation
  const getOtherPartyName = (conversation: Conversation) => {
    if (!userId) return 'User';

    // If current user is the tenant, the other party is the owner
    if (conversation.tenant.id === userId) {
      return `${conversation.owner.firstName} ${conversation.owner.lastName}`;
    }
    // If current user is the owner, the other party is the tenant
    else {
      return `${conversation.tenant.firstName} ${conversation.tenant.lastName}`;
    }
  };

  // Function to handle opening a conversation
  const openConversation = (convId: number) => {
    const conversation = conversations?.find((conv) => conv.id === convId);
    if (conversation) {
      setActiveSenderName(getOtherPartyName(conversation));
      setActiveConvId(convId);
    } else {
      setActiveSenderName('User');
      setActiveConvId(convId);
    }
  };

  return (
    <>
      {/* Envelope Button */}
      <button
        onClick={() => setIsOpen(true)}
        className='relative rounded-full p-2 transition hover:bg-gray-100'
        aria-label='Open chats'
      >
        <EnvelopeIcon className='h-6 w-6 text-gray-700' />
        {conversations?.some((c) => c.unreadCount > 0) && (
          <span className='absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500' />
        )}
      </button>

      {/* Conversations List Dialog */}
      <Transition show={isOpen && activeConvId == null} as={Fragment}>
        <Dialog
          as='div'
          className='fixed inset-0 z-50 overflow-y-auto'
          onClose={() => setIsOpen(false)}
        >
          <div className='min-h-screen px-4 text-center'>
            <TransitionChild
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0'
              enterTo='opacity-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-30'
              leaveTo='opacity-0'
            >
              <div className='fixed inset-0 bg-black/30' aria-hidden='true' />
            </TransitionChild>

            {/* Trick the browser into centering the modal contents. */}
            <span
              className='inline-block h-screen align-middle'
              aria-hidden='true'
            >
              &#8203;
            </span>

            <TransitionChild
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <DialogPanel className='bg-primary my-10 inline-block w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all'>
                <DialogTitle className='flex items-center justify-between text-lg font-semibold text-white'>
                  <span>Conversations</span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className='rounded-full p-1 transition hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                  >
                    <XMarkIcon className='h-5 w-5 text-gray-600' />
                  </button>
                </DialogTitle>

                <div className='mt-4'>
                  {isLoading && (
                    <p className='text-gray-500'>Loading conversations…</p>
                  )}
                  {error && (
                    <p className='text-sm text-red-500'>
                      Failed to load. Please try again.
                    </p>
                  )}
                  {!isLoading && !error && conversations?.length === 0 && (
                    <p className='text-gray-600'>No active conversations.</p>
                  )}

                  <ul className='mt-4 max-h-80 space-y-2 overflow-y-auto px-2'>
                    {conversations?.map((conv) => (
                      <li
                        key={conv.id}
                        onClick={() => openConversation(conv.id)}
                        className='flex cursor-pointer items-center justify-between rounded-lg bg-gray-50 p-3 transition hover:bg-gray-100'
                      >
                        <div>
                          <p className='font-medium text-gray-800'>
                            {conv.apartmentTitle}
                          </p>
                          {conv.lastMessage ? (
                            <>
                              <p className='max-w-xs truncate text-sm text-gray-600'>
                                <span className='font-semibold'>
                                  {conv.lastMessage.senderName}:
                                </span>{' '}
                                {conv.lastMessage.content}
                              </p>
                              <p className='text-xs text-gray-400'>
                                {formatDistanceToNow(
                                  new Date(conv.lastMessage.timestamp),
                                  { addSuffix: true },
                                )}
                              </p>
                            </>
                          ) : (
                            <p className='text-sm text-gray-400'>
                              No messages yet
                            </p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className='inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white'>
                            {conv.unreadCount}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Chat Pane Modal */}
      {activeConvId !== null && (
        <ChatPane
          conversationId={activeConvId}
          senderName={activeSenderName}
          onClose={() => setActiveConvId(null)}
        />
      )}
    </>
  );
}
