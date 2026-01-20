import { Footer } from '@/core/components/footer/footer';
import * as CoreEntry from '@/core/components/index';
import Navbar from '@/core/components/navbar/navbar';
import { describe, expect, it } from 'vitest';

describe('Core Components Entry Module', () => {
  it('should re-export Footer and Navbar correctly', () => {
    // Ensure that the entry module exports exactly Footer and Navbar
    expect(CoreEntry.Footer).toBe(Footer);
    expect(CoreEntry.Navbar).toBe(Navbar);
  });
});
