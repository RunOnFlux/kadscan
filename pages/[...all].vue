<script setup lang="ts">
definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Page Not Found | Kadscan'
})
</script>

<template>
  <div class="relative min-h-[calc(50vh-200px)]">
    <!-- Content positioned like Etherscan - higher on page, not centered -->
    <div class="pt-20 pb-16">

      <div class="mb-4">

        <h1 class="text-2xl md:text-3xl lg:text-4xl text-[#bbbbbb] mb-2">
          Sorry! We encountered an unexpected error.
        </h1>
      
        <p class="text-[#bbbbbb] text-[14px]">
          An unexpected error occurred or the page you are looking for does not exist.
        </p>

        <p class="text-[#bbbbbb] text-[14px]">
          Please check again later.
        </p>

      </div>
      
      <div class="py-5">
        <NuxtLink to="/">
          <button class="bg-[#0584c3] hover:bg-[#0584c3]/80 text-[#f5f5f5] px-3 py-1.5 rounded-lg transition-colors duration-200 text-[15px]">
            Back Home
          </button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional styling for the 404 page */
</style>
