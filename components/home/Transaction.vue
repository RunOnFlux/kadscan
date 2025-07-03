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
  index: number;
  totalItems: number;
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
  const distance = formatDistanceToNowStrict(new Date(props.createdAt), { addSuffix: true });
  return distance.replace(' seconds', ' secs').replace(' second', ' sec');
});

const formattedFee = computed(() => {
  if (props.fee === 0) {
    return '0';
  }
  const feeStr = props.fee.toFixed(8);
  return feeStr.replace(/(\.\d*[1-9])0+$/, '$1').replace(/\.0+$/, '.0');
});

</script>

<template>
  <div class="px-4">
    <div
      class="flex items-center justify-between py-[14px]"
      :class="{ 'border-b border-gray-700': index !== totalItems - 1 }"
    >
      <div class="flex items-center w-5/12 gap-2">
        <div class="bg-[#151515] rounded-md p-3">
          <TransactionList class="w-6 h-6 text-[#b0b0b0]" />
        </div>
        <div>
          <NuxtLink :to="`/transactions/${props.hash}`" class="text-[#6ab5db] hover:text-[#9ccee7] text-[15px]">
            {{ shortenString(props.hash) }}
          </NuxtLink>
          <div class="text-xs text-[#bbbbbb]">{{ timeAgo }}</div>
        </div>
      </div>

      <div class="flex items-center justify-between w-7/12">
        <div class="text-sm text-left">
            <div class="text-[#f5f5f5]">
              Sender
              <NuxtLink :to="`/account/${props.sender}`" class="text-[#6ab5db] hover:text-[#9ccee7]">
                {{ shortenAddress(props.sender) }}
              </NuxtLink>
            </div>
          <div>
            <div class="text-[#bbbbbb]">
              Chain <span class="text-[#f5f5f5]">{{ props.chainId }}</span>
            </div>
          </div>
        </div>

        <Tooltip value="Transaction Fee">
          <div class="hidden sm:block text-[11px] text-[#f5f5f5] border border-gray-600 bg-transparent rounded-md px-2 py-1">
            {{ formattedFee }} kda
          </div>
        </Tooltip>
      </div>
    </div>
  </div>
</template>
