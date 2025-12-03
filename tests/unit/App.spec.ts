import { describe, it, expect, beforeEach } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '@/stores/appStore';

describe('App component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useAppStore();
    store.initialize();
  });

  it('renders the controls', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain("Burden metric")
  })
})
