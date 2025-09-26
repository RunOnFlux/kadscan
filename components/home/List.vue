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
  <div
    class="bg-surface-primary border border-line-default rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)]"
  >
    <div
      class="flex items-center justify-between p-4 border-b border-line-default"
    >
      <span
        class="text-[15px] font-semibold text-font-primary"
      >
        {{ label }}
      </span>

      <button
        v-if="isCustomizable"
        class="flex items-start gap-1 px-[6px] pb-[4px] pt-[3px] text-sm border border-line-default rounded-lg bg-surface-disabled hover:bg-surface-secondary"
        @click="emit('customize')"
      >
        <CustomizeIcon class="mt-[1px] text-font-primary w-4 h-4" />
        <span class="text-[0.75rem] text-font-primary">Customize</span>
      </button>
    </div>

    <div class="relative overflow-hidden">
      <slot />
    </div>

    <div class="px-6 py-4 text-center bg-surface-disabled rounded-b-lg border-t border-line-default relative z-10">
      <NuxtLink
        v-if="path"
        :to="path"
        class="text-[12px] font-semibold text-font-secondary hover:text-[#00e19d]"
      >
        {{ label.includes('Blocks') ? 'ALL BLOCKS' : 'ALL TRANSACTIONS' }} &rarr;
      </NuxtLink>
    </div>
  </div>
</template>
