<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import AssetsPieChart from '~/components/account/AssetsPieChart.vue'
import AssetsTokens from '~/components/account/AssetsTokens.vue'
import AssetsNFTs from '~/components/account/AssetsNFTs.vue'
import AssetsNFTCarousel from '~/components/account/AssetsNFTCarousel.vue'
import DetailsPanel from '~/components/nft/DetailsPanel.vue'
import { useAccountNFTs } from '~/composables/useAccountNFTs'

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

// Selection state and initial default logic
const { nfts, metadataByKey, metadataErrors } = useAccountNFTs()

const selectedHolding = ref<any | null>(null)
const selectedMetadata = ref<any | null>(null)
const selectedErrorUrl = ref<string | null>(null)

function selectFirstAvailable() {
  const chain = currentChain.value
  const arr = (nfts.value || []) as any[]
  const filtered = chain === null ? arr : arr.filter(h => `${h.chainId}` === chain)
  if (filtered.length > 0) {
    const h = filtered[0]
    const key = `${h.chainId}:${h.tokenId}`
    selectedHolding.value = h
    selectedMetadata.value = metadataByKey.value[key] || null
    selectedErrorUrl.value = (metadataErrors.value[key] && (metadataErrors.value[key] as any).url) ? (metadataErrors.value[key] as any).url : null
  } else {
    selectedHolding.value = null
    selectedMetadata.value = null
    selectedErrorUrl.value = null
  }
}

// Initialize and react to changes
onMounted(() => {
  selectFirstAvailable()
})

watch([
  () => route.query.chain,
  nfts,
  () => metadataByKey.value,
  () => metadataErrors.value,
], () => {
  selectFirstAvailable()
})

function handlePreview(payload: { holding: any | null; metadata: any | null; errorUrl: string | null }) {
  // quick swap; transition handled inside DetailsPanel via CSS
  selectedHolding.value = payload.holding
  selectedMetadata.value = payload.metadata
  selectedErrorUrl.value = payload.errorUrl
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
    <!-- Left column: Tokens (top) and NFTs (bottom) -->
    <div class="flex flex-col gap-4">
      <AssetsTokens :address="props.address" />
      <AssetsNFTs :address="props.address" @preview="handlePreview" />
    </div>

    <!-- Right column: Pie (top) and placeholder (bottom) -->
    <div class="flex flex-col gap-4">
      <div class="bg-[#111111] border border-[#222222] rounded-xl px-10 py-8 shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <AssetsPieChart />
      </div>

      <AssetsNFTCarousel :address="props.address" />
      <Transition name="tab-fade" mode="out-in">
        <DetailsPanel
          v-if="selectedHolding && selectedMetadata !== undefined"
          :key="`${selectedHolding?.chainId}:${selectedHolding?.tokenId}`"
          :holding="selectedHolding"
          :metadata="selectedMetadata"
          :error-url="selectedErrorUrl"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.tab-fade-enter-active { transition: opacity 0.15s ease-in-out; }
.tab-fade-leave-active { transition: opacity 0.15s ease-in-out; }
.tab-fade-enter-from, .tab-fade-leave-to { opacity: 0; }
.tab-fade-enter-to, .tab-fade-leave-from { opacity: 1; }
</style>


