import { Footer } from '@/core/components/footer/footer';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock the NestIcon to avoid SVG issues
vi.mock('@/core/components/svg/nest-2', () => ({
  __esModule: true,
  default: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid='nest-icon' {...props} />
  ),
}));

describe('Footer', () => {
  it('renders logo, tagline, menu items, copyright, and bottom links', () => {
    render(<Footer />);

    // Logo and title
    expect(screen.getByTestId('nest-icon')).toBeInTheDocument();
    expect(screen.getByText('NestPoint.com')).toBeInTheDocument();

    // Tagline
    expect(screen.getByText('Shelter for the masses.')).toBeInTheDocument();

    // Menu sections and links
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Active listings')).toBeInTheDocument();
    expect(screen.getByText('View Map')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(
      screen.getByText('prezes.szef@studms.ug.edu.pl'),
    ).toBeInTheDocument();
    expect(screen.getByText(/tel\. \(22\) 695.?12.?04/i)).toBeInTheDocument();

    // Copyright
    expect(
      screen.getByText('© 2025 NestPoint.com. All rights reserved.'),
    ).toBeInTheDocument();

    // Bottom links
    expect(screen.getByText('Terms and Conditions')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });
});

it('renders custom props', () => {
  render(
    <Footer
      logo={{ url: '/logo.svg', alt: 'Alt', title: 'CustomTitle' }}
      tagline='Custom tagline'
      menuItems={[
        {
          title: 'TestMenu',
          links: [{ text: 'TestLink', url: '/test' }],
        },
      ]}
      copyright='Custom copyright'
      bottomLinks={[{ text: 'CustomLink', url: '/custom' }]}
    />,
  );

  expect(screen.getByText('CustomTitle')).toBeInTheDocument();
  expect(screen.getByText('Custom tagline')).toBeInTheDocument();
  expect(screen.getByText('TestMenu')).toBeInTheDocument();
  expect(screen.getByText('TestLink')).toBeInTheDocument();
  expect(screen.getByText('Custom copyright')).toBeInTheDocument();
  expect(screen.getByText('CustomLink')).toBeInTheDocument();
});
