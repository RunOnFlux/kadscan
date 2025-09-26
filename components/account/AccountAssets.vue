<script setup lang="ts">
import { computed } from 'vue'
import AssetsPieChart from '~/components/account/AssetsPieChart.vue'
import AssetsTokens from '~/components/account/AssetsTokens.vue'
import AssetsNFTs from '~/components/account/AssetsNFTs.vue'
import AssetsNFTCarousel from '~/components/account/AssetsNFTCarousel.vue'
import DetailsPanel from '~/components/nft/DetailsPanel.vue'
import { useAccountNFTs } from '~/composables/useAccountNFTs'
import { useAccountBalances } from '~/composables/useAccountBalances'

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

// Keep access to NFTs for hasNFTs/invertOrder logic
const { nfts } = useAccountNFTs()
const { balances } = useAccountBalances()

// Ordering logic: invert when tokens are empty for the current chain and NFTs are not
const hasTokens = computed(() => {
  const chain = currentChain.value
  const arr = (balances.value || []) as Array<{ balance: string; chainId: string; module: string }>
  const positive = arr.filter(b => Number(b?.balance) > 0)
  const filtered = chain === null ? positive : positive.filter(b => `${b.chainId}` === chain)
  return filtered.length > 0
})

const hasNFTs = computed(() => {
  const chain = currentChain.value
  const arr = (nfts.value || []) as any[]
  const filtered = chain === null ? arr : arr.filter(h => `${h.chainId}` === chain)
  return filtered.length > 0
})

const invertOrder = computed(() => !hasTokens.value && hasNFTs.value)
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
    <!-- Left column: Tokens and NFTs (order may invert without unmounting) -->
    <div class="flex flex-col gap-4">
      <AssetsTokens :address="props.address" :class="invertOrder ? 'order-2' : 'order-1'" />
      <AssetsNFTs :address="props.address" :class="invertOrder ? 'order-1' : 'order-2'" />
    </div>

    <!-- Right column: Pie (tokens section) and NFTs preview (order may invert without unmounting) -->
    <div class="flex flex-col gap-4">
      <div :class="['bg-surface-primary border border-[#222222] rounded-xl px-10 py-8 shadow-[0_0_20px_rgba(255,255,255,0.0625)]', invertOrder ? 'order-2' : 'order-1']">
        <AssetsPieChart />
      </div>
      <div class="flex flex-col gap-4" :class="invertOrder ? 'order-1' : 'order-2'">
        <AssetsNFTCarousel :address="props.address" />
        <Transition name="tab-fade" mode="out-in">
          <DetailsPanel />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-fade-enter-active { transition: opacity 0.15s ease-in-out; }
.tab-fade-leave-active { transition: opacity 0.15s ease-in-out; }
.tab-fade-enter-from, .tab-fade-leave-to { opacity: 0; }
.tab-fade-enter-to, .tab-fade-leave-from { opacity: 1; }
</style>


