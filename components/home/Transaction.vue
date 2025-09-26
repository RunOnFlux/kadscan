<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { computed, ref, onMounted, onUnmounted } from 'vue';
import Tooltip from '../Tooltip.vue';
import { useFormat } from '~/composables/useFormat';
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

const { truncateAddress } = useFormat();
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
      :class="{ 'border-b border-surface-skeleton': index !== totalItems - 1 }"
    >
      <div class="flex items-center md:w-5/12 md:gap-2 w-[160px]">
        <div class="bg-surface-disabled rounded-md p-3 hidden md:block">
          <TransactionList class="w-6 h-6 text-[#b0b0b0]" />
        </div>
        <div>
          <Tooltip :value="props.hash" variant="hash">
            <NuxtLink :to="`/transactions/${props.hash}`" class="text-link hover:text-link-hover text-[15px]">
              {{ truncateAddress(props.hash) }}
            </NuxtLink>
          </Tooltip>
          <div class="text-xs text-font-secondary">{{ timeAgo }}</div>
        </div>
      </div>

      <div class="flex items-center justify-between w-full md:w-7/12">
        <div class="text-sm text-left">
            <div class="text-font-primary">
              Sender
              <Tooltip :value="props.sender" variant="hash">
                <NuxtLink :to="`/account/${props.sender}`" class="text-link hover:text-link-hover">
                  {{ truncateAddress(props.sender) }}
                </NuxtLink>
              </Tooltip>
            </div>
          <div>
            <div class="text-font-secondary">
              Chain <span class="text-font-primary">{{ props.chainId }}</span>
            </div>
          </div>
        </div>

        <Tooltip value="Transaction Fee">
          <div class="text-[11px] text-font-primary border border-[#343636] bg-transparent rounded-md px-2 py-1">
            {{ formattedFee }} kda
          </div>
        </Tooltip>
      </div>
    </div>
  </div>
</template>
