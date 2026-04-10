import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils'
import EmbargoNotice from "../../../src/components/EmbargoNotice.vue";

describe("EmbargoNotice component", () => {
  it("shows expected embargo notice", () => {
    const wrapper = mount(EmbargoNotice);
    expect(wrapper.text()).toContain(
      "VIMC Vaxviz is embargoed until the publication of the related paper " +
      "\"Quantifying relative health impact across Gavi, the Vaccine Alliance’s portfolio in 117 " +
      "countries at the subregional level: a modelling study\"."
    );
    expect(wrapper.find("img").attributes("src")).toBe("/logo.png");
  });
});
