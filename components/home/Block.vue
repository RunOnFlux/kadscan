<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { computed } from 'vue';

const props = defineProps<{
  height: number,
  chainCount: number,
  totalTransactions: number,
  createdAt: any,
}>()

const status = 'success'

const timeAgo = computed(() => {
  return formatDistanceToNowStrict(new Date(props.createdAt), { addSuffix: true });
});

</script>

<template>
  <div
    class="flex flex-wrap items-center gap-3 xl:gap-4 py-3 lg:h-[111px] xl:max-h-[82px] border-b border-b-gray-300"
  >
    <NuxtLink
      :to="`/blocks/${props.height}`"
      class="mb-auto xl:mb-0"
    >
      <IconStatus
        :status="status"
      />
    </NuxtLink>

    <div
      class="flex xl:flex-col gap-1 grow xl:min-w-[150px]"
    >
      <Value
        isLink
        label="Block"
        :value="props.height"
        :to="`/blocks/${props.height}`"
      />

      <span class="text-sm text-font-500">{{ timeAgo }}</span>
    </div>

    <div
      class="flex flex-col gap-1 text-sm ml-auto text-right"
    >
      <span class="text-font-500">Chains {{ props.chainCount }}/20</span>
      <span class="text-font-450">{{ props.totalTransactions }} Transactions</span>
    </div>
  </div>
</template>
