<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { computed, ref, onMounted, onUnmounted } from 'vue';
import Tooltip from '../Tooltip.vue';
import KadenaIcon from '~/components/icon/Kadena.vue';

const props = defineProps<{
  height: number,
  chainCount: number,
  totalTransactions: number,
  createdAt: any,
  index: number,
  totalItems: number,
  totalRewards: number
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

</script>

<template>
  <div class="px-4">
    <div
      class="flex items-center justify-between py-[14px]"
      :class="{ 'border-b border-line-default': index !== totalItems - 1 }"
    >
      <div class="flex items-center md:w-1/3 gap-2 w-[160px]">
        <div class="bg-surface-disabled rounded-md p-3 hidden md:block">
          <KadenaIcon class="w-6 h-6" />
        </div>
        <div>
          <NuxtLink :to="`/blocks/${props.height}`" class="text-link hover:text-link-hover text-[15px]">
            {{ props.height }}
          </NuxtLink>
          <div class="text-xs text-font-secondary">{{ timeAgo }}</div>
        </div>
      </div>

      <div class="flex items-center justify-between w-full md:w-2/3">
          <div class="text-sm">
            <Tooltip value="Amount of Chains included in this Block">
              <div class="text-font-secondary">
                Synced Chains <span class="text-font-primary">{{ props.chainCount }}/20</span>
              </div>
            </Tooltip>
            <div>
              <Tooltip v-if="props.totalTransactions > 0" value="Transactions in this block">
                <NuxtLink :to="`/transactions?block=${props.height}`" class="text-link hover:text-link-hover">
                  {{ props.totalTransactions }} {{ props.totalTransactions === 1 ? 'Transaction' : 'Transactions' }}
                </NuxtLink>
              </Tooltip>
              <div v-else class="text-font-secondary">
                {{ props.totalTransactions }} {{ props.totalTransactions === 1 ? 'Transaction' : 'Transactions' }}
              </div>
            </div>
          </div>

        <Tooltip value="Block Reward">
          <div class="text-[11px] text-font-primary border border-[#343636] bg-transparent rounded-md px-2 py-1">
            {{ (props.totalRewards || 0).toFixed(1) }} kda
          </div>
        </Tooltip>
      </div>
    </div>
  </div>
</template>
