<script setup lang="ts">
defineProps<{
  blocks: any,
}>()
</script>

<template>
  <div
    class="flex flex-col"
  >
    <div
      class="pb-2"
    >
      <span
        class="text-xs text-[#bbbbbb] mb-[1px]"
      >
        BLOCKS
      </span>
    </div>

    <SearchViewBlockItem
      v-bind="block"
      class="py-3"
      :key="'block:'+block.id"
      v-for="(block, i) in blocks"
      :class="[!((i + 1) === blocks.length) && '!border-b border-b-[#222222]']"
    />
  </div>
</template>
