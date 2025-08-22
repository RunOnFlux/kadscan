<script setup lang="ts">
import Copy from '~/components/Copy.vue'
const { truncateAddress } = useFormat()
import { sanitizeDisplayText } from '~/composables/string'

const props = defineProps<{
  holding: any | null,
  metadata: any | null,
  errorUrl?: string | null,
}>()

function sanitize(input: any, maxLen = 800): string { return sanitizeDisplayText(input, maxLen) }

function safeUrl(url: any): string | null {
  if (!url || typeof url !== 'string') return null
  try {
    const u = new URL(url)
    if (['http:', 'https:'].includes(u.protocol)) return u.toString()
    return null
  } catch (_e) { return null }
}

const title = computed(() => sanitize(props.metadata?.name || 'Unknown'))
const collection = computed(() => {
  const meta: any = props.metadata || null
  const attrCollection = Array.isArray(meta?.attributes)
    ? (() => {
        const found = meta.attributes.find((a: any) =>
          typeof a?.trait_type === 'string' && a.trait_type.toLowerCase() === 'collection' && typeof a?.value === 'string' && a.value
        )
        return found ? found.value : null
      })()
    : null
  const value = (typeof meta?.collection === 'string' && meta.collection)
    ? meta.collection
    : (typeof meta?.collection_id === 'string' && meta.collection_id)
    ? meta.collection_id
    : (typeof attrCollection === 'string' && attrCollection)
    ? attrCollection
    : (typeof meta?.creator === 'string' && meta.creator)
    ? meta.creator
    : 'Unknown'
  return sanitize(value)
})
const description = computed(() => sanitize(props.metadata?.description || ''))
const imageUrl = computed(() => props.metadata?.image || null)
const externalUrl = computed(() => safeUrl(props.metadata?.external_url))

const ownerRoute = computed(() => {
  const keys = props.holding?.guard?.keys
  const first = Array.isArray(keys) && keys.length > 0 ? String(keys[0]) : null
  if (!first) return null
  const isHex64 = /^[0-9a-f]{64}$/i.test(first)
  const owner = isHex64 ? `k:${first}` : first
  return { owner, href: `/account/${owner}` }
})

const ownerDisplay = computed(() => {
  const route = ownerRoute.value as any
  if (!route?.owner) return ''
  return truncateAddress(route.owner, 10, 10)
})
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 md:p-5 shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
    <div class="flex items-center justify-between mb-3">
      <div class="text-[#fafafa] font-semibold">NFT Details</div>
      <a
        v-if="externalUrl"
        :href="externalUrl"
        target="_blank"
        rel="noopener"
        aria-label="Open external site"
        class="inline-flex items-center justify-center text-[#888888] hover:text-kadscan-400"
      >
        <IconExternal class="w-5 h-5" />
      </a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="relative rounded-lg bg-[#151515] border border-[#222222] aspect-square overflow-hidden flex items-center justify-center">
        <img v-if="imageUrl" :src="imageUrl as any" alt="nft" class="block max-w-full max-h-full object-contain" />
        <div v-else class="text-[#888888] text-center px-3">
          <div>No image</div>
          <div v-if="props.errorUrl" class="text-[#ff6b6b] text-xs mt-1 break-all">
            This URL is not available
          </div>
        </div>
        <div v-if="props.holding?.balance && Number(props.holding.balance) > 1" class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-[2px] rounded">
          x{{ props.holding.balance }}
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <div v-if="ownerRoute">
          <div class="text-xs text-[#bbbbbb] mb-[2px]">Owner</div>
          <NuxtLink :to="ownerRoute!.href" class="text-[15px] text-[#6ab5db] hover:text-[#9ccee7] break-all">{{ ownerDisplay }}</NuxtLink>
        </div>
        <div>
          <div class="text-xs text-[#bbbbbb] mb-[2px]">Collection</div>
          <div class="text-[15px] text-[#f5f5f5]">{{ collection }}</div>
        </div>
        <div>
          <div class="text-xs text-[#bbbbbb] mb-[2px]">Name</div>
          <div class="text-[15px] text-[#f5f5f5]">{{ title }}</div>
        </div>
        <div v-if="description">
          <div class="text-xs text-[#bbbbbb] mb-[2px]">Description</div>
          <div class="text-[14px] text-[#f5f5f5] leading-5">{{ description }}</div>
        </div>
        <div class="grid grid-cols-1 gap-3">
          <div>
            <div class="text-xs text-[#bbbbbb] mb-[2px]">Chain</div>
            <div class="text-[15px] text-[#f5f5f5]">{{ props.holding?.chainId }}</div>
          </div>
          <div>
            <div class="text-xs text-[#bbbbbb] mb-[2px]">TokenId</div>
            <div class="text-[15px] text-[#f5f5f5] break-all">{{ props.holding?.tokenId }}</div>
          </div>
        </div>
        
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



