<script setup lang="ts">
import CustomizeIcon from '~/components/icon/Customize.vue'

const props = defineProps<{
  label: string,
  path?: string,
  isCustomizable?: boolean
}>()

const emit = defineEmits(['customize'])
</script>

<template>
  <div class="bg-[#111111] border border-gray-700 rounded-lg">
    <div
      class="flex items-center justify-between px-6 py-4 border-b border-gray-700"
    >
      <span
        class="text-base font-semibold text-[#fafafa]"
      >
        {{ label }}
      </span>

      <button
        v-if="isCustomizable"
        class="flex items-start gap-1 px-[6px] pb-[4px] pt-[3px] text-sm border border-gray-700 rounded-lg bg-[#151515] hover:bg-[#222222]"
        @click="emit('customize')"
      >
        <CustomizeIcon class="mt-[1px] text-[#fafafa] w-4 h-4" />
        <span class="text-[0.75rem] text-[#fafafa]">Customize</span>
      </button>
    </div>

    <div>
      <slot />
    </div>

    <div class="px-6 py-4 text-center bg-[#151515] rounded-b-lg">
      <NuxtLink
        v-if="path"
        :to="path"
        class="text-sm font-semibold text-[#b8b8b8] hover:text-white"
      >
        VIEW ALL BLOCKS &rarr;
      </NuxtLink>
    </div>
  </div>
</template>
