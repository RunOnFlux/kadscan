<template>
  <div
    class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] mb-4"
  >
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
      <div v-for="(stat, index) in stats" :key="index" class="p-4 bg-[#151515] rounded-lg">
        <div class="text-sm text-[#bbbbbb]">{{ stat.label }}</div>
        <div class="text-xl font-bold text-[#f5f5f5]">{{ stat.value }}</div>
        <div :class="stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'" class="text-sm">
          {{ stat.change }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Mock data for dashboard stats
const stats = ref([
  { label: 'Market Cap', value: '$12.3M', change: '+2.5%' },
  { label: 'Price', value: '$0.08', change: '-1.2%' },
  { label: 'Transactions', value: '2.1M', change: '+5.0%' },
]);
</script>

<style scoped>
/* Scoped styles for the dashboard component */
</style> 