import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Mocks
vi.mock('next-auth/react', () => {
  return {
    useSession: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/core/components/svg/nest-2', () => ({
  __esModule: true,
  default: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

vi.mock('@/features/chat/components/chat-button', () => ({
  __esModule: true,
  default: () => <button data-testid='chat-button' />,
}));

import Navbar from '@/core/components/navbar/navbar';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';

describe('Navbar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when status is loading', () => {
    (useSession as unknown as Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });
    render(<Navbar />);
    expect(screen.getAllByText(/Loading…/i).length).toBeGreaterThan(0);
  });
  it('loading: clicking login shows "Already signed in!" toast and does not redirect', () => {
    // simulate loading state
    (useSession as Mock).mockReturnValue({ data: null, status: 'loading' });

    // stub out location so we can assert it didn’t change
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });

    render(<Navbar />);
    const loginBtn = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginBtn);

    // should show toast, not redirect
    expect(toast.success).toHaveBeenCalledWith('Already signed in!');
    expect(window.location.href).toBe('');
  });

  it('unauthenticated: shows login button and redirects on click', () => {
    (useSession as Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = { href: '' };

    render(<Navbar />);
    const loginBtn = screen.getAllByRole('button')[0];
    fireEvent.click(loginBtn);
    expect(window.location.href).toBe('/login');
  });

  it('authenticated: shows user name and logout button', async () => {
    const user = { name: 'Test User', role: ['USER'] };
    (useSession as Mock).mockReturnValue({
      data: { user },
      status: 'authenticated',
    });
    render(<Navbar />);
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutBtn);
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  it('authenticated owner: shows Add Apartment link', () => {
    const user = { name: 'Owner', role: ['OWNER'] };
    (useSession as Mock).mockReturnValue({
      data: { user },
      status: 'authenticated',
    });
    render(<Navbar />);
    expect(screen.getByText(/Add Apartment/)).toBeInTheDocument();
  });

  it('toggles mobile menu', () => {
    (useSession as Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    render(<Navbar />);
    const toggleBtn = screen.getByLabelText(/toggle menu/i);
    // initially menu closed: Listings only in desktop, mobile panel hidden
    expect(screen.queryByText(/Listings/)).toBeInTheDocument(); // desktop link
    // click to open
    fireEvent.click(toggleBtn);
    expect(screen.getAllByText(/Listings/).length).toBeGreaterThan(1);
    // click to close
    fireEvent.click(toggleBtn);
    expect(screen.queryAllByText(/Listings/).length).toBe(1);
  });
});
describe('Navbar mobile menu panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // stub window.location
    (window as unknown as { location: { href: string } }).location = {
      href: '',
    };
  });

  function openMobile(nav: ReturnType<typeof render>) {
    const toggleBtn = nav.getByLabelText(/toggle menu/i);
    fireEvent.click(toggleBtn);
  }

  it('authenticated user in mobile: shows name, profile link and logout button', async () => {
    const user = { name: 'Mobile User', role: ['USER'] };
    (useSession as Mock).mockReturnValue({
      data: { user },
      status: 'authenticated',
    });

    const nav = render(<Navbar />);
    openMobile(nav);
  });

  it('desktop: does not show Add Apartment for non-OWNER user', () => {
    const user = { name: 'Regular User', role: ['USER'] };
    (useSession as Mock).mockReturnValue({
      data: { user },
      status: 'authenticated',
    });
    render(<Navbar />);
    expect(screen.queryByText('Add Apartment')).toBeNull();
  });

  it('desktop: clicking profile link does not trigger logout', () => {
    const user = { name: 'Profile User', role: ['USER'] };
    (useSession as Mock).mockReturnValue({
      data: { user },
      status: 'authenticated',
    });
    render(<Navbar />);
    const profileLink = screen.getByText('Profile User').closest('a');
    expect(profileLink).toHaveAttribute('href', '/profile');
    fireEvent.click(profileLink!);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('mobile: does not show Add Apartment for non-OWNER user', () => {
    const user = { name: 'Mobile NonOwner', role: ['USER'] };
    (useSession as Mock).mockReturnValue({
      data: { user },
      status: 'authenticated',
    });
    const nav = render(<Navbar />);
    const toggleBtn = nav.getByLabelText(/toggle menu/i);
    fireEvent.click(toggleBtn);
    const panel = nav.container.querySelector(
      '.animate-slide-down',
    ) as HTMLElement;
    const mobile = within(panel);
    expect(mobile.getByText('Mobile NonOwner')).toBeInTheDocument();
    expect(mobile.queryByText('Add Apartment')).toBeNull();
  });

  it('mobile: clicking Listings link does not close the menu', () => {
    (useSession as Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    const nav = render(<Navbar />);
    const toggleBtn = nav.getByLabelText(/toggle menu/i);
    fireEvent.click(toggleBtn);
    const panel = nav.container.querySelector(
      '.animate-slide-down',
    ) as HTMLElement;
    const mobile = within(panel);
    const listingsLink = mobile.getByText('Listings');
    fireEvent.click(listingsLink);
    expect(
      nav.container.querySelector('.animate-slide-down'),
    ).toBeInTheDocument();
  });

  it('mobile: clicking logout closes the menu and calls signOut', async () => {
    const user = { name: 'Logout User', role: ['USER'] };
    (useSession as Mock).mockReturnValue({
      data: { user },
      status: 'authenticated',
    });
    const nav = render(<Navbar />);
    const toggleBtn = nav.getByLabelText(/toggle menu/i);
    fireEvent.click(toggleBtn);
    const panel = nav.container.querySelector('.animate-slide-down')!;
    const mobile = within(panel as HTMLElement);
    const logoutBtn = mobile.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutBtn);
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  it('desktop: chat button is present', () => {
    (useSession as Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    render(<Navbar />);
    expect(screen.getByTestId('chat-button')).toBeInTheDocument();
  });

  it('mobile: does not show loading indicator when not loading', () => {
    (useSession as Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    const nav = render(<Navbar />);
    const toggleBtn = nav.getByLabelText(/toggle menu/i);
    fireEvent.click(toggleBtn);
    const panel = nav.container.querySelector('.animate-slide-down')!;
    const mobile = within(panel as HTMLElement);
    expect(mobile.queryByText(/Loading…/i)).toBeNull();
  });

  it('mobile loading: shows loading indicator in the panel when status is loading', () => {
    // Arrange: mock loading session
    (useSession as Mock).mockReturnValue({ data: null, status: 'loading' });

    const nav = render(<Navbar />);
    // Act: open mobile menu
    const toggleBtn = nav.getByLabelText(/toggle menu/i);
    fireEvent.click(toggleBtn);

    // Scope to the mobile panel
    const panel = nav.container.querySelector('.animate-slide-down')!;
    const mobile = within(panel as HTMLElement);

    // Assert: the loading span is rendered with the correct classes
    const loading = mobile.getByText(/Loading…/i);
    expect(loading).toBeInTheDocument();
    expect(loading).toHaveClass('block', 'px-3', 'py-2', 'text-zinc-500');
  });

  it('authenticated owner in mobile: also shows Add Apartment link', () => {
    const user: { name: string; role: string[] } = {
      name: 'Mobile Owner',
      role: ['OWNER'],
    };
    (useSession as Mock).mockReturnValue({
      data: { user },
      status: 'authenticated',
    });

    const renderResult = render(<Navbar />);
    openMobile(renderResult);

    const panel = renderResult.container.querySelector<HTMLElement>(
      '.animate-slide-down',
    );
    if (!panel) throw new Error('mobile panel did not render');

    const mobile = within(panel);

    expect(mobile.getByText(/Mobile Owner/)).toBeInTheDocument();
    expect(mobile.getByText(/Add Apartment/)).toBeInTheDocument();
  });

  it('profile link is /tenant-profile for TENANT user', () => {
    const user = { name: 'Tenant User', role: ['TENANT'] };
    (useSession as Mock).mockReturnValue({
      data: { user },
      status: 'authenticated',
    });
    render(<Navbar />);
    // Find the profile link in the desktop menu
    const profileLink = screen.getByText('Tenant User').closest('a');
    expect(profileLink).toHaveAttribute('href', '/tenant-profile');
  });

  it('mobile: unauthenticated login button sets window.location.href to /login', () => {
    (useSession as Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = { href: '' };
    const nav = render(<Navbar />);
    // Open the mobile menu
    const toggleBtn = nav.getByLabelText(/toggle menu/i);
    fireEvent.click(toggleBtn);
    // Find the Login button in the mobile menu
    const panel = nav.container.querySelector('.animate-slide-down')!;
    const mobile = within(panel as HTMLElement);
    const loginBtn = mobile.getByRole('button', { name: /login/i });
    fireEvent.click(loginBtn);
    expect(window.location.href).toBe('/login');
  });
});
