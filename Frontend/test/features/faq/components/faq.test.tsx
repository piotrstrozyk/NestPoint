import FAQPage from '@/features/faq/components/faq';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('FAQPage', () => {
  it('renders the FAQ page with correct heading', () => {
    render(<FAQPage />);
    expect(
      screen.getByRole('heading', { name: /frequently asked questions/i }),
    ).toBeInTheDocument();
  });

  it('renders all 7 FAQ questions', () => {
    render(<FAQPage />);

    const faqQuestions = [
      'What are the benefits of selling my property through your platform?',
      'How do I list my rental property?',
      'What fees are involved in using your services?',
      'How can I schedule a property viewing?',
      'What security measures ensure safe transactions?',
      'Can I get professional advice on property valuation?',
      'How do I get in touch with customer support?',
    ];

    faqQuestions.forEach((question) => {
      expect(screen.getByText(question)).toBeInTheDocument();
    });
  });

  it('expands an accordion item when clicked', async () => {
    render(<FAQPage />);
    const user = userEvent.setup();

    const question =
      'What are the benefits of selling my property through your platform?';
    const answerText =
      'Our platform connects you with a wide network of potential buyers';

    // Find and click the first accordion trigger
    const trigger = screen.getByText(question);
    await user.click(trigger);

    // The answer should now be visible
    expect(screen.getByText(new RegExp(answerText))).toBeInTheDocument();
  });

  it('collapses an expanded accordion item when clicked again', async () => {
    render(<FAQPage />);
    const user = userEvent.setup();

    const question = 'How do I list my rental property?';

    // Expand the accordion
    await user.click(screen.getByText(question));

    // Click again to collapse
    await user.click(screen.getByText(question));

    // Check if the accordion trigger has aria-expanded set to false
    const trigger = screen.getByText(question).closest('button');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('ensures only one accordion item can be open at a time', async () => {
    render(<FAQPage />);
    const user = userEvent.setup();

    const firstQuestion =
      'What are the benefits of selling my property through your platform?';
    const secondQuestion = 'How do I list my rental property?';

    // Open first item
    await user.click(screen.getByText(firstQuestion));

    // Open second item
    await user.click(screen.getByText(secondQuestion));

    // First item should now be closed
    const firstTrigger = screen.getByText(firstQuestion).closest('button');
    const secondTrigger = screen.getByText(secondQuestion).closest('button');

    expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(secondTrigger).toHaveAttribute('aria-expanded', 'true');
  });
});
