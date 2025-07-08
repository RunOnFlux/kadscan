<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { computed, ref, onMounted, onUnmounted } from 'vue';
import Tooltip from '../Tooltip.vue';
import BlockIcon from '~/components/icon/Block.vue';

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
      :class="{ 'border-b border-[#222222]': index !== totalItems - 1 }"
    >
      <div class="flex items-center md:w-1/3 gap-2 w-[160px]">
        <div class="bg-[#151515] rounded-md p-3 hidden md:block">
          <BlockIcon class="w-6 h-6 text-[#b0b0b0]" />
        </div>
        <div>
          <NuxtLink :to="`/blocks/${props.height}`" class="text-[#6ab5db] hover:text-[#9ccee7] text-[15px]">
            {{ props.height }}
          </NuxtLink>
          <div class="text-xs text-[#bbbbbb]">{{ timeAgo }}</div>
        </div>
      </div>

      <div class="flex items-center justify-between w-full md:w-2/3">
          <div class="text-sm">
            <Tooltip value="Amount of Chains included in this Block">
              <div class="text-[#bbbbbb]">
                Synced Chains <span class="text-[#f5f5f5]">{{ props.chainCount }}/20</span>
              </div>
            </Tooltip>
            <div>
              <Tooltip value="Transactions in this block">
                <NuxtLink to="#" class="text-[#6ab5db] hover:text-[#9ccee7]">
                  {{ props.totalTransactions }} {{ props.totalTransactions === 1 ? 'Transaction' : 'Transactions' }}
                </NuxtLink>
              </Tooltip>
            </div>
          </div>

        <Tooltip value="Block Reward">
          <div class="text-[11px] text-[#f5f5f5] border border-gray-600 bg-transparent rounded-md px-2 py-1">
            {{ (props.totalRewards || 0).toFixed(1) }} kda
          </div>
        </Tooltip>
      </div>
    </div>
  </div>
</template>
