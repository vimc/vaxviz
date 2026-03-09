import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsPermittedInitially, disableAnalytics, enableAnalytics, getUserLocation, initialisePosthog } from '@/utils/analytics';
import posthog from "posthog-js";

const mockFetch = vi.fn();
mockFetch.mockResolvedValue({
  ok: true,
  json: async () => ({ country: 'Testland' }),
});

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  localStorage.clear();
});

describe('analytics utils', () => {
  describe('analyticsPermittedInitially', () => {
    it('is true when localStorage has no analyticsDisabled key', () => {
      expect(analyticsPermittedInitially).toBe(true);
    });
  });

  describe('disableAnalytics', () => {
    beforeEach(() => {
      vi.stubGlobal('location', { ...window.location, reload: vi.fn() });
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

    it('sets analyticsDisabled to "false" in localStorage and reloads', () => {
      enableAnalytics();

      expect(localStorage.getItem('analyticsDisabled')).toBe('false');
      expect(window.location.reload).toHaveBeenCalledOnce();
    });
  });

  describe('getUserLocation', () => {
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
    });
  });
});

describe('initialisePosthog', () => {
  it('does initialise Posthog when analytics are implicitly permitted', async () => {
    const initSpy = vi.spyOn(posthog, 'init');
    const registerSpy = vi.spyOn(posthog, 'register');
    const captureSpy = vi.spyOn(posthog, 'capture');

    initialisePosthog();
    expect(initSpy).toHaveBeenCalled();

    await vi.waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({ country: 'Testland' });
    });
    expect(captureSpy).toHaveBeenCalledWith('app_loaded');
  });
});
