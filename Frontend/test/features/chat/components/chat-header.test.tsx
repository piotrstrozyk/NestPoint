import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChatHeader from '../../../../src/features/chat/components/chat-header';

// Mock the @headlessui/react components
vi.mock('@headlessui/react', () => ({
  DialogTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid='dialog-title' className={className}>
      {children}
    </div>
  ),
}));

describe('ChatHeader', () => {
  it('renders with the correct sender name', () => {
    // Arrange
    const senderName = 'John Doe';
    const onClose = vi.fn();

    // Act
    render(<ChatHeader senderName={senderName} onClose={onClose} />);

    // Assert
    expect(screen.getByText(`Chat with ${senderName}`)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    // Arrange
    const senderName = 'John Doe';
    const onClose = vi.fn();

    // Act
    render(<ChatHeader senderName={senderName} onClose={onClose} />);
    const closeButton = screen.getByRole('button');

    // Assert
    expect(closeButton).toBeInTheDocument();

    // Act
    fireEvent.click(closeButton);

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('applies the correct CSS classes for styling', () => {
    // Arrange
    const senderName = 'John Doe';
    const onClose = vi.fn();

    // Act
    const { container } = render(
      <ChatHeader senderName={senderName} onClose={onClose} />,
    );

    // Assert
    const headerDiv = container.firstChild;
    expect(headerDiv).toHaveClass('flex');
    expect(headerDiv).toHaveClass('items-center');
    expect(headerDiv).toHaveClass('justify-between');
    expect(headerDiv).toHaveClass('border-b');
    expect(headerDiv).toHaveClass('p-4');
  });
});
