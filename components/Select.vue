<script setup lang="ts">
import {
  provideUseId,
  Listbox,
  ListboxLabel,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

const props = defineProps<{
  modelValue: any;
  items: any[];
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
      <div
        class="relative"
      >
        <ListboxButton
          class="flex items-center justify-center gap-11 px-[10px] py-[0.3rem] ring-0 outline-none shrink-0"
        >
          <span
            class="text-[15px] text-[#f5f5f5] whitespace-nowrap block"
          >
            {{ modelValue.label }}
          </span>

          <IconArrow
            class="transition shrink-0 h-5 w-5 text-[#bbbbbb]"
            :class="open ? 'rotate-90' : '-rotate-90'"
          />
        </ListboxButton>

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
              w-[150px]
              px-3
              py-2
              border border-[#222222]
              rounded-lg
              absolute
              left-0
              top-[calc(100%+8px)]
              bg-[#111111]
              shadow-[0_0_15px_rgba(255,255,255,0.0625)]
            "
          >
            <ListboxOption
              v-for="item in items"
              :key="item.value"
              :value="item"
              as="template"
            >
              <li
                class="group flex w-full items-center hover:bg-[#222222] text-white hover:text-[#6ab5db] justify-start rounded-md px-3 py-2 text-sm"
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
      </div>
    </Listbox>
  </div>
</template>
