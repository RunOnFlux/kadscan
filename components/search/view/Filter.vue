<script setup lang="ts">
defineProps<{
  label: string,
  isActive?: boolean,
}>()
</script>

<template>
  <div
    class="cursor-pointer px-2 py-1 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap relative"
    :class="isActive ? 'bg-accent-strong text-font-primary' : 'bg-surface-hover text-font-primary hover:bg-tab-bg-hover'"
  >
    <span>
      {{ label }}
    </span>
  </div>
</template>
