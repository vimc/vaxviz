import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

export const checkCheckbox = async (wrapper: ReturnType<typeof mount>, label: string) => {
  const checkbox = wrapper.findAll('label').find(l => l.text() === label)?.find('input');
  await checkbox!.setValue(true);
  await nextTick();
};
