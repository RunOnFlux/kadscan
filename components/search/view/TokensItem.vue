<script setup lang="ts">
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
    :to="metadata?.id ? `/tokens/${metadata.id}` : `/tokens/${module}`"
    @click="recordHistory(module, 'tokens')"
    class="flex items-center justify-between w-full hover:bg-[#1d1d1d] hover:rounded-md"
  >
    <div
      class="flex items-center gap-2"
    >
      <div
        class="h-6 w-6 rounded shrink-0"
      >
        <img
          v-if="metadata.icon"
          :src="metadata.icon"
          class="rounded-full"
        />

        <div
          v-else
          class="w-full h-full bg-gray-300 rounded"
        />
      </div>

      <div
        class="flex gap-2 items-end w-full truncate"
      >
        <span
          class="text-sm text-[#fafafa] truncate block"
        >
          {{ metadata.name }}
        </span>

        <span
          v-if="metadata.symbol"
          class="text-[#fafafa] text-sm font-medium uppercase"
        >
          ({{ metadata.symbol }})
        </span>
      </div>
    </div>

    <div>
      <span
        class="text-[#fafafa] text-sm font-medium"
      >
        {{ module }}
      </span>
    </div>
  </NuxtLink>
</template>
