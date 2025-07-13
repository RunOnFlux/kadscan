<script setup lang="ts">
import { computed, defineProps, toRef } from 'vue';
import Chart from '~/components/Chart.vue';
import { integer, money } from '~/composables/number';
import { useTransactionCount } from '~/composables/useTransactionCount';
import { useFormat } from '~/composables/useFormat';
import KadenaIcon from '~/components/icon/Kadena.vue';
import NetworkIcon from '~/components/icon/Network.vue';
import ServerIcon from '~/components/icon/Server.vue';
import MeterIcon from '~/components/icon/Meter.vue';
import Tooltip from '~/components/Tooltip.vue';

const props = defineProps<{
  chartData?: any,
  isLoading: boolean,
  kadenaPrice: number | null,
  kadenaPriceVariation: number | null,
  marketCap: number | null,
  transactionsCount: any,
  blockGroups: Array<{ height: number }> | null,
  gasPriceStats: any,
}>();

const { formatGasPrice } = useFormat();
const gasPriceStatsRef = toRef(props, 'gasPriceStats');
const transactionsCountRef = toRef(props, 'transactionsCount');

const variationClass = computed(() => {
  if (!props.kadenaPriceVariation) return '';
  return props.kadenaPriceVariation > 0 ? 'text-[#00a186]' : 'text-[#dc3545]';
});

const formattedVariation = computed(() => {
  if (props.kadenaPriceVariation === null) return '';
  const sign = props.kadenaPriceVariation > 0 ? '+' : '';
  return `(${sign}${props.kadenaPriceVariation.toFixed(2)}%)`;
});

const formattedAvgGasPrice = computed(() => {
  if (gasPriceStatsRef.value.txCount === 0) return null;
  const avgGasPrice = gasPriceStatsRef.value.totalGasPrice / gasPriceStatsRef.value.txCount;
  return formatGasPrice(avgGasPrice);
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

const marketCapInKda = computed(() => {
  if (!props.marketCap || !props.kadenaPrice) return null;
  return props.marketCap / props.kadenaPrice;
});
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] mb-4 py-5">
    <div class="grid grid-cols-1 md:grid-cols-3 divide-x divide-[#222222]">
      <div class="flex flex-col justify-center px-5">
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
        <div class="flex items-start justify-between">
          <div class="flex items-start">
            <NetworkIcon class="w-7 h-7 mr-[12px]" />
            <div>
              <div class="text-xs text-[#bbbbbb] mb-[1px]">MARKET CAP</div>
              <div class="text-[15px] text-[#f5f5f5] mt-[1px] mb-[3px]">
                {{ marketCap ? money.format(marketCap) : '—' }}
                <span v-if="marketCapInKda" class="text-[#bbbbbb] text-[14px]">
                  ({{ integer.format(marketCapInKda.toFixed(0)) }} KDA)
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="border-t border-[#222222] my-5 md:hidden"></div>
      </div>

      <div class="flex flex-col justify-center px-5 pt-4 md:pt-0">
        <div class="flex justify-between items-start">
          <div class="flex items-start">
            <ServerIcon class="w-7 h-7 ml-[3px] mr-[12px]" />
            <div>
              <div class="text-xs text-[#bbbbbb] mb-[1px]">TRANSACTIONS</div>
              <div class="text-[15px] text-[#f5f5f5]">
                <template v-if="transactionsCountRef.transactionCount">
                  <Tooltip value="Total transactions and Average TPS of last 100 blocks">
                    <NuxtLink
                      to="/transactions"
                      class="hover:text-[#0879b2]"
                    >
                      {{ transactionsCountRef.transactionCount ? transactionsCountRef.transactionCount : '—' }}
                    </NuxtLink>
                  </Tooltip>
                  <span
                    v-if="transactionsCountRef.averageTransactionPerSecond > 0"
                    class="text-[#bbbbbb] text-[14px]"
                  >
                    ({{ transactionsCountRef.averageTransactionPerSecond.toFixed(1) }} TPS)
                  </span>
                </template>
                <template v-else>—</template>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs text-[#bbbbbb] mb-[1px]">MED GAS PRICE</div>
            <Tooltip value="Median Gas Price from the last 100 Transactions">
              <div class="text-[15px] text-[#f5f5f5]">{{ formattedAvgGasPrice ? formattedAvgGasPrice + ' KDA' : '—' }}</div>
            </Tooltip>
          </div>
        </div>
        <div class="border-t border-[#222222] my-5"></div>
        <div class="flex justify-between items-start">
          <div class="flex items-start">
            <MeterIcon class="w-7 h-7 ml-[3px] mr-[12px]" />
            <div>
              <div class="text-xs text-[#bbbbbb] mb-[1px]">LAST CONFIRMED BLOCK</div>
              <div class="text-[15px] text-[#f5f5f5] mt-[1px] mb-[3px]">{{ lastFinalizedBlock ? lastFinalizedBlock : '—' }}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs text-[#bbbbbb] mb-[1px]">LAST SAFE BLOCK</div>
            <Tooltip value="Chances of this block not being canonical is close to 0">
              <div class="text-[15px] text-[#f5f5f5] mt-[1px] mb-[3px]">{{ lastSafeBlock ? lastSafeBlock : '—' }}</div>
            </Tooltip>
          </div>
        </div>
        <div class="border-t border-[#222222] my-5 md:hidden"></div>
      </div>

      <div class="flex flex-col px-5">
        <div class="text-xs text-[#bbbbbb] mb-[1px]">PRICE HISTORY 14 DAYS</div>
        <div class="h-[105px]">
          <Chart
            v-if="props.chartData"
            :key="props.chartData.prices.length"
            v-bind="props.chartData"
          />
          <div v-else class="h-full w-full flex items-center justify-center text-gray-500">
            Loading...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles for the dashboard component */
</style> 