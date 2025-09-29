<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Splide, SplideSlide } from '@splidejs/vue-splide'
import { AutoScroll } from '@splidejs/splide-extension-auto-scroll'
import { useAccountNFTs } from '~/composables/useAccountNFTs'
import { useSharedData } from '~/composables/useSharedData'
import Tooltip from '~/components/Tooltip.vue'
import InfoIcon from '~/components/icon/Information.vue'

const props = defineProps<{ address: string }>()

const { selectedNetwork } = useSharedData()
const { hasFetched, nfts, metadataByKey, metadataErrors, fetchAccountNFTs, startMetadataQueue } = useAccountNFTs()

const broken: any = ref<Record<string, boolean>>({})

const displayable = computed(() => {
  const rows = nfts.value || []
  return rows
    .map(h => {
      const k = `${h.chainId}:${h.tokenId}`
      const meta = metadataByKey.value[k]
      const image = meta?.image || null
      const err = metadataErrors.value[k]
      return { holding: h, meta, image, err, key: k }
    })
    .filter(r => !!r.image && !r.err && !broken.value[r.key])
})

const allProcessed = computed(() => {
  const rows = nfts.value || []
  return rows.every(h => {
    const k = `${h.chainId}:${h.tokenId}`
    const hasErrorEntry = Object.prototype.hasOwnProperty.call(metadataErrors.value, k)
    const hasMeta = metadataByKey.value[k] !== null && metadataByKey.value[k] !== undefined
    return hasErrorEntry || hasMeta
  })
})

const shouldAutoScroll = computed(() => displayable.value.length >= 4)
const splideOptions = computed(() => ({
  type: 'loop',
  perPage: 4,
  gap: '8px',
  pagination: false,
  arrows: false,
  drag: false,
  pauseOnHover: true,
  pauseOnFocus: true,
  autoScroll: { speed: 1.2 },
}))

onMounted(async () => {
  const networkId = selectedNetwork.value?.id
  if (networkId && props.address) {
    await fetchAccountNFTs({ networkId, accountName: props.address })
    startMetadataQueue(props.address)
  }
})

watch(() => [selectedNetwork.value?.id, props.address], async ([networkId, address]) => {
  if (networkId && address) {
    await fetchAccountNFTs({ networkId, accountName: address })
    startMetadataQueue(address)
  }
})

function markBroken(key: string) {
  broken.value = { ...broken.value, [key]: true }
}
</script>

<template>
  <div class="bg-surface-primary border border-line-default rounded-xl px-5 pb-6 pt-4 shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
    <div v-if="displayable.length > 0" class="flex items-center justify-between mb-3">
      <div class="text-font-primary font-semibold">NFTs Accross All Chains</div>
      <Tooltip placement="left" :value="`We are currently fetching the NFTs metadata directly in the URLs found associated with the NFT in the blockchain. NFTs usually don't store their images on the blockchain, they rather use an URL pointing to the image. But in most cases, these links are missconfigured or not maintained after a long period of time and might not be available.`">
        <button class="w-5 h-5 grid place-items-center text-font-secondary hover:text-font-secondary" aria-label="NFTs info">
          <InfoIcon class="w-5 h-5" />
        </button>
      </Tooltip>
    </div>

    <div class="relative">
      <template v-if="hasFetched && allProcessed">
        <ClientOnly v-if="shouldAutoScroll && displayable.length > 0">
          <Splide :options="splideOptions" :extensions="{ AutoScroll }">
            <SplideSlide v-for="(item, idx) in displayable" :key="`${item.key}-${idx}`">
              <div class="relative aspect-square rounded-lg overflow-hidden bg-surface-disabled border border-line-default">
                <img :src="item.image" alt="nft" class="w-full h-full object-cover" @error="markBroken(item.key)" />
                <div v-if="item.holding?.balance && Number(item.holding.balance) > 1" class="absolute bottom-2 left-2 bg-black/70 text-font-primary text-xs px-2 py-[2px] rounded">
                  x{{ item.holding.balance }}
                </div>
              </div>
            </SplideSlide>
          </Splide>
        </ClientOnly>

        <div v-else class="grid grid-cols-4 gap-2">
          <div v-for="(item, idx) in displayable" :key="`${item.key}-${idx}`" class="relative aspect-square rounded-lg overflow-hidden bg-surface-disabled border border-line-default">
            <img :src="item.image" alt="nft" class="w-full h-full object-cover" @error="markBroken(item.key)" />
            <div v-if="item.holding?.balance && Number(item.holding.balance) > 1" class="absolute bottom-2 left-2 bg-black/70 text-font-primary text-xs px-2 py-[2px] rounded">
              x{{ item.holding.balance }}
            </div>
          </div>
          <div v-if="displayable.length === 0" class="col-span-4 grid place-items-center py-12">
            <p class="text-font-secondary text-sm text-center">
              This account doesn’t have any NFTs for display.
            </p>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="grid grid-cols-4 gap-2">
          <div v-for="idx in 4" :key="idx" class="aspect-square rounded-lg overflow-hidden bg-surface-disabled border border-line-default">
            <div class="w-full h-full relative animate-[pulse_0.7s_ease-in-out_infinite] bg-surface-secondary">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="h-5 w-5 rounded-full border-2 border-white/20 border-t-transparent animate-spin"></div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
