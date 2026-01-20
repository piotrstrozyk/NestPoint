import AdminPanelPageEntry from '@/app/admin-panel/page';
import AdminPanelPage from '@/features/admin-panel/pages/admin-panel-page';
import { describe, expect, it } from 'vitest';

describe('AdminPanelPage Entry Module', () => {
  it('should re-export the AdminPanelPage component', () => {
    expect(AdminPanelPageEntry).toBe(AdminPanelPage);
  });
});
