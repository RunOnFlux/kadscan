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

    <div
      class="
        w-full grow
        px-3
        pt-6
        pb-10
        lg:px-5
        lg:pt-4 
        lg:pb-20
      "
    >
      <slot />
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
  background: #111111;
}

::-webkit-scrollbar-thumb {
  background-color: #2d2d2d;
  border-radius: 8px;
  border: 3px solid #111111;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #4a4a4a;
}

/* For Firefox */
html {
  scrollbar-width: auto; /* 'auto' is the default, 'thin' is the other option */
  scrollbar-color: #2d2d2d #111111;
}
</style>
