import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatButton from '../../../../src/features/chat/components/chat-button';
import ChatPane from '../../../../src/features/chat/components/chat-pane';
import * as useFetchConversationsModule from '../../../../src/features/chat/hooks/use-fetch-conversations';

// Mock dependencies
vi.mock('../../../../src/features/chat/components/chat-pane', () => ({
  default: vi.fn(() => <div data-testid='chat-pane'>Chat Pane Content</div>),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 301, // Owner ID to match the mock conversations
      },
    },
    status: 'authenticated',
  })),
}));

describe('ChatButton', () => {
  const mockConversations = [
    {
      id: 1,
      apartmentTitle: 'Nice Apartment',
      unreadCount: 2,
      rentalId: 101,
      tenant: {
        id: 201,
        name: 'John Doe',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
      },
      owner: {
        id: 301,
        name: 'Property Owner',
        username: 'propowner',
        firstName: 'Property',
        lastName: 'Owner',
      },
      createdAt: '2023-04-10T08:00:00Z',
      active: true,
      lastMessage: {
        id: 501,
        conversationId: 1,
        senderId: 201,
        senderName: 'John',
        content: 'Is this still available?',
        timestamp: '2023-04-15T10:30:00Z',
        currentUserSender: false,
        read: false,
      },
    },
    {
      id: 2,
      apartmentTitle: 'Downtown Loft',
      unreadCount: 0,
      rentalId: 102,
      tenant: {
        id: 202,
        name: 'Sarah Smith',
        username: 'sarahs',
        firstName: 'Sarah',
        lastName: 'Smith',
      },
      owner: {
        id: 301,
        name: 'Property Owner',
        username: 'propowner',
        firstName: 'Property',
        lastName: 'Owner',
      },
      createdAt: '2023-04-12T09:15:00Z',
      active: true,
      lastMessage: {
        id: 502,
        conversationId: 2,
        senderId: 202,
        senderName: 'Sarah',
        content: 'Thanks for the information',
        timestamp: '2023-04-14T15:45:00Z',
        currentUserSender: false,
        read: true,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useFetchConversationsModule, 'default').mockReturnValue({
      conversations: mockConversations,
      loading: false,
      error: null,
    });
  });

  it('renders the envelope button', () => {
    render(<ChatButton />);
    expect(screen.getByLabelText('Open chats')).toBeInTheDocument();
  });

  it('shows notification dot when there are unread messages', () => {
    render(<ChatButton />);
    const notificationDot = screen
      .getByRole('button', { name: 'Open chats' })
      .querySelector('span');
    expect(notificationDot).toBeInTheDocument();
  });

  it('does not show notification dot when there are no unread messages', () => {
    vi.spyOn(useFetchConversationsModule, 'default').mockReturnValue({
      conversations: [
        { ...mockConversations[0], unreadCount: 0 },
        { ...mockConversations[1], unreadCount: 0 },
      ],
      loading: false,
      error: null,
    });

    render(<ChatButton />);
    const button = screen.getByRole('button', { name: 'Open chats' });
    const notificationDot = button.querySelector('span');
    expect(notificationDot).not.toBeInTheDocument();
  });

  it('opens the conversations dialog when button is clicked', () => {
    render(<ChatButton />);

    // Initially dialog should not be visible
    expect(screen.queryByText('Conversations')).not.toBeInTheDocument();

    // Click the button
    fireEvent.click(screen.getByLabelText('Open chats'));

    // Dialog should be visible
    expect(screen.getByText('Conversations')).toBeInTheDocument();
  });

  it('shows loading state when fetching conversations', () => {
    vi.spyOn(useFetchConversationsModule, 'default').mockReturnValue({
      conversations: null,
      loading: true,
      error: null,
    });

    render(<ChatButton />);

    fireEvent.click(screen.getByLabelText('Open chats'));
    expect(screen.getByText('Loading conversations…')).toBeInTheDocument();
  });

  it('shows error message when fetching fails', () => {
    vi.spyOn(useFetchConversationsModule, 'default').mockReturnValue({
      conversations: null,
      loading: false,
      error: new Error('Failed to fetch'),
    });

    render(<ChatButton />);

    fireEvent.click(screen.getByLabelText('Open chats'));
    expect(
      screen.getByText('Failed to load. Please try again.'),
    ).toBeInTheDocument();
  });

  it('shows empty state message when no conversations exist', () => {
    vi.spyOn(useFetchConversationsModule, 'default').mockReturnValue({
      conversations: [],
      loading: false,
      error: null,
    });

    render(<ChatButton />);

    fireEvent.click(screen.getByLabelText('Open chats'));
    expect(screen.getByText('No active conversations.')).toBeInTheDocument();
  });

  it('displays the list of conversations', () => {
    render(<ChatButton />);

    fireEvent.click(screen.getByLabelText('Open chats'));

    expect(screen.getByText('Nice Apartment')).toBeInTheDocument();
    expect(screen.getByText('Downtown Loft')).toBeInTheDocument();
    expect(screen.getByText('John:')).toBeInTheDocument();
    expect(screen.getByText('Is this still available?')).toBeInTheDocument();
  });

  it('closes the conversations dialog when X button is clicked', () => {
    render(<ChatButton />);

    // Open the dialog
    fireEvent.click(screen.getByLabelText('Open chats'));
    expect(screen.getByText('Conversations')).toBeInTheDocument();

    // Click the close button
    const closeButton = screen.getByRole('button', {
      name: '',
    });
    fireEvent.click(closeButton);
  });

  it('closes the chat pane when onClose is called', async () => {
    render(<ChatButton />);

    // Open the dialog
    fireEvent.click(screen.getByLabelText('Open chats'));

    // Click on a conversation
    fireEvent.click(screen.getByText('Nice Apartment'));

    // Chat pane should be visible
    expect(screen.getByTestId('chat-pane')).toBeInTheDocument();

    // Get the onClose function that was passed to ChatPane
    const onCloseFunction = vi.mocked(ChatPane).mock.calls[0][0].onClose;

    // Call the onClose function
    onCloseFunction();

    // Dialog should be visible again
    await waitFor(() => {
      expect(screen.getByText('Conversations')).toBeInTheDocument();
    });
  });
});
