<script setup lang="ts">
const props = defineProps<{ message?: string }>()
</script>

<template>
  <div class="relative h-full z-0">
    <div
      class="absolute left-1/2 -translate-x-1/2 top-0 -bottom-10 md:-bottom-20 -z-10 w-[100vw] bg-cover bg-center opacity-100 pointer-events-none"
      style="background-image: url('/404.svg');"
      aria-hidden="true"
    />
    <div class="pt-20 pb-16">
      <div class="mb-4">
        <h1 class="text-2xl md:text-3xl lg:text-4xl text-font-secondary mb-2">
          Sorry! We encountered an unexpected error.
        </h1>
        <p class="text-font-secondary text-[14px] ml-1">An unexpected error occurred or the page you are looking for does not exist.</p>
        <p class="text-font-secondary text-[14px] ml-1">Please check again later.</p>
        <p v-if="props.message" class="text-font-tertiary text-[12px] mt-2 break-all ml-2">What happened? {{ props.message }}</p>
      </div>
      <div class="py-5">
        <NuxtLink to="/">
          <button class="bg-accent-strong hover:bg-accent-strong/80 text-font-primary px-3 py-1.5 rounded-lg transition-colors duration-200 text-[15px]">
            Back Home
          </button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>


