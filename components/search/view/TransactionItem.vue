<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  result: string,
  chainId: number,
  height: number,
  requestkey: string,
  creationTime: string | null,
}>()

const status = useTransactionStatus(props.result)

const now = ref(new Date())
let interval: any

onMounted(() => {
  interval = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(interval)
})

const timeAgo = computed(() => {
  if (!props.creationTime) return null
  const time = now.value
  const distance = formatDistanceToNowStrict(new Date(props.creationTime), { addSuffix: true })
  return distance.replace(' seconds', ' secs').replace(' second', ' sec')
})
</script>

<template>
  <NuxtLink
    :to="`/transactions/${requestkey}`"
    class="py-3 px-2 flex gap-2 hover:bg-[#1d1d1d] hover:rounded-md w-full"
  >
    <IconStatus
      :status="status"
      class="mb-auto w-[28px] h-[28px]"
    />

    <div
      class="flex flex-col truncate flex-1"
    >
      <span
        class="text-[#fafafa] text-sm truncate block"
      >
        {{ requestkey }}
      </span>

      <div class="flex justify-between items-center w-full">
        <span
          class="text-font-500 text-xs"
        >
          Chain Id: {{ chainId }} • Block: {{ height }} • Time: {{ timeAgo }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
