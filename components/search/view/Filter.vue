<script setup lang="ts">
defineProps<{
  label: string,
  isActive?: boolean,
}>()
</script>

<template>
  <div
    class="cursor-pointer px-3 py-1 rounded-lg  font-medium transition-colors whitespace-nowrap relative"
    :class="isActive ? 'bg-[#0784c3] text-white' : 'bg-[#222222] text-[#fafafa] hover:bg-[#333333]  '"
  >
    <span>
      {{ label }}
    </span>
  </div>
</template>
