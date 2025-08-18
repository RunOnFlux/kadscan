<script setup lang="ts">
const props = defineProps<{
  blocks: any,
  onRecordHistory?: (q: string, type?: string | null) => void,
}>()
</script>

<template>
  <div
    class="flex flex-col"
  >
    <div
      class="pb-1 px-2 pt-3"
    >
      <span
        class="text-[11px] font-medium text-[#bbbbbb] mb-[1px]"
      >
        BLOCKS
      </span>
    </div>

    <div class="flex flex-col gap-2">
      <SearchViewBlockItem
        v-bind="block"
        class="py-2"
        :key="'block:'+block.id"
        v-for="(block, i) in blocks"
        @select="props.onRecordHistory && props.onRecordHistory(block.hash || String(block.height), 'blocks')"
      />
    </div>
  </div>
</template>
