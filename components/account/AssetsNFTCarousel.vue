<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import ChevronIcon from '~/components/icon/Chevron.vue'
import DetailsModal from '~/components/nft/DetailsModal.vue'
import { useAccountNFTs } from '~/composables/useAccountNFTs'
import { useSharedData } from '~/composables/useSharedData'

const props = defineProps<{ address: string }>()

const { selectedNetwork } = useSharedData()
const { nfts, metadataByKey, metadataErrors, fetchAccountNFTs, startMetadataQueue } = useAccountNFTs()

const visibleCount = 5
const startIndex = ref(0)
const hovering = ref(false)
let intervalId: any = null

function next() {
  const len = displayable.value.length
  if (len === 0) return
  startIndex.value = (startIndex.value + 1) % Math.max(1, len)
}

function prev() {
  const len = displayable.value.length
  if (len === 0) return
  startIndex.value = (startIndex.value - 1 + len) % Math.max(1, len)
}

const displayable = computed(() => {
  const rows = nfts.value || []
  return rows.map(h => {
    const k = `${h.chainId}:${h.tokenId}`
    const meta = metadataByKey.value[k]
    const image = meta?.image || null
    const err = metadataErrors.value[k]
    return { holding: h, meta, image, err }
  }).filter(r => !!r.image && !r.err)
})

const windowItems = computed(() => {
  const arr = displayable.value
  if (arr.length <= visibleCount) return arr
  const items: any[] = []
  for (let i = 0; i < visibleCount; i++) {
    items.push(arr[(startIndex.value + i) % arr.length])
  }
  return items
})

function startAuto() {
  clearInterval(intervalId)
  intervalId = setInterval(() => {
    if (!hovering.value) next()
  }, 5000)
}

onMounted(async () => {
  const networkId = selectedNetwork.value?.id
  if (networkId && props.address) {
    await fetchAccountNFTs({ networkId, accountName: props.address })
    startMetadataQueue(props.address)
  }
  startAuto()
})

onBeforeUnmount(() => {
  clearInterval(intervalId)
})

watch(() => [selectedNetwork.value?.id, props.address], async ([networkId, address]) => {
  if (networkId && address) {
    await fetchAccountNFTs({ networkId, accountName: address })
    startMetadataQueue(address)
    startIndex.value = 0
  }
})

// Modal on long hover
const modalOpen = ref(false)
const modalHolding = ref<any>(null)
const modalMetadata = ref<any>(null)
let hoverTimer: any = null

function onEnter(item: any) {
  hovering.value = true
  clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => {
    modalHolding.value = item.holding
    modalMetadata.value = item.meta
    modalOpen.value = true
  }, 1000)
}

function onLeave() {
  hovering.value = false
  clearTimeout(hoverTimer)
}

function closeModal() { modalOpen.value = false }
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
    <div v-if="windowItems.length > 0" class="flex items-center justify-between mb-3">
      <h3 class="text-[#fafafa] font-semibold">NFTs</h3>
      <div class="flex gap-2">
        <button class="w-8 h-8 grid place-items-center rounded-md border border-[#222222] hover:bg-[#1a1a1a] active:bg-[#252525]" @click="prev">
          <ChevronIcon class="w-4 h-4 rotate-180" />
        </button>
        <button class="w-8 h-8 grid place-items-center rounded-md border border-[#222222] hover:bg-[#1a1a1a] active:bg-[#252525]" @click="next">
          <ChevronIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-5 gap-2" @mouseenter="hovering = true" @mouseleave="hovering = false">
      <div v-for="(item, idx) in windowItems" :key="idx" class="relative aspect-square rounded-lg overflow-hidden bg-[#151515] border border-[#222222]"
           @mouseenter="onEnter(item)" @mouseleave="onLeave">
        <img :src="item.image" alt="nft" class="w-full h-full object-cover" />
        <div v-if="item.holding?.balance && Number(item.holding.balance) > 1" class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-[2px] rounded">
          x{{ item.holding.balance }}
        </div>
      </div>
      <div v-if="windowItems.length === 0" class="col-span-5 grid place-items-center py-12">
        <div class="text-[#fafafa] text-md font-medium text-center">No NFTs available for display.</div>
      </div>
    </div>

    <DetailsModal :open="modalOpen" :holding="modalHolding" :metadata="modalMetadata" @close="closeModal" />
  </div>
</template>


