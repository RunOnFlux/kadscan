<script setup lang="ts">
import { computed } from 'vue';
import {
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

type Position = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';

const props = withDefaults(defineProps<{
  items: any[];
  position?: Position;
  maxVisible?: number;
}>(), {
  position: 'bottom-left',
  maxVisible: 5,
});

const positionClasses = computed(() => {
  switch (props.position) {
    case 'bottom-right':
      return 'origin-top-right right-0 top-[calc(100%+8px)]';
    case 'top-left':
      return 'origin-bottom-left left-0 bottom-[calc(100%+8px)]';
    case 'top-right':
      return 'origin-bottom-right right-0 bottom-[calc(100%+8px)]';
    case 'left-top':
      return 'origin-top-right top-0 right-[calc(100%+8px)]';
    case 'left-bottom':
      return 'origin-bottom-right bottom-0 right-[calc(100%+8px)]';
    case 'right-top':
      return 'origin-top-left top-0 left-[calc(100%+8px)]';
    case 'right-bottom':
      return 'origin-bottom-left bottom-0 left-[calc(100%+8px)]';
    case 'bottom-left':
    default:
      return 'origin-top-left left-0 top-[calc(100%+8px)]';
  }
});
</script>

<template>
  <transition
    enter-active-class="transition duration-100 ease-out"
    enter-from-class="transform scale-95 opacity-0"
    enter-to-class="transform scale-100 opacity-100"
    leave-active-class="transition duration-75 ease-in"
    leave-from-class="transform scale-100 opacity-100"
    leave-to-class="transform scale-95 opacity-0"
  >
  <ListboxOptions
    class="
      z-[99999]
      px-3
      py-2
      border border-[#222222]
      rounded-lg
      absolute
      bg-[#111111]
      shadow-[0_0_15px_rgba(255,255,255,0.0625)]
      overflow-y-auto no-scrollbar
    "
    :class="positionClasses"
    :style="{ maxHeight: `${(props.maxVisible ?? 5) * 40}px` }"
  >
    <ListboxOption
      v-for="item in items"
      :key="item.value"
      :value="item"
      as="template"
    >
      <li
        class="group flex w-full items-center hover:bg-[#222222] text-[#f5f5f5] hover:text-[#00e19d] justify-start rounded-md px-3 py-2 text-sm"
      >
        <span
          class="
            text-sm
          "
        >
          {{ item.label }}
        </span>
      </li>
    </ListboxOption>
  </ListboxOptions>
</transition>
</template> 

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>