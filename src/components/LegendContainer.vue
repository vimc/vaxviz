<template>
  <div class="flex my-4 gap-x-4 gap-y-7 flex-wrap">
    <div
      id="legendContainer"
      class="w-fit max-xl:ml-10!"
    >
      <ColorLegend v-if="colorStore.colorMapping.size >= 2 || focusesWithoutData.length"/>
    </div>
    <HelpInfos />
    <FwbAlert
      v-if="legendWarnings.length"
      class="w-fit h-full ml-auto"
      icon
    >
      <div class="flex flex-col gap-y-1">
        <p v-for="(warning, index) in legendWarnings" :key="index">
          {{ warning }}
        </p>
      </div>
    </FwbAlert>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FwbAlert } from 'flowbite-vue';
import { useAppStore } from '@/stores/appStore';
import { useColorStore } from '@/stores/colorStore';
import { meningitisVaccines } from '@/utils/options';
import ColorLegend from '@/components/ColorLegend.vue';
import HelpInfos from './HelpInfos.vue';

const props = defineProps<{
  focusesWithoutData: string[];
}>();

const appStore = useAppStore();
const colorStore = useColorStore();

const legendWarnings = computed(() => {
  const warnings = [];
  if (appStore.focuses.some(f => meningitisVaccines.includes(f)) && !appStore.splitByActivityType) {
    warnings.push("Estimates for meningitis vaccines (MenA/MenACWYX) are only available at the activity type (campaign/routine) level.");
  } else if (appStore.focuses.includes('Meningitis') && appStore.splitByActivityType) {
    warnings.push("Estimates for ‘Meningitis’ are not available at the activity type (campaign/routine) level.");
  }
  if (props.focusesWithoutData.length) {
    warnings.push(`No estimates available with current options for the following focus selection(s): ${props.focusesWithoutData.join(", ")}.`);
  }
  return warnings;
});
</script>

<style lang="scss" scoped>
</style>
