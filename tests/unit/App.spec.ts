import { describe, it, expect, beforeEach } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'
import { setActivePinia, createPinia } from 'pinia';

describe('App component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders correctly', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain("Burden metric")
  })
})
