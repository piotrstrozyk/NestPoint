import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('DropdownMenu', () => {
  it('renders trigger and content', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
    // Content should not be visible until triggered
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Open'));
    expect(await screen.findByText('Item 1')).toBeInTheDocument();
  });

  it('renders checkbox item and toggles checked state', async () => {
    let checked = false;
    const handleCheckedChange = (v: boolean) => {
      checked = v;
    };
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={checked}
            onCheckedChange={handleCheckedChange}
          >
            Checkbox Item
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByText('Open'));
    const checkbox = screen.getByText('Checkbox Item');
    expect(checkbox).toBeInTheDocument();
    await userEvent.click(checkbox);
    expect(checked).toBe(true);
  });

  it('renders radio group and selects item', async () => {
    let value = 'a';
    const handleValueChange = (v: string) => {
      value = v;
    };
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={handleValueChange}
          >
            <DropdownMenuRadioItem value='a'>A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='b'>B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(screen.getByText('B'));
    expect(value).toBe('b');
  });

  it('renders label, separator, and shortcut', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Item <DropdownMenuShortcut>Ctrl+I</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+I')).toBeInTheDocument();
  });

  it('renders sub menu', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByText('Open'));
    await userEvent.hover(screen.getByText('More'));
    expect(await screen.findByText('Sub Item')).toBeInTheDocument();
  });

  describe('DropdownMenuPortal', () => {
    it('renders children and data-slot when menu is open', async () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuPortal>
            <div>Portal Content</div>
          </DropdownMenuPortal>
        </DropdownMenu>,
      );
      // Open the menu so the portal content is rendered
      await userEvent.click(screen.getByText('Open'));
      expect(await screen.findByText('Portal Content')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuGroup', () => {
    it('renders children and data-slot', () => {
      render(
        <DropdownMenuGroup>
          <div>Group Content</div>
        </DropdownMenuGroup>,
      );
      expect(screen.getByText('Group Content')).toBeInTheDocument();
      const group = screen.getByText('Group Content').parentElement;
      expect(group?.getAttribute('data-slot')).toBe('dropdown-menu-group');
    });
  });
});
