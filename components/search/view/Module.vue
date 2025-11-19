<script setup lang="ts">
const props = defineProps<{ items: any[]; onRecordHistory?: (q: string, type?: string|null) => void }>();
const topOne = computed(() => (props.items || []).slice(0, 1));
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="pb-1 px-2 pt-3">
      <span class="text-[11px] font-medium text-font-secondary mb-[1px]">MODULE</span>
    </div>

    <div class="flex flex-col gap-2">
      <SearchViewModuleItem
        v-for="(mod, i) in topOne"
        :key="'module:'+mod.name+':'+i"
        v-bind="mod"
        :onRecordHistory="onRecordHistory"
        class="py-2"
      />
    </div>
  </div>
  
</template>


