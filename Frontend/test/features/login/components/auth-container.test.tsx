import { AuthContainer } from '@/features/login/components/auth-container';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('AuthContainer', () => {
  it('should render with the provided title', () => {
    const testTitle = 'Login Form';
    render(<AuthContainer title={testTitle}>Test Content</AuthContainer>);

    expect(screen.getByRole('heading')).toHaveTextContent(testTitle);
  });

  it('should render children content', () => {
    const childContent = 'Form Fields Go Here';
    render(
      <AuthContainer title='Test Title'>
        <div data-testid='child-content'>{childContent}</div>
      </AuthContainer>,
    );

    const childElement = screen.getByTestId('child-content');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent(childContent);
  });

  it('should have correct styling classes', () => {
    const { container } = render(
      <AuthContainer title='Test'>Content</AuthContainer>,
    );

    // Outer container
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toHaveClass('bg-primary');
    expect(outerContainer).toHaveClass('flex');
    expect(outerContainer).toHaveClass('min-h-screen');
    expect(outerContainer).toHaveClass('items-center');
    expect(outerContainer).toHaveClass('justify-center');

    // Inner container
    const innerContainer = outerContainer.firstChild as HTMLElement;
    expect(innerContainer).toHaveClass('w-full');
    expect(innerContainer).toHaveClass('max-w-md');
    expect(innerContainer).toHaveClass('space-y-8');
    expect(innerContainer).toHaveClass('rounded-xl');
    expect(innerContainer).toHaveClass('bg-white');
    expect(innerContainer).toHaveClass('p-8');
    expect(innerContainer).toHaveClass('shadow-lg');
  });
});
