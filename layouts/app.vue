<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <div
    class="h-screen flex flex-col items-center !font-sans"
  >
    <div
      class="w-full bg-blue-400"
    >
      <div class="max-w-[1352px] mx-auto">
        <HeaderTopbar/>
      </div>
    </div>

    <div
      class="
        w-full grow
        px-5
        pt-4 md:pt-6
        pb-20
      "
    >
      <slot />
    </div>

    <Footer
      v-if="route.name !== 'all'"
    />
  </div>
</template>
