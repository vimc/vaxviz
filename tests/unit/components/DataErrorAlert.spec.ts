import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import DataErrorAlert from '@/components/DataErrorAlert.vue';
import { useDataStore } from '@/stores/dataStore';

describe('DataErrorAlert component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  it("should display any error details from data store", async () => {
    const dataStore = useDataStore();
    dataStore.dataErrors = [{ e: new Error(), message: 'Simulated error' }];

    const wrapper = mount(DataErrorAlert);

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('This may be an intermittent issue. Try again');
      const details = wrapper.find('details');
      expect(details.text()).toContain('Error details');
      expect(details.text()).toContain('Simulated error');
    });
  });

  it('should display multiple error messages joined together', async () => {
    const dataStore = useDataStore();
    dataStore.dataErrors = [
      { e: new Error(), message: 'Simulated error 1' },
      { e: new Error(), message: 'Simulated error 2' }
    ];

    const wrapper = mount(DataErrorAlert);
    
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('This may be an intermittent issue. Try again');
      const details = wrapper.find('details');
      expect(details.text()).toContain('Error details');
      expect(details.text()).toContain('Simulated error 1');
      expect(details.text()).toContain('Simulated error 2');
    });
  });
});
