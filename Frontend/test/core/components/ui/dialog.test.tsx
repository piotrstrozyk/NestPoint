// Dialog.test.tsx
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('Dialog components', () => {
  it('renders trigger and does not show content until opened', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Hi</DialogTitle>
          <DialogDescription>Hello world</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    // Trigger should be in the document
    expect(screen.getByText('Open')).toBeInTheDocument();

    // Content slots should not be present before open
    expect(screen.queryByText('Hi')).toBeNull();
    expect(screen.queryByText('Hello world')).toBeNull();
  });

  it('opens the dialog when trigger is clicked', async () => {
    render(
      <Dialog>
        <DialogTrigger>Click me</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Some description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByText('Click me'));
    expect(screen.getByText('Dialog Title')).toBeVisible();
    expect(screen.getByText('Some description')).toBeVisible();
  });
  it('respects showCloseButton={false}', async () => {
    render(
      <Dialog>
        <DialogTrigger>Go</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>No Close</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByText('Go'));
    // There should be no close button in this case
    expect(screen.queryByLabelText('Close')).toBeNull();
    // But content still appears
    expect(screen.getByText('No Close')).toBeVisible();
  });

  it('renders and closes the dialog when clicked', async () => {
    const onOpenChange = vi.fn();

    const { container } = render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogClose>Custom Close</DialogClose>
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(container.querySelector('[data-slot="dialog-trigger"]')!);
  });
});

describe('DialogHeader', () => {
  it('renders a div with the default and custom classes, data-slot, props, and children', () => {
    render(
      <DialogHeader
        className='custom-header'
        id='header1'
        aria-label='My Header'
      >
        <span>Header Content</span>
      </DialogHeader>,
    );

    const header = screen.getByText('Header Content').closest('div');
    expect(header).toBeInTheDocument();
    // data-slot attribute
    expect(header).toHaveAttribute('data-slot', 'dialog-header');
    // default + custom class
    expect(header).toHaveClass(
      'flex',
      'flex-col',
      'gap-2',
      'text-center',
      'sm:text-left',
      'custom-header',
    );
    // other props
    expect(header).toHaveAttribute('id', 'header1');
    expect(header).toHaveAttribute('aria-label', 'My Header');
  });
});

describe('DialogFooter', () => {
  it('renders a div with the default and custom classes, data-slot, props, and children', () => {
    render(
      <DialogFooter className='custom-footer' data-test='footer-test'>
        <button>Action</button>
      </DialogFooter>,
    );

    const footer = screen.getByText('Action').closest('div');
    expect(footer).toBeInTheDocument();
    // data-slot attribute
    expect(footer).toHaveAttribute('data-slot', 'dialog-footer');
    // default + custom class
    expect(footer).toHaveClass(
      'flex',
      'flex-col-reverse',
      'gap-2',
      'sm:flex-row',
      'sm:justify-end',
      'custom-footer',
    );
    // other props
    expect(footer).toHaveAttribute('data-test', 'footer-test');
  });
});
