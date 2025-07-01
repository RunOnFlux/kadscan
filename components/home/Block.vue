<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { computed } from 'vue';

const props = defineProps<{
  height: number,
  chainCount: number,
  totalTransactions: number,
  createdAt: any,
}>()

const timeAgo = computed(() => {
  return formatDistanceToNowStrict(new Date(props.createdAt), { addSuffix: true });
});

</script>

<template>
  <div class="flex items-center justify-between px-6 py-4 border-b border-gray-700">
    <div class="flex items-center w-1/3 gap-4">
      <div class="bg-[#151515] rounded-md p-3">
        <svg class="w-6 h-6 text-gray-400" width="800px" height="800px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="#b0b0b0" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
          <polygon points="1.75 4.75 8 1.25 14.25 4.75 14.25 11.25 8 14.75 1.75 11.25"/>
          <path d="m8 14v-6m5.75-3-5.75 3m-6-3 6 3"/>
        </svg>
      </div>
      <div>
        <NuxtLink :to="`/blocks/${props.height}`" class="text-[#6ab5db] hover:text-[#9ccee7]">
          {{ props.height }}
        </NuxtLink>
        <div class="text-xs text-[#bbbbbb]">{{ timeAgo }}</div>
      </div>
    </div>

    <div class="flex items-center justify-between w-2/3">
        <div class="text-sm">
          <div class="text-[#f5f5f5]">
            Chains {{ props.chainCount }}/20
          </div>
          <div>
            <NuxtLink to="#" class="text-[#6ab5db] hover:text-[#9ccee7]">
              {{ props.totalTransactions }} Transactions
            </NuxtLink>
          </div>
        </div>

      <div class="hidden sm:block text-xs text-gray-400 border border-gray-600 bg-gray-800 rounded-md px-2 py-1">
        0.0 KDA
      </div>
    </div>
  </div>
</template>
