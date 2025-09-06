<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    fill="none"
    class="w-4 h-4"
  >
    <path d="M25.7,10.9C23.9,7.4,20.2,5,16,5c-4.7,0-8.6,2.9-10.2,7" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" />
    <path d="M6.2,21c1.8,3.5,5.5,6,9.8,6c4.7,0,8.6-2.9,10.2-7" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" />
    <polyline points="26,5 26,11 20,11" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" fill="none" />
    <polyline points="6,27 6,21 12,21" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" fill="none" />
  </svg>
</template>

<script setup lang="ts">
defineProps({ class: { type: String, required: false } })
</script>


