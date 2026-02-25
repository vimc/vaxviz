import { describe, it, expect, vi } from 'vitest';

vi.hoisted(() => {
  localStorage.setItem('analyticsDisabled', 'true');
});

import { analyticsPermittedInitially } from '@/utils/analytics';

describe('analyticsPermittedInitially', () => {
  it('is false when analyticsDisabled is "true" in localStorage', () => {
    expect(analyticsPermittedInitially).toBe(false);
  });
});
