<script setup lang="ts">
import { computed, defineProps } from 'vue';
import Chart from '~/components/Chart.vue';
import { integer, money } from '~/composables/number';

import KadenaIcon from '~/components/icon/Kadena.vue';
import NetworkIcon from '~/components/icon/Network.vue';
import ServerIcon from '~/components/icon/Server.vue';
import MeterIcon from '~/components/icon/Meter.vue';

const props = defineProps<{
  chartData?: any,
  isLoading: boolean,
  kadenaPrice: number | null,
  kadenaPriceVariation: number | null,
  marketCap: number | null,
  transactionsCount: number | null,
  blockGroups: Array<{ height: number }> | null,
  avgGasPrice: number | null,
}>();

const variationClass = computed(() => {
  if (!props.kadenaPriceVariation) return '';
  return props.kadenaPriceVariation > 0 ? 'text-[#00a186]' : 'text-[#dc3545]';
});

const formattedVariation = computed(() => {
  if (props.kadenaPriceVariation === null) return '—';
  const sign = props.kadenaPriceVariation > 0 ? '+' : '';
  return `(${sign}${props.kadenaPriceVariation.toFixed(2)}%)`;
});

const lastFinalizedBlock = computed(() => {
  if (!props.blockGroups || props.blockGroups.length === 0) {
    return null;
  }
  return Math.max(...props.blockGroups.map(g => g.height));
});

const lastSafeBlock = computed(() => {
  if (lastFinalizedBlock.value === null) return '—';
  return lastFinalizedBlock.value - 5 <= 0 ? 0 : lastFinalizedBlock.value - 5;
});
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] mb-4 py-5">
    <div class="grid grid-cols-1 md:grid-cols-3 divide-x divide-[#222222]">
      <div class="flex flex-col justify-center px-4">
        <div class="flex items-start">
          <KadenaIcon class="w-7 h-7 ml-[3px] mr-[9px]" />
          <div>
            <div class="text-xs text-[#bbbbbb] mb-[1px]">KADENA PRICE</div>
            <div class="text-[15px] text-[#f5f5f5]">
              {{ kadenaPrice ? money.format(kadenaPrice) : '—' }}
              <span :class="variationClass">{{ formattedVariation }}</span>
            </div>
          </div>
        </div>
        <div class="border-t border-[#222222] my-5"></div>
        <div class="flex items-start ">
          <NetworkIcon class="w-7 h-7 mr-[12px]" />
          <div>
            <div class="text-xs text-[#bbbbbb] mb-[1px]">MARKET CAP</div>
            <div class="text-[15px] text-[#f5f5f5] mt-[1px] mb-[3px]">{{ marketCap ? money.format(marketCap) : '—' }}</div>
          </div>
        </div>
        <div class="border-t border-[#222222] my-5 md:hidden"></div>
      </div>

      <div class="flex flex-col justify-center px-4 pt-4 md:pt-0">
        <div class="flex justify-between items-start">
          <div class="flex items-start">
            <ServerIcon class="w-7 h-7 ml-[3px] mr-[12px]" />
            <div>
              <div class="text-xs text-[#bbbbbb] mb-[1px]">TRANSACTIONS</div>
              <div class="text-[15px] text-[#f5f5f5]">{{ transactionsCount ? transactionsCount : '—' }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs text-[#bbbbbb] mb-[1px]">MED GAS PRICE</div>
            <div class="text-[15px] font-bold text-[#f5f5f5]">{{ avgGasPrice ? money.format(avgGasPrice) : '0.000001 KDA' }}</div>
          </div>
        </div>
        <div class="border-t border-[#222222] my-5"></div>
        <div class="flex justify-between items-start">
          <div class="flex items-start">
            <MeterIcon class="w-7 h-7 ml-[3px] mr-[12px]" />
            <div>
              <div class="text-xs text-[#bbbbbb] mb-[1px]">LAST FINALIZED BLOCK</div>
              <div class="text-[15px] text-[#f5f5f5] mt-[1px] mb-[3px]">{{ lastFinalizedBlock ? lastFinalizedBlock : '—' }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs text-[#bbbbbb] mb-[1px]">LAST SAFE BLOCK</div>
            <div class="text-[15px] text-[#f5f5f5]">{{ lastSafeBlock }}</div>
          </div>
        </div>
        <div class="border-t border-[#222222] my-5 md:hidden"></div>
      </div>

      <div class="flex flex-col px-4">
        <div class="text-xs text-[#bbbbbb] mb-[1px]">PRICE HISTORY 14 DAYS</div>
        <div class="h-[105px]">
          <Chart
            :key="props.chartData.prices.length"
            v-bind="props.chartData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles for the dashboard component */
</style> 