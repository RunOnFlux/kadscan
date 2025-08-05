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
      class="pb-2"
    >
      <span
        class="text-xs text-[#bbbbbb] mb-[1px]"
      >
        TOKENS
      </span>
    </div>

    <SearchViewTokensItem
      v-bind="tokens"
      class="py-3"
      :key="'tokens:'+tokens.id"
      v-for="(tokens, i) in tokens"
      :class="[!((i + 1) === tokens.length) && '!border-b border-b-[#222222]']"
    />
  </div>
</template>
