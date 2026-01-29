<template>
  <header class="border-b border-gray-300 flex items-center justify-between gap-2">
    <div class="flex flex-col">
      <a href="https://www.vaccineimpact.org/" target="_blank">
        <img src="/logo.png" id="logo" alt="VIMC logo" />
      </a>
    </div>
    <!-- TODO: When paper is published and data finalised, remove this warning. -->
    <FwbAlert
      type="danger"
      class="border-t-4 rounded-none max-h-20 py-3"
    >
      <template #icon>
        <img class="w-4 h-4 mr-2" src="@/assets/images/icons/dangerInfoIcon.svg" alt=""/>
        <span class="sr-only">Error</span>
      </template>
      <template #title>
        <h3 class="text-lg font-medium">
          Provisional estimates. Not to be forwarded or cited.
        </h3>
      </template>
      <template #default>
        <p class="mt-2">This is a preview. All estimates shown are representative only. Do not use or forward them.</p>
      </template>
    </FwbAlert>
    <div class="flex flex-col gap-4 items-end">
      <!-- TODO: When paper is published, add the link, and remove 'forthcoming'. -->
      <p class="text-right">This visualization tool accompanies Gaythorpe et al. (forthcoming)</p>
      <button
        id="aboutLink"
        @click="aboutModalVisible = true"
        href="#"
        class="link"
      >
        About
      </button>
    </div>
  </header>
  <FwbModal
    v-if="aboutModalVisible"
    @close="aboutModalVisible = false"
  >
    <template #header>
      <div class="text-lg">
        About
      </div>
    </template>
    <template #body>
      <div class="flex flex-col gap-y-4 leading-relaxed">
        <!-- TODO: When paper is published, add the link and replace '(forthcoming)' with '(2026)'. -->
        <!-- NB: The number of diseases is 14 per the paper, and not (necessarily) the length of diseaseOptions.json, which may carve up diseases differently (particularly Meningitis). -->
        <p>
          This visualization tool accompanies VIMC's fourth publication, Gaythorpe et al (forthcoming).
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

const aboutModalVisible = ref(false);
</script>
