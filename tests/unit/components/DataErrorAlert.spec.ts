import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import DataErrorAlert from '@/components/DataErrorAlert.vue';

describe('DataErrorAlert component', () => {
  it("should display any error details from props", async () => {
    const wrapper = mount(DataErrorAlert, {
      props: {
        errors: [{ e: new Error(), message: 'Simulated error' }],
        title: 'Error loading data',
      }
    });

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Error loading data');
      expect(wrapper.text()).toContain('This may be an intermittent issue. Try again');
      const details = wrapper.find('details');
      expect(details.text()).toContain('Error details');
      expect(details.text()).toContain('Simulated error');
    });
  });

  it('should display multiple error messages joined together', async () => {
    const wrapper = mount(DataErrorAlert, {
      props: {
        errors: [
          { e: new Error(), message: 'Simulated error 1' },
          { e: new Error(), message: 'Simulated error 2' }
        ],
        title: 'Error downloading files',
      }
    });

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Error downloading files');
      expect(wrapper.text()).toContain('This may be an intermittent issue. Try again');
      const details = wrapper.find('details');
      expect(details.text()).toContain('Error details');
      expect(details.text()).toContain('Simulated error 1');
      expect(details.text()).toContain('Simulated error 2');
    });
  });

  it('should not render when errors array is empty', () => {
    const wrapper = mount(DataErrorAlert, {
      props: {
        errors: [],
        title: 'Error loading data',
      }
    });

    expect(wrapper.find('.m-5').exists()).toBe(false);
  });
});
