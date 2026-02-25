import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('analytics utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  describe('analyticsPermittedInitially', () => {
    it('is true when localStorage has no analyticsDisabled key', async () => {
      const { analyticsPermittedInitially } = await import('@/utils/analytics');
      expect(analyticsPermittedInitially).toBe(true);
    });

    it('is true when localStorage analyticsDisabled is "false"', async () => {
      localStorage.setItem('analyticsDisabled', 'false');
      const { analyticsPermittedInitially } = await import('@/utils/analytics');
      expect(analyticsPermittedInitially).toBe(true);
    });

    it('is false when localStorage analyticsDisabled is "true"', async () => {
      localStorage.setItem('analyticsDisabled', 'true');
      const { analyticsPermittedInitially } = await import('@/utils/analytics');
      expect(analyticsPermittedInitially).toBe(false);
    });
  });

  describe('disableAnalytics', () => {
    it('sets analyticsDisabled to "true" in localStorage and reloads', async () => {
      const reloadMock = vi.fn();
      vi.stubGlobal('location', { ...window.location, reload: reloadMock });

      const { disableAnalytics } = await import('@/utils/analytics');
      disableAnalytics();

      expect(localStorage.getItem('analyticsDisabled')).toBe('true');
      expect(reloadMock).toHaveBeenCalledOnce();

      vi.unstubAllGlobals();
    });
  });

  describe('enableAnalytics', () => {
    it('sets analyticsDisabled to "false" in localStorage and reloads', async () => {
      localStorage.setItem('analyticsDisabled', 'true');
      const reloadMock = vi.fn();
      vi.stubGlobal('location', { ...window.location, reload: reloadMock });

      const { enableAnalytics } = await import('@/utils/analytics');
      enableAnalytics();

      expect(localStorage.getItem('analyticsDisabled')).toBe('false');
      expect(reloadMock).toHaveBeenCalledOnce();

      vi.unstubAllGlobals();
    });
  });
});
