import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessagesList } from '../../../../src/features/chat/components/messages';

// Mock date-fns to control time formatting
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'HH:mm') {
      return '14:30'; // Mock time for consistent testing
    }
    return '';
  }),
}));

describe('MessagesList', () => {
  // Sample messages for testing
  const sampleMessages = [
    {
      senderId: '123',
      senderName: 'Current User',
      content: 'Hello there!',
      timestamp: '2023-01-01T14:30:00Z',
    },
    {
      senderId: '456',
      senderName: 'Other User',
      content: 'Hi, how are you?',
      timestamp: '2023-01-01T14:31:00Z',
    },
    {
      senderId: '123',
      senderName: 'Current User',
      content: 'I am doing great, thanks!',
      timestamp: '2023-01-01T14:32:00Z',
    },
  ];

  const currentUserId = '123';

  // Mock scrollTo functionality
  const scrollToMock = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock scrollTo
    Element.prototype.scrollTo = scrollToMock;
  });

  it('renders messages correctly', () => {
    // Arrange & Act
    render(<MessagesList messages={sampleMessages} userId={currentUserId} />);

    // Assert
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByText('Hi, how are you?')).toBeInTheDocument();
    expect(screen.getByText('I am doing great, thanks!')).toBeInTheDocument();
  });

  it('differentiates between current user and other user messages', () => {
    // Arrange & Act
    const { container } = render(
      <MessagesList messages={sampleMessages} userId={currentUserId} />,
    );

    // Assert - look for "You" which should appear for current user messages
    const youLabels = screen.getAllByText('You');
    expect(youLabels).toHaveLength(4); // Four messages from current user

    // Check for other user's name
    expect(screen.getByText('Other User')).toBeInTheDocument();

    // Check for correct styling - current user messages have different styling
    const messageContainers = container.querySelectorAll(
      '[class*="flex flex-col space-y-1"]',
    );

    // First message - from current user - should be aligned to the end
    expect(messageContainers[0]).toHaveClass('items-end');

    // Second message - from other user - should be aligned to the start
    expect(messageContainers[1]).toHaveClass('items-start');
  });

  it('scrolls to bottom when messages change', () => {
    // Arrange & Act
    render(<MessagesList messages={sampleMessages} userId={currentUserId} />);

    // Assert
    expect(scrollToMock).toHaveBeenCalledTimes(1);
    expect(scrollToMock).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: 'smooth',
    });
  });

  it('displays timestamps correctly', () => {
    // Arrange & Act
    render(<MessagesList messages={sampleMessages} userId={currentUserId} />);

    // Assert - all messages should have the mocked time
    const timestamps = screen.getAllByText('14:30');
    expect(timestamps).toHaveLength(3);
  });

  it('renders avatars for other users but not for the current user', () => {
    // Arrange & Act
    render(<MessagesList messages={sampleMessages} userId={currentUserId} />);

    // Assert
    // Find the first letter of the other user's name in their avatar
    expect(screen.getByText('O')).toBeInTheDocument();

    // Current user has "You" in their avatar
    const currentUserAvatars = screen.getAllByText('You');
    expect(currentUserAvatars.length).toBeGreaterThan(0);
  });

  it('handles empty messages array', () => {
    // Arrange & Act
    const { container } = render(
      <MessagesList messages={[]} userId={currentUserId} />,
    );

    // Assert
    const messageList = container.querySelector('[aria-live="polite"]');
    expect(messageList).toBeInTheDocument();
    expect(messageList?.children.length).toBe(0);
  });
});
