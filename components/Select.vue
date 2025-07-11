<script setup lang="ts">
import {
  provideUseId,
  Listbox,
  ListboxButton,
} from '@headlessui/vue'
import SelectOptions from '~/components/SelectOptions.vue'

const props = defineProps<{
  modelValue: any;
  items: any[];
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
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
          class="flex items-center justify-center gap-2 px-[10px] py-[0.3rem] ring-0 outline-none shrink-0"
        >
          <span class="text-[15px] text-[#f5f5f5] whitespace-nowrap block">
            {{ modelValue.label }}
          </span>

          <IconArrow
            class="transition shrink-0 h-5 w-5 text-[#bbbbbb]"
            :class="open ? 'rotate-90' : '-rotate-90'"
          />
        </ListboxButton>
        <SelectOptions :items="items" :position="position" />
      </div>
    </Listbox>
  </div>
</template>
