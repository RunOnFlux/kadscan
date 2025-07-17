<script setup lang="ts">
import {
  provideUseId,
  Listbox,
  ListboxButton,
} from '@headlessui/vue'
import SelectOptions from '~/components/SelectOptions.vue'
import { useSlots } from 'vue'

const slots = useSlots()

const props = defineProps<{
  modelValue: any;
  items: any[];
  fontSize?: number;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  size?: 'small' | 'default';
}>()

const emit = defineEmits(['update:modelValue'])

provideUseId(() => useId())
</script>

<template>
  <div>
    <Listbox
      v-slot="{ open }"
      :modelValue="modelValue"
      @update:modelValue="emit('update:modelValue', $event)"
    >
      <div class="relative">
        <ListboxButton
          :class="[
            'flex items-center justify-center ring-0 outline-none shrink-0',
            size === 'small'
              ? 'gap-1 px-1 py-0.5 text-xs h-7 min-h-0'
              : 'gap-11 px-[10px] py-[0.3rem] text-[15px]'
          ]"
        >
          <template v-if="slots.default">
            <slot />
            <IconArrow
              class="transition shrink-0 h-5 w-5 text-[#bbbbbb]"
              :class="open ? 'rotate-90' : '-rotate-90'"
            />
          </template>
          <template v-else>
            <span class="whitespace-nowrap block text-[#fafafa]">
              {{ modelValue.label }}
            </span>
            <IconArrow
              class="transition shrink-0 h-5 w-5 text-[#bbbbbb]"
              :class="open ? 'rotate-90' : '-rotate-90'"
            />
          </template>
        </ListboxButton>
        <SelectOptions :items="items" :position="position" />
      </div>
    </Listbox>
  </div>
</template>
