import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

vi.mock('@/utils/analytics', () => ({
  get analyticsPermittedInitially() { return true; },
  disableAnalytics: vi.fn(),
  enableAnalytics: vi.fn(),
}));

import PrivacyModal from '@/components/PrivacyModal.vue';
import * as analytics from '@/utils/analytics';

describe('PrivacyModal component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
    vi.spyOn(analytics, 'analyticsPermittedInitially', 'get').mockReturnValue(true);
  });

  it('closes the modal when the close button is clicked', async () => {
    const wrapper = mount(PrivacyModal, {
      props: {
        visible: true,
        'onUpdate:visible': (e: boolean) => wrapper.setProps({ visible: e }),
      },
    });

    expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(true);

    const closeButton = wrapper.find('button[aria-label="close"]');
    expect(closeButton.exists()).toBe(true);
    await closeButton.trigger('click');

    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(false);
    });
  });

  it('displays opted-in text when analytics are permitted', () => {
    vi.spyOn(analytics, 'analyticsPermittedInitially', 'get').mockReturnValue(true);

    const wrapper = mount(PrivacyModal, {
      props: { visible: true },
    });

    const statusText = wrapper.find('[data-testid="privacyModalOptInStatus"]');
    expect(statusText.text()).toContain('You are currently opted in to this data collection');
    expect(statusText.text()).toContain('You can opt out of this data collection');
  });

  it('displays opted-out text when analytics are not permitted', () => {
    vi.spyOn(analytics, 'analyticsPermittedInitially', 'get').mockReturnValue(false);

    const wrapper = mount(PrivacyModal, {
      props: { visible: true },
    });

    const statusText = wrapper.find('[data-testid="privacyModalOptInStatus"]');
    expect(statusText.text()).toContain('You are currently opted out of this data collection');
    expect(statusText.text()).toContain('You can opt back in to this data collection');
  });
});
