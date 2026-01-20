import MapPlaceholder from '@/features/maps/components/map-placeholder';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MapPlaceholder', () => {
  it('renders the component without crashing', () => {
    const { container } = render(<MapPlaceholder />);
    expect(container).toBeTruthy();
  });

  it('displays a loading spinner', () => {
    render(<MapPlaceholder />);
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8', 'w-8', 'animate-spin', 'text-gray-500');
  });

  it('displays the loading text', () => {
    render(<MapPlaceholder />);
    const loadingText = screen.getByText('Loading map…');
    expect(loadingText).toBeInTheDocument();
    expect(loadingText).toHaveClass('ml-2', 'text-gray-500');
  });
});
