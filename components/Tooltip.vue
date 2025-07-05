<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  value?: string,
}>();

const isVisible = ref(false);
</script>

<template>
  <div
    class="relative inline-block"
    @mouseenter="isVisible = true"
    @mouseleave="isVisible = false"
  >
    <slot />
    <Transition name="fade">
      <div
        v-if="isVisible"
        class="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px]"
      >
        <div class="bg-[#313131] text-[#e5e5e5] text-xs px-2 py-1 rounded-md shadow-lg relative text-center">
          {{ value }}
          <div class="absolute w-3 h-3 bg-[#313131] rotate-45 left-1/2 -translate-x-1/2 bottom-[-4px]"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
