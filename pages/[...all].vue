<script setup lang="ts">
definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Page Not Found'
})

onMounted(() => {
  const route = useRoute()
  if (route.path !== '/error') {
    navigateTo('/error', { replace: true })
  }
})
</script>

<template>
  <div class="relative h-full z-0">
    <!-- Background image (behind content only, not the footer) -->
    <div
      class="absolute left-1/2 -translate-x-1/2 top-0 -bottom-10 md:-bottom-20 -z-10 w-[100vw] bg-cover bg-center opacity-100 pointer-events-none"
      style="background-image: url('/404.svg');"
      aria-hidden="true"
    />
    <!-- Content positioned like Etherscan - higher on page, not centered -->
    <div class="pt-20 pb-16">

      <div class="mb-4">

        <h1 class="text-2xl md:text-3xl lg:text-4xl text-font-secondary mb-2">
          Sorry! We encountered an unexpected error.
        </h1>
      
        <p class="text-font-secondary text-[14px]">
          An unexpected error occurred or the page you are looking for does not exist.
        </p>

        <p class="text-font-secondary text-[14px]">
          Please check again later.
        </p>

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
