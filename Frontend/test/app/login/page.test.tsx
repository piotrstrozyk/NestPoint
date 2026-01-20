import { Suspense, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import LoginPageEntry from '@/app/login/page';
import LoginPage from '@/features/login/pages/login-page';

describe('LoginPage Entry Module', () => {
  it('should export a component named LoginPageWithSuspense', () => {
    expect(LoginPageEntry.name).toBe('LoginPageWithSuspense');
  });

  it('should render a <Suspense> with LoginPage as its child', () => {
    // Invoke the component to get its ReactElement tree
    const tree = LoginPageEntry() as ReactElement;

    // Top‐level element must be Suspense
    expect(tree.type).toBe(Suspense);

    if (!('props' in tree)) {
      throw new Error('tree is not a valid ReactElement');
    }
    const child = ((tree as ReactElement).props as { children: ReactElement }).children as ReactElement;
    expect(child.type).toBe(LoginPage);
  });
});
