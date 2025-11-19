<script setup lang="ts">
import { fetchSharedKadenaData } from "~/composables/useSharedData";
import HomeAnimation from "~/components/home/Animation.vue";

const route = useRoute();

// Fetch the data once globally.
await useAsyncData("global-kda-fetch", async () => {
  await fetchSharedKadenaData();
  return true;
});
</script>

<template>
  <div class="h-screen flex flex-col items-center !font-sans">
    <HeaderMasterTopBar />
    <HeaderTopbar />
    <ConsentBanner />

    <div class="w-full grow relative">
      <div
        class="relative h-full px-3 pt-6 pb-10 md:px-5 md:pt-4 md:pb-20 max-w-[1400px] w-full mx-auto"
      >
        <HomeAnimation
          v-if="route.name === 'index'"
          class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[250px] object-cover -z-10 pointer-events-none"
        />
        <slot />
      </div>
    </div>

    <Footer />
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
  background: rgb(var(--line-strong));
}

::-webkit-scrollbar-thumb {
  background-color: rgb(var(--line-strong));
  border-radius: 8px;
  border: 1px solid rgb(var(--line-strong));
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgb(var(--font-tertiary));
}

/* For Firefox */
html {
  scrollbar-width: auto; /* 'auto' is the default, 'thin' is the other option */
  scrollbar-color: rgb(var(--font-tertiary)) rgb(var(--line-strong));
}
</style>
