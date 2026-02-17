<template>
  <header class="border-b border-gray-300">
    <div class="flex flex-col absolute">
      <a href="https://www.vaccineimpact.org/" target="_blank">
        <img src="/logo.png" id="logo" alt="VIMC logo" />
      </a>
    </div>
    <div
      id="headingContainer"
      class="flex items-center justify-between gap-8 max-w-max mx-auto"
    >
      <div
        v-if="showPageHeading"
        class="flex items-center"
      >
        <h1 class="text-2xl font-semibold text-brand brand-heading tracking-tight">
          VAXVIZ
        </h1>
        <span class="text-xl font-light text-brand ms-4 me-3">|</span>
        <p class="font-light text-lg text-dark-brand tracking-tight">
          Vaccine impact visualization tool
        </p>
      </div>
      <!-- TODO: When paper is published and data finalised, remove this warning. -->
      <FwbAlert
        type="danger"
        class="border-t-4 rounded-none max-h-20 py-3"
        closable
        @close="showPageHeading = true"
      >
        <template #icon>
          <img class="w-4 h-4 mr-2" src="@/assets/images/icons/dangerInfoIcon.svg" alt=""/>
        </template>
        <template #default>
          <div>
            <h2 class="text-lg font-medium">
              Provisional estimates. Not to be forwarded or cited.
            </h2>
            <p class="mt-2">This is a preview. All estimates shown are representative only. Do not use or forward them.</p>
          </div>
        </template>
      </FwbAlert>
    </div>
    <div
      id="blurbContainer"
      class="absolute float-right flex flex-col"
    >
      <div class="flex flex-col gap-4 items-end my-auto">
        <!-- TODO: When paper is published, add the link, and remove 'forthcoming'. -->
        <p class="text-right text-sm">This data visualization tool accompanies Gaythorpe et al. (forthcoming)</p>
        <button
          id="aboutLink"
          @click="aboutModalVisible = true"
          href="#"
          class="link"
        >
          About
        </button>
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
        <!-- TODO: When paper is published, add the link and replace '(forthcoming)' with '(2026)'. -->
        <!-- NB: The number of diseases is 14 per the paper, and not (necessarily) the length of diseaseOptions.json, which may carve up diseases differently (particularly Meningitis). -->
        <p>
          This data visualization tool accompanies VIMC's fourth publication, Gaythorpe et al (forthcoming).
        </p>
        <!-- TODO: The commented text will be uncommented once the estimates are final / published; until then we have to caveat them. -->
        <!-- <p>
          It shows VIMC's estimates of health impact from vaccination against 14 diseases in {{ countryOptions.length }} low- and middle-income countries from 2000 to 2030
          (2040 for cholera) for the <a href="https://www.gavi.org/" target="_blank">Gavi</a> portfolio of vaccination programmes.
        </p> -->
        <p>
          Once that paper is published, this will show VIMC's estimates of health impact from vaccination against 14 diseases in {{ countryOptions.length }} low- and middle-income countries from 2000 to 2030
          (2040 for cholera) for the <a href="https://www.gavi.org/" target="_blank">Gavi</a> portfolio of vaccination programmes. The numbers shown are only representative, pending publication.
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
</template>

<script setup lang="ts">
import { FwbAlert, FwbModal } from 'flowbite-vue';
import countryOptions from '@/data/options/countryOptions.json';
import { ref } from 'vue';

import { version } from '@/../package.json';
import { useHelpInfoStore } from '@/stores/helpInfoStore';

const helpInfoStore = useHelpInfoStore();

const aboutModalVisible = ref(false);
const showPageHeading = ref(false);
</script>

<style scoped lang="scss">
.brand-heading {
  font-family: Century Gothic, Montserrat, var(--font-sans);
  letter-spacing: 0.075rem;
}
</style>
