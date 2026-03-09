import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import posthog from "posthog-js";
import { getUserLocation, initialisePosthog } from '@/utils/analytics';

vi.hoisted(() => {
  localStorage.setItem('analyticsDisabled', 'false');
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
  it('is true when analyticsDisabled is "false" in localStorage', () => {
    expect(analyticsPermittedInitially).toBe(true);
  });
});

describe('initialisePosthog', () => {
  it('does initialise Posthog when analytics are explicitly permitted', () => {
    const initSpy = vi.spyOn(posthog, 'init');

    initialisePosthog();
    expect(initSpy).toHaveBeenCalled();
  });
});

describe('getUserLocation', () => {
  it('does get user location when analytics are explicitly permitted', async () => {
    await getUserLocation();

    expect(mockFetch).toHaveBeenCalled();
  });
});
