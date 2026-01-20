import StatsSection from '@/features/landing-page/components/stats-section';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the custom hook
vi.mock('@/features/landing-page/hooks/use-fetch-stats', () => ({
  useFetchStats: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode }) => (
      <div data-testid='motion-div' {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock CountUp component
vi.mock('react-countup', () => ({
  default: ({ end }: { end: number }) => (
    <span data-testid='count-up'>{end}</span>
  ),
}));

// Mock Skeleton component
vi.mock('react-loading-skeleton', () => ({
  default: ({
    circle,
    width,
    height,
  }: {
    circle?: boolean;
    width?: number | string;
    height?: number | string;
  }) => (
    <div
      data-testid='skeleton'
      data-circle={circle ? 'true' : 'false'}
      style={{ width, height }}
    />
  ),
}));

// Mock all recharts components
vi.mock('recharts', () => ({
  Bar: ({ dataKey, fill }: { dataKey: string; fill: string }) => (
    <div data-testid='recharts-bar' data-key={dataKey} data-fill={fill} />
  ),
  BarChart: ({
    children,
    data,
  }: {
    children?: React.ReactNode;
    data?: unknown[];
  }) => (
    <div data-testid='recharts-bar-chart' data-items={data?.length}>
      {children}
    </div>
  ),
  ResponsiveContainer: ({
    children,
    width,
    height,
  }: {
    children?: React.ReactNode;
    width?: number | string;
    height?: number | string;
  }) => (
    <div data-testid='recharts-responsive-container' style={{ width, height }}>
      {children}
    </div>
  ),
  Tooltip: () => <div data-testid='recharts-tooltip' />,
  Cell: ({ fill }: { fill: string }) => (
    <div data-testid='recharts-cell' data-fill={fill} />
  ),
  Legend: () => <div data-testid='recharts-legend' />,
  Pie: ({
    data,
    children,
  }: {
    data?: unknown[];
    children?: React.ReactNode;
  }) => (
    <div data-testid='recharts-pie' data-items={data?.length}>
      {children}
    </div>
  ),
  PieChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid='recharts-pie-chart'>{children}</div>
  ),
  PolarAngleAxis: () => <div data-testid='recharts-polar-angle-axis' />,
  RadialBar: ({ fill }: { fill: string }) => (
    <div data-testid='recharts-radial-bar' data-fill={fill} />
  ),
  RadialBarChart: ({
    data,
    children,
  }: {
    data?: unknown[];
    children?: React.ReactNode;
  }) => (
    <div data-testid='recharts-radial-bar-chart' data-items={data?.length}>
      {children}
    </div>
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => (
    <div data-testid='recharts-x-axis' data-key={dataKey} />
  ),
  YAxis: () => <div data-testid='recharts-y-axis' />,
}));

import { useFetchStats } from '@/features/landing-page/hooks/use-fetch-stats';

describe('StatsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons when loading is true', () => {
    // Mock loading state
    (
      useFetchStats as jest.MockedFunction<typeof useFetchStats>
    ).mockReturnValue({
      stats: { activeAuctions: 0, tenants: 0, apartments: 0, rentals: 0 },
      loading: true,
    });

    render(<StatsSection />);

    // Check heading is rendered
    expect(screen.getByText('Live Website Stats')).toBeInTheDocument();

    // Check for skeletons
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);

    // Check for specific skeleton groups
    expect(
      screen.getByText('Real-time snapshot of activity across NestPoint.'),
    ).toBeInTheDocument();
  });

  it('renders stats and charts when data is loaded', () => {
    // Mock loaded state with data
    const mockStats = {
      activeAuctions: 45,
      tenants: 120,
      apartments: 200,
      rentals: 150,
    };

    (
      useFetchStats as jest.MockedFunction<typeof useFetchStats>
    ).mockReturnValue({
      stats: mockStats,
      loading: false,
    });

    render(<StatsSection />);

    // Check headings
    expect(screen.getByText('Live Website Stats')).toBeInTheDocument();
    expect(
      screen.getByText('Real-time snapshot of activity across NestPoint.'),
    ).toBeInTheDocument();

    // Check counters are rendered
    expect(screen.getByText('Auctions')).toBeInTheDocument();
    expect(screen.getByText('Tenants')).toBeInTheDocument();
    expect(screen.getByText('Apartments')).toBeInTheDocument();
    expect(screen.getByText('Rentals')).toBeInTheDocument();

    // Check CountUp components have correct values
    const countUps = screen.getAllByTestId('count-up');
    expect(countUps.length).toBeGreaterThan(0);

    // Check for chart section headings
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
    expect(screen.getByText('Platform Activity')).toBeInTheDocument();
    expect(screen.getByText('Property Types')).toBeInTheDocument();

    // Check for chart components
    expect(screen.getByTestId('recharts-bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-radial-bar-chart')).toBeInTheDocument();

    // Check occupancy percentage calculation
    const expectedPercentage = (
      (mockStats.rentals / mockStats.apartments) *
      100
    ).toFixed(1);
    expect(screen.getByText(`${expectedPercentage}%`)).toBeInTheDocument();
  });

  it('calculates rental percentage correctly', () => {
    // Mock data with specific values for easy percentage calculation
    const mockStats = {
      activeAuctions: 10,
      tenants: 50,
      apartments: 100, // Using 100 for easy percentage calculation
      rentals: 75, // Should result in 75%
    };

    (
      useFetchStats as jest.MockedFunction<typeof useFetchStats>
    ).mockReturnValue({
      stats: mockStats,
      loading: false,
    });

    render(<StatsSection />);

    // Check if percentage is calculated and displayed correctly
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('passes correct data to charts', () => {
    const mockStats = {
      activeAuctions: 40,
      tenants: 200,
      apartments: 150,
      rentals: 100,
      propertyTypes: { APARTMENT: 10, HOUSE: 5, STUDIO: 2 },
    };

    (
      useFetchStats as jest.MockedFunction<typeof useFetchStats>
    ).mockReturnValue({
      stats: mockStats,
      loading: false,
    });

    render(<StatsSection />);

    // Check bar chart data
    const barChart = screen.getByTestId('recharts-bar-chart');
    expect(barChart).toHaveAttribute('data-items', '4'); // 4 data items

    // Check radial bar chart has correct value
    const radialBarChart = screen.getByTestId('recharts-radial-bar-chart');
    expect(radialBarChart).toHaveAttribute('data-items', '1'); // 1 data item (percentage)

    // Check pie chart data
    const pieChart = screen.getByTestId('recharts-pie');
    expect(pieChart).toHaveAttribute('data-items', '3'); // 3 property types
  });
});
