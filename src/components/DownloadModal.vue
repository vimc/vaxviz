<template>
  <FwbButton
    @click="downloadModalVisible = true"
    color="light"
    class="cursor-pointer"
  >
    <span class="flex items-center gap-2 justify-center">
      <DownloadIcon class="size-4" />
      Downloads
    </span>
  </FwbButton>
  <!-- We can't use focus-trap here as its use of preventDefault prevents programmatic downloads -->
  <FwbModal
    v-if="downloadModalVisible"
    @close="handleModalClose"
    :focus-trap="false"
    class="wide-modal top-modal"
  >
    <template #header>
      <div class="text-lg ps-2 font-medium flex items-center gap-2 justify-center">
        <DownloadIcon class="size-5" />
        Downloads
      </div>
    </template>
    <template #body>
      <div>
        <div class="mb-8 flex flex-col leading-relaxed gap-y-4">
          <p>
            These downloadable summary tables contain the mean and median estimates, as well as 95% confidence intervals, of the impact ratios from each set of model runs. All diseases are included where applicable.
          </p>
          <p>
            By default, the file(s) relevant to the current plot view are pre-selected, but you can select any combination of files to download, either using the filters below to filter the options, or by individually selecting the files from the drop-down.
          </p>
        </div>
        <DownloadSelect v-model:menu-open="menuOpen" />
      </div>
    </template>
  </FwbModal>
</template>

<script setup lang="ts">
import { FwbButton, FwbModal } from 'flowbite-vue';
import { ref } from 'vue';
import DownloadIcon from './DownloadIcon.vue';
import DownloadSelect from './DownloadSelect.vue';

const downloadModalVisible = ref(false);
const menuOpen = ref(false);

const handleModalClose = () => {
  // If the user presses Escape while the VueSelect menu is open,
  // they probably mean to close only that menu, not the download modal as well.
  if (!menuOpen.value) {
    downloadModalVisible.value = false
  }
};
</script>

