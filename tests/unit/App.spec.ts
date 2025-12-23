import { describe, it, expect, beforeEach } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '@/App.vue'
import { setActivePinia, createPinia } from 'pinia';

describe('App component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the controls', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain("Burden metric")
  })
})
