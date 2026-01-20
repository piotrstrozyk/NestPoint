import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChatMessages from '../../../../src/features/chat/components/chat-messages';
import { Message } from '../../../../src/features/chat/hooks/use-fetch-messages';

// Mock the MessagesList component
vi.mock('../../../../src/features/chat/components/messages', () => ({
  MessagesList: vi.fn(({ messages, userId }) => (
    <div
      data-testid='messages-list'
      data-messages={JSON.stringify(messages)}
      data-userid={userId}
    >
      Messages List
    </div>
  )),
}));

describe('ChatMessages', () => {
  const mockMessages: Message[] = [
    {
      id: 1,
      content: 'Hello',
      senderId: 123,
      conversationId: 1,
      senderName: 'Alice',
      timestamp: new Date().toISOString(),
      currentUserSender: true,
      read: true,
    },
    {
      id: 2,
      content: 'Hi there',
      senderId: 456,
      conversationId: 1,
      senderName: 'Bob',
      timestamp: new Date().toISOString(),
      currentUserSender: false,
      read: false,
    },
  ];

  it('shows loading message when loading is true', () => {
    // Arrange & Act
    render(
      <ChatMessages messages={[]} userId={123} loading={true} error={null} />,
    );

    // Assert
    expect(screen.getByText('Loading messages…')).toBeInTheDocument();
  });

  it('shows error message when error is present', () => {
    // Arrange & Act
    render(
      <ChatMessages
        messages={[]}
        userId={123}
        loading={false}
        error={new Error('Failed to load')}
      />,
    );

    // Assert
    expect(screen.getByText('Failed to load chat.')).toBeInTheDocument();
  });

  it('renders MessagesList with correctly formatted props', () => {
    // Arrange & Act
    render(
      <ChatMessages
        messages={mockMessages}
        userId={123}
        loading={false}
        error={null}
      />,
    );

    // Assert
    const messagesList = screen.getByTestId('messages-list');

    // Check that userId is passed as string
    expect(messagesList).toHaveAttribute('data-userid', '123');

    // Check that messages are passed with senderId converted to string
    const passedMessages = JSON.parse(
      messagesList.getAttribute('data-messages') || '[]',
    );
    expect(passedMessages).toHaveLength(2);
    expect(passedMessages[0].senderId).toBe('123');
    expect(passedMessages[1].senderId).toBe('456');
  });

  it('does not show loading or error when they are not present', () => {
    // Arrange & Act
    render(
      <ChatMessages
        messages={mockMessages}
        userId={123}
        loading={false}
        error={null}
      />,
    );

    // Assert
    expect(screen.queryByText('Loading messages…')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed to load chat.')).not.toBeInTheDocument();
  });

  it('shows both MessagesList and loading state when loading', () => {
    // Arrange & Act
    render(
      <ChatMessages
        messages={mockMessages}
        userId={123}
        loading={true}
        error={null}
      />,
    );

    // Assert
    expect(screen.getByText('Loading messages…')).toBeInTheDocument();
    expect(screen.getByTestId('messages-list')).toBeInTheDocument();
  });
});
