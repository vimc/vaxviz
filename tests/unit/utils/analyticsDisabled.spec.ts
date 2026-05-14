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
  it('is false when analyticsDisabled is "true" in localStorage', async () => {
    localStorage.setItem('analyticsDisabled', 'true');
    const { analyticsPermittedInitially } = await loadAnalytics();

    expect(analyticsPermittedInitially).toBe(false);
  });
});

describe('initialisePosthog', () => {
  it('does not initialise Posthog when analytics are not permitted', async () => {
    localStorage.setItem('analyticsDisabled', 'true');
    const { initialisePosthog } = await loadAnalytics();
    const initSpy = vi.spyOn(posthog, 'init');

    initialisePosthog();
    expect(initSpy).not.toHaveBeenCalled();
  });
});

describe('getUserLocation', () => {
  it('does not get user location when analytics are not permitted', async () => {
    localStorage.setItem('analyticsDisabled', 'true');
    const { getUserLocation } = await loadAnalytics();

    await getUserLocation();

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
