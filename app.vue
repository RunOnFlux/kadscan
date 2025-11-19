<script setup lang="ts">
import '@fontsource/inter/latin.css'
import '@fontsource/roboto/latin.css'
import { onMounted } from 'vue';

useHead({
  titleTemplate: title => title || 'Kadscan: Block Explorer',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: 'Kadscan powers visibility into Kadena through block explorer and analytics.'
    },
    {
      hid: 'robots',
      name: 'robots',
      content: 'index, follow'
    },
    {
      hid: 'googlebot',
      name: 'googlebot',
      content: 'index, follow'
    }
  ]
})

// Default Open Graph and Twitter card metadata for link previews
useSeoMeta({
  title: 'Kadscan: Block Explorer',
  description: 'Kadscan powers visibility into Kadena through block explorer and analytics.',
  ogTitle: 'Kadscan: Block Explorer',
  ogDescription: 'Kadscan powers visibility into Kadena through block explorer and analytics.',
  ogType: 'website',
  ogUrl: 'https://kadscan.io/',
  ogImage: 'https://kadscan.io/kadscan.jpeg',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Kadscan: Block Explorer',
  twitterDescription: 'Kadscan powers visibility into Kadena through block explorer and analytics.',
  twitterImage: 'https://kadscan.io/kadscan.jpeg',
})

// Provide recommended dimensions for better compatibility
useHead({
  meta: [
    { property: 'og:image:width', content: '1545' },
    { property: 'og:image:height', content: '425' },
  ],
})

</script>

<template>
  <Html lang="en" />
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
  body {
    background-color: rgb(var(--surface-tertiary));
    height: 100%;
  }

  html {
    height: 100%;
  }

  body::-webkit-scrollbar {
    -webkit-appearance: none !important;
    width: 7px !important;
  }

  body::-webkit-scrollbar-thumb {
    border-radius: 20px !important;
    background-color: rgb(var(--font-tertiary)) !important;
    -webkit-box-shadow: 0 0 1px rgb(var(--surface-white) / 0.836) !important;
  }

 .scrollbar-custom::-webkit-scrollbar {
    -webkit-appearance: none !important;
    width: 8px !important;
  }

  .scrollbar-custom::-webkit-scrollbar-thumb {
    border-radius: 20px !important;
    background-color: rgb(var(--surface-secondary) / 0.8) !important;
    -webkit-box-shadow: 0 0 1px rgb(var(--surface-white) / 0.5) !important;
  }
</style>
