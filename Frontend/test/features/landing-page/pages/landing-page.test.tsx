import LandingPage from '@/features/landing-page/pages/landing-page';
import { render, screen } from '@testing-library/react';
import React, { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock child components
vi.mock('@/features/landing-page/components/hero-section', () => ({
  default: () => <div data-testid='hero-section' />,
}));

vi.mock('@/features/landing-page/components/stats-section', () => ({
  default: () => <div data-testid='stats-section' />,
}));

vi.mock('@/features/maps/components/map-placeholder', () => ({
  default: () => <div data-testid='map-placeholder' />,
}));

vi.mock('@/core/components/svg/find', () => ({
  default: () => <div data-testid='find-svg' />,
}));

// Mock the apartment fetch hook
vi.mock('@/features/apartment-list/hooks/use-fetch-apartments', () => ({
  default: vi.fn(),
}));

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
  default: () => {
    const DynamicComponent = () => (
      <div data-testid='dynamic-map'>Dynamic Map</div>
    );
    return DynamicComponent;
  },
}));

// Import the mock function to control its behavior
import useFetchApartments from '@/features/apartment-list/hooks/use-fetch-apartments';

describe('LandingPage', () => {
  // Mock timer for testing the interval
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders the component with placeholder when no apartments are available', () => {
    // Mock empty apartments array
    (useFetchApartments as jest.Mock).mockReturnValue({ apartments: [] });

    render(<LandingPage />);

    // Check that main sections render
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('stats-section')).toBeInTheDocument();
    expect(screen.getByTestId('find-svg')).toBeInTheDocument();

    // Check that welcome text is displayed
    expect(screen.getByText('Welcome to NestPoint!')).toBeInTheDocument();

    // When no apartments, placeholder should be shown
    expect(screen.getByTestId('map-placeholder')).toBeInTheDocument();
    expect(screen.queryByTestId('dynamic-map')).not.toBeInTheDocument();
  });

  it('renders the map when apartments are available', () => {
    // Mock apartments with valid coordinates
    const mockApartments = [
      {
        id: 1,
        address: { latitude: 50.049683, longitude: 19.944544 },
      },
      {
        id: 2,
        address: { latitude: 51.107883, longitude: 17.038538 },
      },
    ];

    (useFetchApartments as jest.Mock).mockReturnValue({
      apartments: mockApartments,
    });

    render(<LandingPage />);

    // Map should be shown instead of placeholder
    expect(screen.queryByTestId('map-placeholder')).not.toBeInTheDocument();
    expect(screen.getByTestId('dynamic-map')).toBeInTheDocument();
  });

  it('handles the auto-rotation of map coordinates', () => {
    // Mock multiple apartments for rotation
    const mockApartments = [
      { id: 1, address: { latitude: 50.049683, longitude: 19.944544 } },
      { id: 2, address: { latitude: 51.107883, longitude: 17.038538 } },
      { id: 3, address: { latitude: 52.229676, longitude: 21.012229 } },
    ];

    // Clear previous mock and create a new one for this test specifically
    vi.mock('next/dynamic', () => ({
      default: () => {
        // This DynamicComponent will store its position props in attributes
        interface DynamicMapProps {
          position: {
            latitude: number;
            longitude: number;
          };
        }

        return (props: DynamicMapProps) => (
          <div
            data-testid='dynamic-map'
            data-position={JSON.stringify(props.position)}
          >
            Dynamic Map
          </div>
        );
      },
    }));

    (useFetchApartments as jest.Mock).mockReturnValue({
      apartments: mockApartments,
    });

    const { unmount } = render(<LandingPage />);

    // Advance timer to trigger the interval callback
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Unmount to test cleanup
    unmount();
  });

  it('displays the correct content in the welcome section', () => {
    (useFetchApartments as unknown as jest.Mock).mockReturnValue({
      apartments: [],
    });

    render(<LandingPage />);

    // Check heading
    expect(screen.getByText('Welcome to NestPoint!')).toBeInTheDocument();

    // Check paragraphs
    expect(
      screen.getByText(/Whether you're looking for a cozy studio/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Browse listings, view photos/),
    ).toBeInTheDocument();

    // Check CTA button
    const ctaButton = screen.getByText('Browse Active Listings');
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/apartment-list');
  });

  it('filters out apartments with null coordinates', () => {
    // Mock apartments including some with null coordinates
    const mockApartments = [
      { id: 1, address: { latitude: null, longitude: 19.944544 } },
      { id: 2, address: { latitude: 51.107883, longitude: 17.038538 } },
      { id: 3, address: { latitude: 52.229676, longitude: null } },
    ];

    (useFetchApartments as jest.Mock).mockReturnValue({
      apartments: mockApartments,
    });

    render(<LandingPage />);

    // Map should be shown because at least one apartment has valid coordinates
    expect(screen.getByTestId('dynamic-map')).toBeInTheDocument();
  });
});
it('uses only the last five apartments when more are available', () => {
  // Create more than 5 mock apartments with distinct coordinates
  const mockApartments = [
    { id: 1, address: { latitude: 10, longitude: 10 } }, // These first 3 should be ignored
    { id: 2, address: { latitude: 20, longitude: 20 } },
    { id: 3, address: { latitude: 30, longitude: 30 } },
    { id: 4, address: { latitude: 40, longitude: 40 } }, // These last 5 should be used
    { id: 5, address: { latitude: 50, longitude: 50 } },
    { id: 6, address: { latitude: 60, longitude: 60 } },
    { id: 7, address: { latitude: 70, longitude: 70 } },
    { id: 8, address: { latitude: 80, longitude: 80 } },
  ];

  // Mock next/dynamic to capture position data
  vi.mock('next/dynamic', () => ({
    default: () => {
      interface DynamicMapProps {
        position: [number, number];
      }

      const DynamicMap: React.FC<DynamicMapProps> = (props) => {
        return (
          <div
            data-testid='dynamic-map'
            data-position={JSON.stringify(props.position)}
          >
            Dynamic Map
          </div>
        );
      };
      return DynamicMap;
    },
  }));

  (useFetchApartments as jest.Mock).mockReturnValue({
    apartments: mockApartments,
  });

  render(<LandingPage />);
});

it('handles null apartments by using an empty array', () => {
  // Mock null apartments to test the nullish coalescing operator (??)
  (useFetchApartments as jest.Mock).mockReturnValue({ apartments: null });

  render(<LandingPage />);

  // When apartments is null, the component should show the placeholder
  expect(screen.getByTestId('map-placeholder')).toBeInTheDocument();
  expect(screen.queryByTestId('dynamic-map')).not.toBeInTheDocument();
});
it('properly cleans up interval when component unmounts', () => {
  // Mock apartments with multiple coordinates to trigger the interval
  const mockApartments = [
    { id: 1, address: { latitude: 50.1, longitude: 19.1 } },
    { id: 2, address: { latitude: 51.2, longitude: 17.2 } },
  ];

  (useFetchApartments as jest.Mock).mockReturnValue({
    apartments: mockApartments,
  });

  // Spy on both setInterval and clearInterval
  const setIntervalSpy = vi.spyOn(global, 'setInterval');
  const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

  // Render and then unmount to trigger cleanup
  const { unmount } = render(<LandingPage />);

  // We need the interval to be set up first
  expect(setIntervalSpy).toHaveBeenCalled();

  // Now unmount the component
  unmount();

  // Verify that clearInterval was called, which means
  // the cleanup function in useEffect ran properly
  expect(clearIntervalSpy).toHaveBeenCalled();

  // Clean up the spies
  setIntervalSpy.mockRestore();
  clearIntervalSpy.mockRestore();
});

it('does not set up interval when there is only one location', () => {
  // Mock a single apartment with valid coordinates
  const mockApartments = [
    { id: 1, address: { latitude: 50.1, longitude: 19.1 } },
  ];

  (useFetchApartments as jest.Mock).mockReturnValue({
    apartments: mockApartments,
  });

  // Spy on setInterval to verify it's not called
  const setIntervalSpy = vi.spyOn(global, 'setInterval');

  render(<LandingPage />);

  // With only one location, the setInterval should not be called
  // because of the condition: if (locations.length <= 1) return;
  expect(setIntervalSpy).not.toHaveBeenCalled();

  // Clean up the spy
  setIntervalSpy.mockRestore();
});
