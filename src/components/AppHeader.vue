<template>
  <header class="border-b border-gray-300 flex items-center justify-between">
    <div class="flex flex-col gap-2">
      <a href="https://www.vaccineimpact.org/">
        <img src="/logo.png" class="" alt="VIMC logo" />
      </a>
    </div>
    <div class="flex flex-col gap-4 max-w-100 items-end">
      <!-- TODO: When paper is published, add the href. -->
      <p class="text-right">This visualization tool accompanies <a href="#">Gaythorpe et al.</a></p>
      <a @click.prevent="aboutModalVisible = true" href="#" class="text-fg-brand underline">
        About
      </a>
    </div>
  </header>
  <FwbModal
    v-show="aboutModalVisible"
    @close="aboutModalVisible = false"
    focus-trap
  >
    <template #header>
      <div class="text-lg">
        About
      </div>
    </template>
    <template #body>
      <div class="flex flex-col gap-y-4 leading-relaxed">
        <!-- TODO: When paper is published, add the href. -->
        <p>
          This visualization tool accompanies VIMC's fourth publication, <a href="#">Gaythorpe et al</a> (2026).
        </p>
        <!-- TODO: The commented text will be uncommented once the estimates are final / published; until then we have to caveat them. -->
        <!-- <p>
          It shows VIMC's estimates of health impact from vaccination against 14 diseases in {{ countryOptions.length }} low- and middle-income countries from 2000 to 2030
          (2040 for cholera) for the <a href="https://www.gavi.org/">Gavi</a> portfolio of vaccination programmes.
        </p> -->
        <!-- NB: The number of diseases is 14 per the paper, and not (necessarily) the length of diseaseOptions.json, which may carve up diseases differently (particularly Meningitis). -->
        <p>
          Once that paper is published, this will show VIMC's estimates of health impact from vaccination against 14 diseases in {{ countryOptions.length }} low- and middle-income countries from 2000 to 2030
          (2040 for cholera) for the <a href="https://www.gavi.org/">Gavi</a> portfolio of vaccination programmes. The numbers shown are only representative, pending publication.
        </p>
        <p>
          Model estimates are presented in terms of 'vaccine impact ratios', defined as deaths or disability-adjusted life years (DALYs) averted per vaccination.
        </p>
      </div>
    </template>
  </FwbModal>
</template>

<script setup lang="ts">
import { FwbModal } from 'flowbite-vue';
import countryOptions from '@/data/options/countryOptions.json';
import { ref } from 'vue';

const aboutModalVisible = ref(false);
</script>
