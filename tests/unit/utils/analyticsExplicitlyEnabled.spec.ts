import { describe, it, expect, vi } from 'vitest';

vi.hoisted(() => {
  localStorage.setItem('analyticsDisabled', 'false');
});

import { analyticsPermittedInitially } from '@/utils/analytics';

describe('analyticsPermittedInitially', () => {
  it('is true when analyticsDisabled is "false" in localStorage', () => {
    expect(analyticsPermittedInitially).toBe(true);
  });
});
