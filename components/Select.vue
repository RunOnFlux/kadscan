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
  variant?: 'plain' | 'filled';
  fullWidth?: boolean;
  maxVisible?: number;
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
            'inline-flex items-center justify-between ring-0 outline-none shrink-0',
            size === 'small'
              ? 'gap-1 px-2 py-1 text-xs h-7 min-h-0'
              : 'gap-2 px-3 py-2 text-[15px]',
            variant === 'filled'
              ? 'rounded-lg bg-surface-secondary border border-line-strong'
              : '',
            fullWidth ? 'w-full' : ''
          ]"
        >
          <template v-if="slots.default">
            <div class="flex items-center gap-2 w-full">
              <slot />
              <IconArrow
                class="transition shrink-0 h-5 w-5 text-font-secondary ml-auto"
                :class="open ? 'rotate-90' : '-rotate-90'"
              />
            </div>
          </template>
          <template v-else>
            <div class="flex items-center gap-2 w-full">
              <span class="whitespace-nowrap block text-font-primary">
                {{ modelValue.label }}
              </span>
              <IconArrow
                class="transition shrink-0 h-5 w-5 text-font-secondary ml-auto"
                :class="open ? 'rotate-90' : '-rotate-90'"
              />
            </div>
          </template>
        </ListboxButton>
        <SelectOptions :items="items" :position="position" :maxVisible="maxVisible ?? 5" />
      </div>
    </Listbox>
  </div>
</template>
