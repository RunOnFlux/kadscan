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
