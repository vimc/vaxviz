import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

import PrivacyModal from '@/components/PrivacyModal.vue';

describe('PrivacyModal component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetModules();
    localStorage.clear();
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

  it('displays opted-in text when analytics are permitted', async () => {
    // Default: analyticsPermittedInitially is true (no localStorage key set)
    const wrapper = mount(PrivacyModal, {
      props: { visible: true },
    });

    const statusText = wrapper.find('[data-testid="privacyModalOptInStatus"]');
    expect(statusText.text()).toContain('You are currently opted in to this data collection');
    expect(statusText.text()).toContain('You can opt out of this data collection');
  });

  it('displays opted-out text when analytics are not permitted', async () => {
    localStorage.setItem('analyticsDisabled', 'true');
    // Need to re-import to pick up the new localStorage value
    const { default: PrivacyModalFresh } = await import('@/components/PrivacyModal.vue');

    const wrapper = mount(PrivacyModalFresh, {
      props: { visible: true },
    });

    const statusText = wrapper.find('[data-testid="privacyModalOptInStatus"]');
    expect(statusText.text()).toContain('You are currently opted out of this data collection');
    expect(statusText.text()).toContain('You can opt back in to this data collection');
  });
});
