import HtmlLayout from '@/core/layouts/html';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Mock next/font/google and next-runtime-env
vi.mock('next/font/google', () => ({
  DM_Sans: () => ({ className: 'mock-dm-sans' }),
}));
vi.mock('next-runtime-env', () => ({
  PublicEnvScript: () => <script data-testid='public-env-script' />,
}));

describe('HtmlLayout', () => {
  it('renders html, head, body, and children', async () => {
    const TestChild = <div data-testid='child'>Hello</div>;
    // HtmlLayout is async, so we need to await its result
    const Layout = await HtmlLayout({ children: TestChild });
    render(Layout as React.ReactElement);

    expect(document.querySelector('html')).toBeInTheDocument();
    expect(document.querySelector('head')).toBeInTheDocument();
    expect(document.querySelector('body')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('applies the DM_Sans font class to the body', async () => {
    const Layout = await HtmlLayout({ children: <div /> });
    render(Layout as React.ReactElement);

    expect(document.body.className).toContain('mock-dm-sans');
  });

  it('renders the PublicEnvScript in head', async () => {
    const Layout = await HtmlLayout({ children: <div /> });
    render(Layout as React.ReactElement);

    // The script should be in the head
    const script = document.head.querySelector(
      '[data-testid="public-env-script"]',
    );
    expect(script).toBeInTheDocument();
  });
});
