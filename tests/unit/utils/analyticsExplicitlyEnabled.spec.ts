import { beforeEach, describe, it, expect, vi } from 'vitest';
import posthog from "posthog-js";

const mockFetch = vi.fn();
mockFetch.mockResolvedValue({
  ok: true,
  json: async () => ({ country: 'Testland' }),
});

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
});

const loadAnalytics = async () => import('@/utils/analytics');

describe('analyticsPermittedInitially', () => {
  it('is true when analyticsDisabled is "false" in localStorage', async () => {
    localStorage.setItem('analyticsDisabled', 'false');
    const { analyticsPermittedInitially } = await loadAnalytics();

    expect(analyticsPermittedInitially).toBe(true);
  });
});

describe('initialisePosthog', () => {
  it('does initialise Posthog when analytics are explicitly permitted', async () => {
    localStorage.setItem('analyticsDisabled', 'false');
    const { initialisePosthog } = await loadAnalytics();
    const initSpy = vi.spyOn(posthog, 'init');

    initialisePosthog();
    expect(initSpy).toHaveBeenCalled();
  });
});

describe('getUserLocation', () => {
  it('does get user location when analytics are explicitly permitted', async () => {
    localStorage.setItem('analyticsDisabled', 'false');
    const { getUserLocation } = await loadAnalytics();

    await getUserLocation();

    expect(mockFetch).toHaveBeenCalled();
  });
});
