<script setup lang="ts">
import { fetchSharedKadenaData } from '~/composables/useSharedData';

const route = useRoute();

// Fetch the data once globally.
await useAsyncData('global-kda-fetch', () => fetchSharedKadenaData());
</script>

<template>
  <div
    class="h-screen flex flex-col items-center !font-sans"
  >
    <HeaderMasterTopBar />
    <HeaderTopbar/>

    <div class="w-full grow relative">
      <img
        v-if="route.name === 'index'"
        src="/kadena-background.webp"
        alt="Kadena background illustration"
        class="absolute top-0 left-0 w-full h-[250px] object-cover -z-10 pointer-events-none"
      />
      <div class="h-full px-3 pt-6 pb-10 lg:px-5 lg:pt-4 lg:pb-20 max-w-[1400px] w-full mx-auto">
        <slot />
      </div>
    </div>

    <Footer
      v-if="route.name !== 'all'"
    />
  </div>
</template>

<style>
html {
  scrollbar-gutter: stable;
}

body.modal-open {
  overflow: hidden;
}

/* Custom Scrollbar Styles */
/* For Webkit-based browsers (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 16px;
}

::-webkit-scrollbar-track {
  background: #2d2d2d;
}

::-webkit-scrollbar-thumb {
  background-color: #2d2d2d;
  border-radius: 8px;
  border: 1px solid #3d3d3d;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #4a4a4a;
}

/* For Firefox */
html {
  scrollbar-width: auto; /* 'auto' is the default, 'thin' is the other option */
  scrollbar-color: #6b6b6b #2d2d2d;
}
</style>
