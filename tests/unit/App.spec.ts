import { describe, it, expect, beforeEach, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '@/App.vue'
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

describe('App component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  it('renders the controls', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain("Burden metric")
  })
})
