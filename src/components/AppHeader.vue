<template>
  <header class="border-b border-gray-300">
    <div class="flex flex-col absolute">
      <a href="https://www.vaccineimpact.org/" target="_blank" rel="noopener noreferrer">
        <img src="/logo.png" id="logo" alt="VIMC logo" />
      </a>
    </div>
    <div
      id="headingContainer"
      class="flex items-center justify-between gap-8 max-w-max mx-auto"
    >
      <div class="flex items-center">
        <h1 class="text-2xl font-semibold text-brand brand-heading tracking-tight">
          VAXVIZ
        </h1>
        <span class="text-xl font-light text-brand ms-4 me-3">|</span>
        <p class="font-light text-lg text-dark-brand tracking-tight">
          Vaccine impact visualization tool
        </p>
      </div>
    </div>
    <div
      id="blurbContainer"
      class="absolute float-right flex flex-col"
    >
      <div class="flex flex-col gap-4 items-end my-auto">
        <p class="text-right text-xs text-gray-500">
          This is a data visualization for
          <a href="https://doi.org/10.1016/S0140-6736(26)00555-6" target="_blank" rel="noopener noreferrer">
            <span>&lsquo;Quantifying relative health impact across Gavi, the Vaccine Alliance's portfolio in 117 countries at the subregional level: a modelling study&rsquo;</span>
          </a>.
        </p>
        <div class="flex gap-10">
          <button
            id="aboutButton"
            @click="aboutModalVisible = true"
            class="link"
          >
            About
          </button>
          <button
            id="privacySettingsButton"
            @click="privacyModalVisible = true"
            class="link"
          >
            Privacy
          </button>
        </div>
      </div>
    </div>
  </header>
  <FwbModal
    v-if="aboutModalVisible"
    @close="aboutModalVisible = false"
    :focus-trap="helpInfoStore.enableFocusTraps"
  >
    <template #header>
      <div class="text-lg ps-2 font-medium">
        About this tool
      </div>
    </template>
    <template #body>
      <div class="flex flex-col gap-y-4 leading-relaxed">
        <!-- NB: The number of diseases is 14 per the paper, and not (necessarily) the length of diseaseOptions.json, which may carve up diseases differently (particularly meningitis). -->
        <p>
          This data visualization tool accompanies VIMC's fourth publication:
          <a href="https://doi.org/10.1016/S0140-6736(26)00555-6" target="_blank" rel="noopener noreferrer">
            <span>&lsquo;Quantifying relative health impact across Gavi, the Vaccine Alliance's portfolio in 117 countries at the subregional level: a modelling study&rsquo;</span>
          </a>.
        </p>
        <p>
          It shows VIMC's estimates of health impact from vaccination against 14 diseases in {{ countryOptions.length }} low- and middle-income countries from 2000 to 2030
          (2040 for cholera) for the <a href="https://www.gavi.org/" target="_blank" rel="noopener noreferrer">Gavi</a> portfolio of vaccination programmes.
        </p>
        <p>
          Model estimates are presented in terms of 'vaccine impact ratios', defined as deaths or disability-adjusted life years (DALYs) averted per 1000 vaccinations.
        </p>
        <p class="text-xs text-gray-500 mt-2">
          Vaxviz version: {{ version }}
        </p>
      </div>
    </template>
  </FwbModal>
  <PrivacyModal
    v-model:visible="privacyModalVisible"
  />
</template>

<script setup lang="ts">
import { FwbModal } from 'flowbite-vue';
import countryOptions from '@/data/options/countryOptions.json';
import { ref } from 'vue';

import { version } from '@/../package.json';
import { useHelpInfoStore } from '@/stores/helpInfoStore';
import PrivacyModal from './PrivacyModal.vue';

const helpInfoStore = useHelpInfoStore();

const aboutModalVisible = ref(false);
const privacyModalVisible = ref(false);
</script>

<style scoped lang="scss">
.brand-heading {
  font-family: Century Gothic, Montserrat, var(--font-sans);
  letter-spacing: 0.075rem;
}
</style>
