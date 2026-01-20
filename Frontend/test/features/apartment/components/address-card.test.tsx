import { MapCard } from '@/features/apartment/components/address-card';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock the dynamic import
vi.mock('next/dynamic', () => ({
  default: () => {
    const Component = (props: React.ComponentPropsWithoutRef<'div'>) => (
      <div data-testid='mocked-map' {...props} />
    );
    return Component;
  },
}));

// Mock the MapPlaceholder component
vi.mock('@/features/maps/components/map-placeholder', () => ({
  default: () => <div data-testid='map-placeholder'>Map Placeholder</div>,
}));

// Mock the icon
vi.mock('react-icons/fa', () => ({
  FaMapMarkerAlt: () => <div data-testid='map-icon'>Icon</div>,
}));

describe('MapCard', () => {
  const mockProps = {
    latitude: 52.229676,
    longitude: 21.012229,
    address: '123 Main St, Warsaw, Poland',
  };

  it('renders the address card with title', () => {
    render(<MapCard {...mockProps} />);

    // Check for heading
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByTestId('map-icon')).toBeInTheDocument();
  });

  it('renders the address text', () => {
    render(<MapCard {...mockProps} />);

    // Check for address
    expect(screen.getByText('123 Main St, Warsaw, Poland')).toBeInTheDocument();
  });

  it('renders the map when latitude and longitude are provided', () => {
    render(<MapCard {...mockProps} />);

    // Map should be rendered, not placeholder
    const map = screen.getByTestId('mocked-map');
    expect(map).toBeInTheDocument();
    expect(map).toHaveAttribute('address', '123 Main St, Warsaw, Poland');
    expect(map).toHaveAttribute('zoom', '18');

    // Placeholder should not be present
    expect(screen.queryByTestId('map-placeholder')).not.toBeInTheDocument();
  });

  it('renders the placeholder when latitude is null', () => {
    render(<MapCard {...mockProps} latitude={null} />);

    // Placeholder should be rendered, not map
    expect(screen.getByTestId('map-placeholder')).toBeInTheDocument();
    expect(screen.queryByTestId('mocked-map')).not.toBeInTheDocument();
  });

  it('renders the placeholder when longitude is null', () => {
    render(<MapCard {...mockProps} longitude={null} />);

    // Placeholder should be rendered, not map
    expect(screen.getByTestId('map-placeholder')).toBeInTheDocument();
    expect(screen.queryByTestId('mocked-map')).not.toBeInTheDocument();
  });

  it('renders the placeholder when both coordinates are null', () => {
    render(<MapCard {...mockProps} latitude={null} longitude={null} />);

    // Placeholder should be rendered, not map
    expect(screen.getByTestId('map-placeholder')).toBeInTheDocument();
    expect(screen.queryByTestId('mocked-map')).not.toBeInTheDocument();
  });

  it('ignores the photo prop if provided', () => {
    // This test verifies that the component doesn't break if the optional photo prop is provided
    render(<MapCard {...mockProps} photo='image.jpg' />);

    // Component should render normally
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Warsaw, Poland')).toBeInTheDocument();
  });
});
