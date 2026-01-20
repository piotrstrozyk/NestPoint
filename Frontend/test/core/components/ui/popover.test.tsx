import {
  Popover,
  PopoverAnchor,
  PopoverTrigger,
} from '@/core/components/ui/popover';
import { render, screen } from '@testing-library/react';

describe('Popover components', () => {
  it('renders PopoverTrigger with data-slot and children', () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
      </Popover>,
    );
    const trigger = screen.getByText('Open');
    expect(trigger).toHaveAttribute('data-slot', 'popover-trigger');
  });

  it('renders PopoverAnchor with data-slot', () => {
    render(
      <Popover>
        <PopoverAnchor>Anchor</PopoverAnchor>
      </Popover>,
    );
    const anchor = screen.getByText('Anchor');
    expect(anchor).toHaveAttribute('data-slot', 'popover-anchor');
  });
});
