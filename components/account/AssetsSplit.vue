<script setup lang="ts">
import AssetsTable from './Assets.vue'
import AssetsPieChart from './AssetsPieChart.vue'

defineProps<{
  address: string,
  balances: any,
  pending?: boolean,
}>()
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div>
      <AssetsTable :address="address" :balances="balances" :pending="pending" />
    </div>
    <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-[#fafafa] font-semibold">Assets Distribution</h3>
      </div>
      <AssetsPieChart :balances="balances" />
    </div>
  </div>
  
</template>


