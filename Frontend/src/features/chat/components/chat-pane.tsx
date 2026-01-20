'use client';

import useFetchMessages, {
  Message as MsgType,
} from '@/features/chat/hooks/use-fetch-messages';
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Client, IMessage } from '@stomp/stompjs';
import { useSession } from 'next-auth/react';
import { Fragment, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import ChatHeader from './chat-header';
import ChatInput from './chat-input';
import ChatMessages from './chat-messages';

interface ChatPaneProps {
  conversationId: number;
  onClose: () => void;
  senderName: string;
}

export default function ChatPane({
  conversationId,
  onClose,
  senderName,
}: ChatPaneProps) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const userId = session?.user?.id as number;

  // Fetch existing messages
  const {
    messages: fetchedMessages,
    loading,
    error,
  } = useFetchMessages(conversationId, 0, 50, 'asc');

  // Combined state for fetched + real-time
  const [messages, setMessages] = useState<MsgType[]>([]);

  const [input, setInput] = useState('');
  const stompRef = useRef<Client | null>(null);
  const WS_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const orderedMessages = messages.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Merge fetched messages
  useEffect(() => {
    setMessages(fetchedMessages);
  }, [fetchedMessages]);

  // WebSocket real-time setup
  useEffect(() => {
    if (!token) return;

    const socket = new SockJS(`${WS_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: () => {},
      reconnectDelay: 5_000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/chat/${conversationId}`, (msg: IMessage) => {
        const m = JSON.parse(msg.body) as MsgType;
        if (m.senderId !== userId) {
          setMessages((prev) => [...prev, m]);
        }
      });
    };

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [conversationId, token, userId, WS_URL]);

  const sendMessage = (messageText?: string) => {
    const content = messageText || input;

    if (!content.trim() || !stompRef.current?.connected) return;

    const dto = { conversationId, senderId: userId, content: content.trim() };
    stompRef.current.publish({
      destination: `/app/chat/${conversationId}/send`,
      body: JSON.stringify(dto),
    });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        conversationId,
        senderId: userId,
        senderName: session?.user?.name ?? 'You',
        content: content.trim(),
        timestamp: new Date().toISOString(),
        currentUserSender: true,
        read: true,
      },
    ]);

    // Only clear the input state if we're using the internal input
    if (!messageText) {
      setInput('');
    }
  };

  return (
    <Transition appear show as={Fragment}>
      <Dialog
        open
        onClose={onClose}
        className='fixed inset-0 z-50 flex items-center justify-center'
      >
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-70'
          leave='ease-in duration-200'
          leaveFrom='opacity-70'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black/20' aria-hidden='true' />
        </TransitionChild>

        {/* Panel */}
        <TransitionChild
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0 scale-95'
          enterTo='opacity-100 scale-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100 scale-100'
          leaveTo='opacity-0 scale-95'
        >
          <DialogPanel className='dark:bg-primary relative flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-lg ring-0 focus:ring-2 focus:ring-blue-300 focus:outline-none'>
            <ChatHeader senderName={senderName} onClose={onClose} />

            <ChatMessages
              messages={orderedMessages}
              userId={userId}
              loading={loading}
              error={error}
            />

            <ChatInput onSendMessage={sendMessage} />
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}
