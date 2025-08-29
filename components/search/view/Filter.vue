<script setup lang="ts">
defineProps<{
  label: string,
  isActive?: boolean,
}>()
</script>

<template>
  <div
    class="cursor-pointer px-2 py-1 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap relative"
    :class="isActive ? 'bg-[#009367] text-[#f5f5f5]' : 'bg-[#252525] text-[#f5f5f5] hover:bg-[#333333]'"
  >
    <span>
      {{ label }}
    </span>
  </div>
</template>
