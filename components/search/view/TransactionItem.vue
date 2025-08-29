<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { computed } from 'vue'

const props = defineProps<{
  result: string,
  chainId: number,
  height: number,
  requestkey: string,
  creationTime: string | null,
}>()

const status = useTransactionStatus(props.result)

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
    :to="`/transactions/${requestkey}`"
    @click="recordHistory(requestkey, 'transactions')"
    class="py-2 px-2 flex gap-2 hover:bg-[#1d1d1d] hover:rounded-md w-full"
  >
    <IconStatus
      :status="status"
      class="mb-auto w-[28px] h-[28px]"
    />

    <div
      class="flex flex-col truncate flex-1"
    >
      <span
        class="text-[#f5f5f5] text-sm truncate block"
      >
        {{ requestkey }}
      </span>

      <div>
        <span
          class="text-font-500 text-xs"
        >
          Block: {{ height }}
        </span>

        -

        <span
          class="text-font-500 text-xs"
        >
          Chain: {{ chainId }}
        </span>

        -

        <span
          class="text-font-500 text-xs"
        >
          Time: {{ timeAgo }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
