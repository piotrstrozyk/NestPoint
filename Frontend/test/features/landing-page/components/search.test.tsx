import Search from '@/features/landing-page/components/search';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Lucide icon
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid='search-icon' />,
}));

describe('Search Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console.log to verify search action
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('renders search input and icon', () => {
    render(<Search />);

    // Check that the input exists
    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('');

    // Check that the search icon is displayed
    const searchIcon = screen.getByTestId('search-icon');
    expect(searchIcon).toBeInTheDocument();
  });

  it('updates input value when user types', async () => {
    const user = userEvent.setup();
    render(<Search />);

    const searchInput = screen.getByPlaceholderText('Search...');

    // Type in the search input
    await user.type(searchInput, 'test query');

    // Check that the input value has been updated
    expect(searchInput).toHaveValue('test query');
  });

  it('calls handleSearch when form is submitted', () => {
    render(<Search />);

    const searchInput = screen.getByPlaceholderText('Search...');
    const form = searchInput.closest('form');

    // Type in the search input
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Submit the form
    fireEvent.submit(form!);

    // Check that console.log was called with the correct query
    expect(console.log).toHaveBeenCalledWith('Searching for:', 'test query');
  });

  it('has the correct styling', () => {
    render(<Search />);

    const searchInput = screen.getByPlaceholderText('Search...');

    // Check that input has expected classes
    expect(searchInput).toHaveClass('w-full');
    expect(searchInput).toHaveClass('rounded-md');
    expect(searchInput).toHaveClass('border');
    expect(searchInput).toHaveClass('border-gray-300');
    expect(searchInput).toHaveClass('bg-zinc-50');
  });
});
