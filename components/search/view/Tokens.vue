<script setup lang="ts">
const props = defineProps<{
  tokens: any,
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
        TOKENS
      </span>
    </div>

    <div class="flex flex-col gap-2">
      <SearchViewTokensItem
        v-bind="tokens"
        class="py-2"
        :key="'tokens:'+tokens.module"
        v-for="(tokens, i) in tokens"
        @select="props.onRecordHistory && props.onRecordHistory(tokens.module, 'tokens')"
      />
    </div>
  </div>
</template>
