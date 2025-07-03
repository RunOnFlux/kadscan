<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { computed, ref, onMounted, onUnmounted } from 'vue';
import Tooltip from '../Tooltip.vue';
import { shortenString, shortenAddress } from '~/composables/string';
import TransactionList from '~/components/icon/TransactionList.vue'

const props = defineProps<{
  hash: string;
  sender: string;
  chainId: number;
  createdAt: string;
  fee: number;
}>()

const now = ref(new Date());
let interval: any;

onMounted(() => {
  interval = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(interval);
});

const timeAgo = computed(() => {
  const time = now.value;
  return formatDistanceToNowStrict(new Date(props.createdAt), { addSuffix: true });
});

</script>

<template>
  <div class="flex items-center justify-between px-6 py-4 border-b border-gray-700">
    <div class="flex items-center w-1/3 gap-4">
      <div class="bg-[#151515] rounded-md p-3">
        <TransactionList class="w-6 h-6 text-[#b0b0b0]" />
      </div>
      <div>
        <NuxtLink :to="`/transactions/${props.hash}`" class="text-[#6ab5db] hover:text-[#9ccee7]">
          {{ shortenString(props.hash) }}
        </NuxtLink>
        <div class="text-xs text-[#bbbbbb]">{{ timeAgo }}</div>
      </div>
    </div>

    <div class="flex items-center justify-between w-1/3">
      <div class="text-sm text-left">
          <div class="text-[#f5f5f5]">
            Sender: {{ shortenAddress(props.sender) }}
          </div>
        <div>
          <div class="text-[#6ab5db] hover:text-[#9ccee7]">
            Chain: {{ props.chainId }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end w-1/3">
      <Tooltip value="Transaction Fee">
        <div class="hidden sm:block text-[11px] text-[#f5f5f5] border border-gray-600 bg-transparent rounded-md px-2 py-1">
          {{ props.fee.toFixed(8) }} KDA
        </div>
      </Tooltip>
    </div>
  </div>
</template>
