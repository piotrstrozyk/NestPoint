import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/core/components/ui/accordion';

describe('<Accordion />', () => {
  it('should render multiple accordion items and toggle content visibility', async () => {
    const user = userEvent.setup();

    render(
      <Accordion type='single' collapsible>
        <AccordionItem value='item-1'>
          <AccordionTrigger>Trigger 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value='item-2'>
          <AccordionTrigger>Trigger 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    // Initially, contents should not be in the DOM
    expect(screen.queryByText('Content 1')).toBeNull();
    expect(screen.queryByText('Content 2')).toBeNull();

    // Click the first trigger to open content 1
    const trigger1 = screen.getByText('Trigger 1');
    await user.click(trigger1);

    // Content 1 should now be visible, content 2 still hidden
    expect(screen.getByText('Content 1')).toBeVisible();
    expect(screen.queryByText('Content 2')).toBeNull();

    // Clicking the second trigger should close the first (since type="single") and open the second
    const trigger2 = screen.getByText('Trigger 2');
    await user.click(trigger2);

    expect(screen.queryByText('Content 1')).toBeNull();
    expect(screen.getByText('Content 2')).toBeVisible();
  });

  it('should allow multiple items open when type="multiple"', async () => {
    const user = userEvent.setup();

    render(
      <Accordion type='multiple'>
        <AccordionItem value='item-a'>
          <AccordionTrigger>Trigger A</AccordionTrigger>
          <AccordionContent>Content A</AccordionContent>
        </AccordionItem>
        <AccordionItem value='item-b'>
          <AccordionTrigger>Trigger B</AccordionTrigger>
          <AccordionContent>Content B</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    // Initially, contents should not be in the DOM
    expect(screen.queryByText('Content A')).toBeNull();
    expect(screen.queryByText('Content B')).toBeNull();

    // Open both
    await user.click(screen.getByText('Trigger A'));
    await user.click(screen.getByText('Trigger B'));

    expect(screen.getByText('Content A')).toBeVisible();
    expect(screen.getByText('Content B')).toBeVisible();
  });
});
