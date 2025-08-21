<script setup lang="ts">
import { computed, watch } from 'vue'
import AssetsPieChart from '~/components/account/AssetsPieChart.vue'
import AssetsTokens from '~/components/account/AssetsTokens.vue'
import AssetsNFTs from '~/components/account/AssetsNFTs.vue'
import AssetsNFTCarousel from '~/components/account/AssetsNFTCarousel.vue'

const props = defineProps<{
  address: string
}>()

const route = useRoute()

// Expose current chain from query for children (they also read route directly)
const currentChain = computed(() => {
  const q = route.query.chain as string | undefined
  const n = q !== undefined ? parseInt(q, 10) : undefined
  return n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19 ? `${n}` : null
})

watch(() => route.query.chain, () => {}, { immediate: true })
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
    <!-- Left column: Tokens (top) and NFTs (bottom) -->
    <div class="flex flex-col gap-4">
      <AssetsTokens :address="props.address" />
      <AssetsNFTs :address="props.address" />
    </div>

    <!-- Right column: Pie (top) and placeholder (bottom) -->
    <div class="flex flex-col gap-4">
      <div class="bg-[#111111] border border-[#222222] rounded-xl px-10 py-8 shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <AssetsPieChart />
      </div>

      <AssetsNFTCarousel :address="props.address" />
    </div>
  </div>
</template>


