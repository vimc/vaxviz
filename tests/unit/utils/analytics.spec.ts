import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyticsPermittedInitially, disableAnalytics, enableAnalytics, getUserLocation } from '@/utils/analytics';

describe('analytics utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('analyticsPermittedInitially', () => {
    it('is true when localStorage has no analyticsDisabled key', () => {
      expect(analyticsPermittedInitially).toBe(true);
    });
  });

  describe('disableAnalytics', () => {
    beforeEach(() => {
      vi.stubGlobal('location', { ...window.location, reload: vi.fn() });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      localStorage.clear();
    });

    it('sets analyticsDisabled to "true" in localStorage and reloads', () => {
      disableAnalytics();

      expect(localStorage.getItem('analyticsDisabled')).toBe('true');
      expect(window.location.reload).toHaveBeenCalledOnce();
    });
  });

  describe('enableAnalytics', () => {
    beforeEach(() => {
      localStorage.setItem('analyticsDisabled', 'true');
      vi.stubGlobal('location', { ...window.location, reload: vi.fn() });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      localStorage.clear();
    });

    it('sets analyticsDisabled to "false" in localStorage and reloads', () => {
      enableAnalytics();

      expect(localStorage.getItem('analyticsDisabled')).toBe('false');
      expect(window.location.reload).toHaveBeenCalledOnce();
    });
  });

  describe('getUserLocation', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns location data when fetch is successful', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country: 'Testland' }),
      });

      const location = await getUserLocation();

      expect(location.country).toEqual('Testland');
    });

    it('returns null and logs an error when fetch fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const location = await getUserLocation();

      expect(location).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching location:', new Error('Failed to fetch location'));

      consoleErrorSpy.mockRestore();
    });
  });
});
