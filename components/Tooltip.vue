<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { usePopper } from '~/composables/usePopper';

const props = withDefaults(defineProps<{
  value?: string,
  variant?: 'default' | 'hash',
  offsetDistance?: number,
  disabled?: boolean,
  placement?: 'top' | 'right' | 'bottom' | 'left',
}>(), {
  offsetDistance: 4,
  disabled: false,
  placement: 'top',
});

const isVisible = ref(false);
const [reference, popper, instance] = usePopper({
  placement: props.placement,
  offsetDistance: props.offsetDistance
});

watch(() => props.value, () => {
  if (instance.value && isVisible.value) {
    instance.value.update();
  }
});

watch(isVisible, async (visible) => {
  if (visible) {
    await nextTick();
    if (instance.value) {
      instance.value.update();
    }
  }
});

const tooltipClass = computed(() => {
  const base = 'z-10 w-max';
  if (props.variant === 'hash') {
    return `${base} max-w-md`;
  }
  return `${base} max-w-[200px]`;
});

const arrowClass = computed(() => {
  const base = '-z-10 absolute w-3 h-3 bg-[#313131] rotate-45';
  switch (props.placement) {
    case 'top':
      return `${base} left-1/2 -translate-x-1/2 bottom-[-4px]`;
    case 'right':
      return `${base} left-[-4px] top-1/2 -translate-y-1/2`;
    case 'bottom':
      return `${base} left-1/2 -translate-x-1/2 top-[-4px]`;
    case 'left':
      return `${base} right-[-4px] top-1/2 -translate-y-1/2`;
    default:
      return '';
  }
});
</script>

<template>
  <div
    ref="reference"
    class="relative inline-block"
    @mouseenter="!disabled && (isVisible = true)"
    @mouseleave="isVisible = false"
  >
    <slot />
    <Teleport to="body">
      <Transition name="fade">
        <div
          ref="popper"
          v-show="isVisible"
          :class="tooltipClass"
        >
          <div class="z-[10] bg-[#313131] text-[#e5e5e5] text-xs px-2 py-1 rounded-md shadow-lg relative text-center isolate">
            {{ value }}
            <div :class="arrowClass"></div>
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
