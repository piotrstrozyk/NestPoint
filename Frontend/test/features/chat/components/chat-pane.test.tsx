import useFetchMessages from '@/features/chat/hooks/use-fetch-messages';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatPane from '../../../../src/features/chat/components/chat-pane';

// Mock dependencies
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      accessToken: 'mock-token',
      user: { id: 123, name: 'Test User' },
    },
  }),
}));

vi.mock('sockjs-client', () => ({
  default: vi.fn(() => ({
    // Mock SockJS implementation
  })),
}));

vi.mock('@stomp/stompjs', () => {
  const mockPublish = vi.fn();
  const mockSubscribe = vi.fn();
  const mockActivate = vi.fn();
  const mockDeactivate = vi.fn();

  return {
    Client: vi.fn(() => ({
      connected: true,
      activate: mockActivate,
      deactivate: mockDeactivate,
      publish: mockPublish,
      subscribe: mockSubscribe,
      onConnect: () => {},
    })),
  };
});

vi.mock('@/features/chat/hooks/use-fetch-messages', () => {
  const mockMessages = [
    {
      id: 1,
      conversationId: 999,
      senderId: 456,
      senderName: 'John Doe',
      content: 'Hello there',
      timestamp: '2023-01-01T12:00:00Z',
      currentUserSender: false,
      read: true,
    },
    {
      id: 2,
      conversationId: 999,
      senderId: 123,
      senderName: 'Test User',
      content: 'Hi, how are you?',
      timestamp: '2023-01-01T12:01:00Z',
      currentUserSender: true,
      read: true,
    },
  ];

  return {
    default: vi.fn(() => ({
      messages: mockMessages,
      loading: false,
      error: null,
    })),
  };
});

// Mock child components
vi.mock('../../../../src/features/chat/components/chat-header', () => ({
  default: vi.fn(({ senderName, onClose }) => (
    <div data-testid='chat-header'>
      <span>Chat with {senderName}</span>
      <button data-testid='close-button' onClick={onClose}>
        Close
      </button>
    </div>
  )),
}));

vi.mock('../../../../src/features/chat/components/chat-messages', () => ({
  default: vi.fn(({ messages, loading, error }) => (
    <div
      data-testid='chat-messages'
      data-messages={JSON.stringify(messages)}
      data-loading={loading}
      data-error={Boolean(error)}
    >
      {messages.map((m: { id: number; content: string }) => (
        <div key={m.id} data-testid={`message-${m.id}`}>
          {m.content}
        </div>
      ))}
    </div>
  )),
}));

vi.mock('../../../../src/features/chat/components/chat-input', () => ({
  default: vi.fn(({ onSendMessage }) => (
    <div data-testid='chat-input'>
      <input
        data-testid='message-input'
        type='text'
        onChange={(e) => e.target.value}
      />
      <button
        data-testid='send-button'
        onClick={() => onSendMessage('Test message')}
      >
        Send
      </button>
    </div>
  )),
}));

// Mock Headless UI components
vi.mock('@headlessui/react', () => ({
  Dialog: vi.fn(({ children, open }) =>
    open ? <div data-testid='dialog'>{children}</div> : null,
  ),
  DialogPanel: vi.fn(({ children }) => (
    <div data-testid='dialog-panel'>{children}</div>
  )),
  Transition: vi.fn(({ children, show }) => (show ? children : null)),
  TransitionChild: vi.fn(({ children }) => children),
}));

describe('ChatPane', () => {
  const mockConversationId = 999;
  const mockSenderName = 'John Doe';
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variable
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080';
  });

  it('renders the component with correct props', () => {
    // Arrange & Act
    render(
      <ChatPane
        conversationId={mockConversationId}
        onClose={mockOnClose}
        senderName={mockSenderName}
      />,
    );

    // Assert
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-panel')).toBeInTheDocument();
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
    expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('passes the correct sender name to ChatHeader', () => {
    // Arrange & Act
    render(
      <ChatPane
        conversationId={mockConversationId}
        onClose={mockOnClose}
        senderName={mockSenderName}
      />,
    );

    // Assert - John Doe should be the sender name passed as prop
    expect(screen.getByText(`Chat with ${mockSenderName}`)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    // Arrange
    render(
      <ChatPane
        conversationId={mockConversationId}
        onClose={mockOnClose}
        senderName={mockSenderName}
      />,
    );

    // Act
    fireEvent.click(screen.getByTestId('close-button'));

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('sends a message when the send button is clicked', async () => {
    // Arrange
    const { Client } = await import('@stomp/stompjs');
    const mockClient = new Client();

    render(
      <ChatPane
        conversationId={mockConversationId}
        onClose={mockOnClose}
        senderName={mockSenderName}
      />,
    );

    // Act
    fireEvent.click(screen.getByTestId('send-button'));

    // Assert
    await waitFor(() => {
      // Check if message list was updated with the new message
      const messagesElement = screen.getByTestId('chat-messages');
      const passedMessages = JSON.parse(
        messagesElement.getAttribute('data-messages') || '[]',
      );

      // There should be at least 3 messages now (2 initial + 1 new)
      expect(passedMessages.length).toBeGreaterThanOrEqual(3);

      // The last message should be our new message
      const lastMessage = passedMessages[passedMessages.length - 1];
      expect(lastMessage.content).toBe('Test message');
      expect(lastMessage.senderId).toBe(123); // User ID from mock session

      // Check if publish was called
      expect(mockClient.publish).toHaveBeenCalled();
    });
  });

  it('passes the correct loading and error states to ChatMessages', () => {
    // We need to reset the mock first
    vi.mocked(useFetchMessages).mockReset();

    // Then set up the mock for this specific test
    vi.mocked(useFetchMessages).mockReturnValue({
      messages: [],
      pageInfo: {
        pageNumber: 0,
        pageSize: 50,
        totalPages: 1,
        totalElements: 0,
        last: true,
        first: true,
      },
      loading: true,
      error: null,
    });

    // Act
    render(
      <ChatPane
        conversationId={mockConversationId}
        onClose={mockOnClose}
        senderName={mockSenderName}
      />,
    );

    // Assert
    expect(screen.getByTestId('chat-messages')).toHaveAttribute(
      'data-loading',
      'true',
    );
    expect(screen.getByTestId('chat-messages')).toHaveAttribute(
      'data-error',
      'false',
    );
  });

  it('subscribes to WebSocket messages and updates state when receiving messages', async () => {
    // Arrange
    const mockSubscribe = vi.fn();
    const mockMsg = {
      body: JSON.stringify({
        id: 3,
        conversationId: 999,
        senderId: 456, // Different from user ID (123)
        senderName: 'John Doe',
        content: 'New message from websocket',
        timestamp: '2023-01-01T12:05:00Z',
        currentUserSender: false,
        read: false,
      }),
    };

    // Create a mock for Client that captures the onConnect handler
    let capturedOnConnectHandler:
      | ((frame: { headers: Record<string, string> }) => void)
      | null = null;

    const stompModule = await import('@stomp/stompjs');
    type FrameType = { headers: Record<string, string> };
    vi.spyOn(stompModule, 'Client').mockImplementation(
      () =>
        ({
          // Required properties for Client mock
          brokerURL: '',
          stompVersions: {
            versions: ['1.2'],
            supportedVersions: () => '1.2',
            protocolVersions: () => ['1.2'],
          },
          webSocketFactory: () =>
            ({
              send: vi.fn(),
              close: vi.fn(),
              onopen: null,
              onclose: null,
              onerror: null,
              onmessage: null,
              readyState: 1,
              addEventListener: vi.fn(),
              removeEventListener: vi.fn(),
              dispatchEvent: vi.fn(),
            }) as unknown as import('@stomp/stompjs').IStompSocket,
          connectionTimeout: 0,
          reconnectDelay: 0,
          heartbeatIncoming: 0,
          heartbeatOutgoing: 0,
          forceBinaryWSFrames: false,
          appendMissingNULLonIncoming: false,
          splitLargeFrames: false,
          maxWebSocketChunkSize: 0,
          debug: () => {},
          beforeConnect: () => {},
          onUnhandledMessage: () => {},
          onUnhandledReceipt: () => {},
          onUnhandledFrame: () => {},
          onStompError: () => {},
          onWebSocketClose: () => {},
          onWebSocketError: () => {},
          connected: true,
          activate: vi.fn(() => {
            if (capturedOnConnectHandler) {
              capturedOnConnectHandler({ headers: {} });
            }
          }),
          deactivate: vi.fn(),
          publish: vi.fn(),
          subscribe: mockSubscribe.mockReturnValue({ id: 'sub-1' }),
          // Custom onConnect setter/getter
          set onConnect(handler: (frame: FrameType) => void) {
            capturedOnConnectHandler = handler;
          },
          get onConnect(): (frame: FrameType) => void {
            // Always return a function to satisfy the type
            return capturedOnConnectHandler ?? (() => {});
          },
        }) as unknown as import('@stomp/stompjs').Client,
    );

    // Act - render the component
    render(
      <ChatPane
        conversationId={mockConversationId}
        onClose={mockOnClose}
        senderName={mockSenderName}
      />,
    );

    // Wait for effects to run (which should call activate)
    await waitFor(() => {
      // Assert that subscribe was called with the correct topic
      expect(mockSubscribe).toHaveBeenCalledWith(
        `/topic/chat/${mockConversationId}`,
        expect.any(Function),
      );
    });

    // Get the subscription callback
    const subscriptionCallback = mockSubscribe.mock.calls[0][1];

    // Simulate receiving a message
    subscriptionCallback(mockMsg);

    // Check that the message was added to the list
    await waitFor(() => {
      const messagesElement = screen.getByTestId('chat-messages');
      const passedMessages = JSON.parse(
        messagesElement.getAttribute('data-messages') || '[]',
      ) as Array<{
        id: number;
        conversationId: number;
        senderId: number;
        senderName: string;
        content: string;
        timestamp: string;
        currentUserSender: boolean;
        read: boolean;
      }>;

      // Find the new message
      const newMessage = passedMessages.find((m) => m.id === 3);
      expect(newMessage).toBeDefined();
      expect(newMessage?.content).toBe('New message from websocket');
    });
  });

  it('handles PageInfo and pagination correctly', () => {
    // Reset the mock first
    vi.mocked(useFetchMessages).mockReset();

    // Then set up the mock for this specific test with the right return type
    vi.mocked(useFetchMessages).mockReturnValue({
      messages: [],
      pageInfo: {
        pageNumber: 0,
        pageSize: 50,
        totalPages: 2,
        totalElements: 75,
        last: false,
        first: true,
      },
      loading: false,
      error: null,
    });

    // Act
    render(
      <ChatPane
        conversationId={mockConversationId}
        onClose={mockOnClose}
        senderName={mockSenderName}
      />,
    );

    // Assert that the component doesn't crash with pagination data
    expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
  });

  it('sorts messages by timestamp', () => {
    // Reset the mock first
    vi.mocked(useFetchMessages).mockReset();

    // Create messages with out-of-order timestamps
    const unorderedMessages = [
      {
        id: 1,
        conversationId: 999,
        senderId: 456,
        senderName: 'John Doe',
        content: 'Message 2',
        timestamp: '2023-01-01T12:02:00Z', // Middle time
        currentUserSender: false,
        read: true,
      },
      {
        id: 2,
        conversationId: 999,
        senderId: 123,
        senderName: 'Test User',
        content: 'Message 3',
        timestamp: '2023-01-01T12:03:00Z', // Latest time
        currentUserSender: true,
        read: true,
      },
      {
        id: 3,
        conversationId: 999,
        senderId: 456,
        senderName: 'John Doe',
        content: 'Message 1',
        timestamp: '2023-01-01T12:01:00Z', // Earliest time
        currentUserSender: false,
        read: true,
      },
    ];

    // Set up the mock with unordered messages
    vi.mocked(useFetchMessages).mockReturnValue({
      messages: unorderedMessages,
      pageInfo: {
        pageNumber: 0,
        pageSize: 50,
        totalPages: 1,
        totalElements: 3,
        last: true,
        first: true,
      },
      loading: false,
      error: null,
    });

    // Act
    render(
      <ChatPane
        conversationId={mockConversationId}
        onClose={mockOnClose}
        senderName={mockSenderName}
      />,
    );

    // Assert
    const messagesElement = screen.getByTestId('chat-messages');
    const passedMessages = JSON.parse(
      messagesElement.getAttribute('data-messages') || '[]',
    );

    // Check if messages are sorted by timestamp
    expect(passedMessages).toHaveLength(3);
    expect(new Date(passedMessages[0].timestamp).getTime()).toBeLessThan(
      new Date(passedMessages[1].timestamp).getTime(),
    );
    expect(new Date(passedMessages[1].timestamp).getTime()).toBeLessThan(
      new Date(passedMessages[2].timestamp).getTime(),
    );

    // Check content in order
    expect(passedMessages[0].content).toBe('Message 1');
    expect(passedMessages[1].content).toBe('Message 2');
    expect(passedMessages[2].content).toBe('Message 3');
  });
});
