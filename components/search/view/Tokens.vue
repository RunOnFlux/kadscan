<script setup lang="ts">
defineProps<{
  tokens: any,
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
        :key="'tokens:'+tokens.id"
        v-for="(tokens, i) in tokens"
      />
    </div>
  </div>
</template>
