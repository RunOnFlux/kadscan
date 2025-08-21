<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import ChevronIcon from '~/components/icon/Chevron.vue'
import DetailsModal from '~/components/nft/DetailsModal.vue'
import { useAccountNFTs } from '~/composables/useAccountNFTs'
import { useSharedData } from '~/composables/useSharedData'

const props = defineProps<{ address: string }>()

const { selectedNetwork } = useSharedData()
const { nfts, metadataByKey, metadataErrors, fetchAccountNFTs, startMetadataQueue } = useAccountNFTs()

const visibleCount = 4
const startIndex = ref(0)
const hovering = ref(false)
let intervalId: any = null

const broken: any = ref<Record<string, boolean>>({})

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
    return { holding: h, meta, image, err, key: k }
  }).filter(r => !!r.image && !r.err && !broken.value[r.key])
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

function markBroken(key: string) {
  broken.value = { ...broken.value, [key]: true }
}
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-[#fafafa] font-semibold">NFTs</h3>
    </div>

    <div class="relative">
      <button
        v-if="displayable.length > 0"
        class="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-md bg-[#222222] text-[#bbbbbb] hover:bg-[#2a2a2a]"
        @click="prev"
        aria-label="Previous"
      >
        <ChevronIcon class="w-4 h-4 rotate-180" />
      </button>

      <div class="grid grid-cols-4 gap-2 px-10" @mouseenter="hovering = true" @mouseleave="hovering = false">
        <div v-for="(item, idx) in windowItems" :key="idx" class="relative aspect-square rounded-lg overflow-hidden bg-[#151515] border border-[#222222]"
             @mouseenter="onEnter(item)" @mouseleave="onLeave">
          <img :src="item.image" alt="nft" class="w-full h-full object-cover" @error="markBroken(item.key)" />
          <div v-if="item.holding?.balance && Number(item.holding.balance) > 1" class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-[2px] rounded">
            x{{ item.holding.balance }}
          </div>
        </div>
        <div v-if="windowItems.length === 0" class="col-span-4 grid place-items-center py-12">
          <div class="text-[#fafafa] text-md font-medium text-center">No NFTs available for display.</div>
        </div>
      </div>

      <button
        v-if="displayable.length > 0"
        class="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-md bg-[#222222] text-[#bbbbbb] hover:bg-[#2a2a2a]"
        @click="next"
        aria-label="Next"
      >
        <ChevronIcon class="w-4 h-4" />
      </button>
    </div>

    <DetailsModal :open="modalOpen" :holding="modalHolding" :metadata="modalMetadata" @close="closeModal" />
  </div>
</template>


