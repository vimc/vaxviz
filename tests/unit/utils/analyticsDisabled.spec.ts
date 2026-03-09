import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import posthog from "posthog-js";
import { getUserLocation, initialisePosthog } from '@/utils/analytics';

vi.hoisted(() => {
  localStorage.setItem('analyticsDisabled', 'true');
});

import { analyticsPermittedInitially } from '@/utils/analytics';

const mockFetch = vi.fn();
mockFetch.mockResolvedValue({
  ok: true,
  json: async () => ({ country: 'Testland' }),
});

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('analyticsPermittedInitially', () => {
  it('is false when analyticsDisabled is "true" in localStorage', () => {
    expect(analyticsPermittedInitially).toBe(false);
  });
});

describe('initialisePosthog', () => {
  it('does not initialise Posthog when analytics are not permitted', () => {
    const initSpy = vi.spyOn(posthog, 'init');

    initialisePosthog();
    expect(initSpy).not.toHaveBeenCalled();
  });
});

describe('getUserLocation', () => {
  it('does not get user location when analytics are not permitted', async () => {
    await getUserLocation();

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
