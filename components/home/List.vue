<script setup lang="ts">
const props = defineProps<{
  label: string,
  path?: string
}>()
</script>

<template>
  <div class="bg-[#111111] border border-gray-700 rounded-lg">
    <div
      class="px-6 py-4 border-b border-gray-700"
    >
      <span
        class="text-base font-semibold text-[#fafafa]"
      >
        {{ label === 'Recent Blocks' ? 'Latest Blocks' : label }}
      </span>
    </div>

    <div>
      <slot />
    </div>

    <div class="px-6 py-4 text-center bg-[#111111] rounded-b-lg">
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
