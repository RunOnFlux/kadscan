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
      content: 'Kadscan is a Block Explorer and Analytics Platform for the Kadena Blockchain.'
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
  description: 'Kadscan is a Block Explorer and Analytics Platform for the Kadena Blockchain.',
  ogTitle: 'Kadscan: Block Explorer',
  ogDescription: 'Kadscan is a Block Explorer and Analytics Platform for the Kadena Blockchain.',
  ogType: 'website',
  ogUrl: 'https://kadscan.io/',
  ogImage: 'https://kadscan.io/kadscan.jpeg',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Kadscan: Block Explorer',
  twitterDescription: 'Kadscan is a Block Explorer and Analytics Platform for the Kadena Blockchain.',
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
    background-color: #171717;
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
    background-color: #525454 !important;
    -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, 0.836) !important;
  }

 .scrollbar-custom::-webkit-scrollbar {
    -webkit-appearance: none !important;
    width: 8px !important;
  }

  .scrollbar-custom::-webkit-scrollbar-thumb {
    border-radius: 20px !important;
    background-color: #202327cc !important;
    -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, 0.5) !important;
  }
</style>
