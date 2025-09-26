<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { computed } from 'vue'

const props = defineProps<{
  chainId: number,
  height: number,
  hash: string,
  creationTime?: string | null,
  canonical?: boolean,
}>()

// Compute status based on canonical property
const status = computed(() => {
  // If canonical is false, block is orphaned/invalid
  return props.canonical === false ? 'error' : 'success'
})

// Compute URL with canonical parameter when needed
const blockUrl = computed(() => {
  const baseUrl = `/blocks/${props.height}/chain/${props.chainId}`
  // Add canonical parameter if block is not canonical
  return props.canonical === false ? `${baseUrl}?canonical=false` : baseUrl
})

const timeAgo = computed(() => {
  if (!props.creationTime) return null
  const time = new Date()
  const distance = formatDistanceToNowStrict(new Date(props.creationTime), { addSuffix: true })
  return distance.replace(' seconds', ' secs').replace(' second', ' sec')
})

const { recordHistory } = useSearch();
</script>

<template>
  <NuxtLink
    :to="blockUrl"
    @click="recordHistory(hash || String(height), 'blocks')"
    class="py-2 px-2 flex gap-2 hover:bg-surface-secondary hover:rounded-md"
  >
    <IconStatus
      :status="status"
      class="mb-auto w-[28px] h-[28px]"
    />

    <div
      class="flex flex-col truncate"
    >
      <span
        class="text-[#f5f5f5] text-sm truncate block"
      >
        {{ hash }}
      </span>

      <div>
        <span
          class="text-[#939393] text-xs"
        >
          Block: {{ height }}
        </span>

        -

        <span
          class="text-[#939393] text-xs"
        >
          Chain: {{ chainId }}
        </span>

        -

        <span
          class="text-[#939393] text-xs"
        >
          Time: {{ timeAgo }} 
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
