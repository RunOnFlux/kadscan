<script setup lang="ts">
import { ref } from 'vue';
import { usePopper } from '~/composables/usePopper';

defineProps<{
  value?: string,
}>();

const isVisible = ref(false);
const [reference, popper] = usePopper({
  placement: 'top',
  offsetDistance: 12
});
</script>

<template>
  <div
    ref="reference"
    class="relative inline-block"
    @mouseenter="isVisible = true"
    @mouseleave="isVisible = false"
  >
    <slot />
    <Teleport to="body">
      <Transition name="fade">
        <div
          ref="popper"
          v-if="isVisible"
          class="z-10 w-max max-w-[200px]"
        >
          <div class="bg-[#313131] text-[#e5e5e5] text-xs px-2 py-1 rounded-md shadow-lg relative text-center">
            {{ value }}
            <div class="absolute w-3 h-3 bg-[#313131] rotate-45 left-1/2 -translate-x-1/2 bottom-[-4px]"></div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
