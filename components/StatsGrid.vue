<script setup lang="ts">
defineProps({
  cards: {
    type: Array as () => Array<{ label: string, value: string | number }>,
    required: true,
  },
});
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
    <div
      v-for="card in cards"
      :key="card.label"
      class="bg-surface-primary border border-[#222222] rounded-xl p-4 shadow-[0_0_20px_rgba(255,255,255,0.0625)]"
    >
      <p class="text-[12px] text-font-secondary mb-1 uppercase tracking-wider">{{ card.label }}</p>
      <p class="text-[18px] text-font-primary">{{ card.value }}</p>
    </div>
  </div>
</template> 