<template>
  <FwbModal
    v-if="visible"
    @close="visible = false"
    :focus-trap="helpInfoStore.enableFocusTraps"
  >
    <template #header>
      <div class="text-lg ps-2 font-medium">
        Privacy settings
      </div>
    </template>
    <template #body>
      <div class="flex flex-col gap-y-4 leading-relaxed">
        <p>
          We use <a href="https://posthog.com/" target="_blank">Posthog</a> to measure how Vaxviz is used.
          We do not use cookies.
        </p>
        <p>
          For these analytical purposes, we collect data on page views, session duration, device type, and location (country).
          This data is statistically aggregated and does not identify or track individual users across sessions.
        </p>
        <p>
          We use this data to understand how visitors are using the tool and to help us improve it.
        </p>
        <p>
          Access to this data is limited to VIMC and the Vaxviz development team.
        </p>
        <p data-testid="privacyModalOptInStatus">
          The collection of data as described above is enabled by default.
          You are currently opted {{ analyticsPermittedInitially ? 'in to' : 'out of' }} this data collection.
          You can opt {{ analyticsPermittedInitially ? 'out of' : 'back in to' }} this data collection (for this browser) by clicking the button below.
          This will reload the page, resetting the plot controls.
          While you are opted out of data collection, your visits to Vaxviz are not tracked, but any data collected before opting out will be retained and used in aggregate analyses.
        </p>
        <FwbButton
          @click="analyticsPermittedInitially ? disableAnalytics() : enableAnalytics()"
          class="w-fit"
        >
          {{ analyticsPermittedInitially ? 'Opt out of' : 'Opt in to' }} data collection
        </FwbButton>
      </div>
    </template>
  </FwbModal>
</template>

<script setup lang="ts">
import { FwbButton, FwbModal } from 'flowbite-vue';
import { useHelpInfoStore } from '@/stores/helpInfoStore';
import { analyticsPermittedInitially, disableAnalytics, enableAnalytics } from '@/utils/analytics';

const helpInfoStore = useHelpInfoStore();

const visible = defineModel<boolean>('visible', {
  required: true,
})
</script>
