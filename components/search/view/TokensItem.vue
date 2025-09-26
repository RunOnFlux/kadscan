<script setup lang="ts">
import { staticTokens, unknownToken } from '~/constants/tokens'
const props = defineProps<{
  module: string,
}>()

const metadata = computed(() => {
  return staticTokens.find(({ module }) => module === props.module) || unknownToken
})
const { recordHistory } = useSearch();
</script>

<template>
  <NuxtLink
    :to="`/token/${encodeURIComponent(module)}`"
    @click="recordHistory(module, 'tokens')"
    class="py-2 px-2 flex items-center gap-2 w-full hover:bg-surface-secondary hover:rounded-md"
  >
    <div
      class="flex items-center gap-2"
    >
      <div
        class="h-7 w-7 rounded shrink-0"
      >
        <img
          v-if="metadata.icon"
          :src="metadata.icon"
          class="rounded-full"
        />

        <div
          v-else
          class="w-full h-full bg-[#525454] rounded"
        />
      </div>

      <div
        class="flex flex-col w-full truncate"
      >
        <span
          class="text-sm text-font-primary font-medium uppercase truncate block"
        >
          {{ metadata?.symbol ? `$${metadata.symbol}` : module }}
        </span>

        <span
          class="text-font-tertiary text-xs truncate"
        >
          {{ module }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
