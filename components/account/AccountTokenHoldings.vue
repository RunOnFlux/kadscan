<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { staticTokens, unknownToken, unknownNft } from '~/constants/tokens'
import { useAccountNFTs } from '~/composables/useAccountNFTs'
import { useAssetUsdPrices } from '~/composables/useAssetUsdPrices'

const props = defineProps<{
  loading: boolean,
  balances: Array<{ balance: string; chainId: string; module: string }>,
}>()

const emit = defineEmits<{
  (e: 'view-all-assets'): void,
}>()

const open = ref(false)
const search = ref('')
const { getUsdPerUnit, primeModules } = useAssetUsdPrices()
const formatUsd = (v: number) => `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)}`
const formatAmount12 = (v: string | number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 12 }).format(Number(v || 0))

function deriveNameFromModule(module: string): string {
  const text = module || ''
  const afterDot = text.split('.')?.[1] || text
  const cleaned = afterDot.replace(/[-_]+/g, ' ')
  const lower = cleaned.toLowerCase()
  return lower ? lower.charAt(0).toUpperCase() + lower.slice(1) : 'Unknown'
}

const tokenItems = computed(() => {
  const list = (props.balances || []).map((n: any) => {
    const meta = staticTokens.find(t => t.module === n.module) || unknownToken
    const fallbackToModule = !meta?.name || meta.name.toLowerCase() === 'unknown'
    const name = fallbackToModule ? deriveNameFromModule(n.module) : meta.name
    const unitUsd = getUsdPerUnit(n.module)
    const amountNum = Number(n.balance || 0)
    const usd = Number.isFinite(unitUsd) ? parseFloat((unitUsd * amountNum).toFixed(2)) : 0
    return {
      type: 'token',
      name,
      module: n.module,
      icon: meta.icon || '',
      chainId: n.chainId,
      amount: n.balance,
      usd,
    }
  })
  // sort by USD desc
  return list.sort((a: any, b: any) => (b.usd || 0) - (a.usd || 0))
})

// NFTs sourced from composable already used elsewhere on the page
const { nfts, metadataByKey, metadataErrors } = useAccountNFTs()

// Track thumbnails that failed to load so we can show the IPFS label
const miniBroken = ref<Record<string, boolean>>({})

function keyForItem(item: any): string {
  if (item && item.chainId !== undefined && item.tokenId !== undefined) return `${item.chainId}:${item.tokenId}`
  return String(Math.random())
}

function isMiniBroken(item: any): boolean {
  const k = keyForItem(item)
  return !!miniBroken.value[k]
}

function markMiniBroken(item: any) {
  const k = keyForItem(item)
  miniBroken.value = { ...miniBroken.value, [k]: true }
}

const nftItems = computed(() => {
  const rows = nfts.value || []
  return rows.map((h: any) => {
    const k = `${h.chainId}:${h.tokenId}`
    const meta = (metadataByKey as any).value?.[k] || null
    const name = (meta?.name as string) || 'Unknown'
    const icon = (meta?.image as string) || null
    const metaErr = !!((metadataErrors as any).value?.[k])
    return {
      type: 'nft',
      name,
      icon,
      chainId: h.chainId,
      amount: String(h.balance ?? 1),
      tokenId: h.tokenId,
      metaErr,
    }
  }) as Array<{ type: 'nft'; name: string; icon: string | null; chainId: string; amount: string; tokenId: string; metaErr: boolean }>
})

const nonZeroTokens = computed(() => tokenItems.value.filter(i => Number(i.amount) > 0))

// Sum USD across visible token items (non-zero balances)
const totalUsd = computed(() => {
  try {
    return nonZeroTokens.value.reduce((acc: number, it: any) => acc + (Number(it.usd) || 0), 0)
  } catch {
    return 0
  }
})

const filteredTokenItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  const base = nonZeroTokens.value
  if (!q) return base
  return base.filter(i =>
    i.name.toLowerCase().includes(q) || i.module.toLowerCase().includes(q)
  )
})

const filteredNftItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return nftItems.value
  return nftItems.value.filter(i => i.name.toLowerCase().includes(q) || String(i.tokenId).toLowerCase().includes(q))
})

const tokensCount = computed(() => nonZeroTokens.value.length)
const nftsCount = computed(() => nftItems.value.length)
const assetsCount = computed(() => tokensCount.value + nftsCount.value)

const close = () => { open.value = false }

const onViewAll = () => {
  emit('view-all-assets')
  close()
}

// Prime prices when dropdown receives balances
watch(() => props.balances, (arr) => {
  const mods = (arr || []).map((b: any) => b?.module).filter(Boolean)
  primeModules(mods)
}, { immediate: true })
</script>

<template>
  <div class="relative" v-outside="close">
    <button 
      class="w-full px-3 py-2 rounded-md border border-line-default bg-surface-disabled text-font-primary text-[14px] hover:bg-surface-secondary transition-colors flex items-center justify-between"
      @click.prevent="open = !open"
      aria-haspopup="true"
      :aria-expanded="open ? 'true' : 'false'"
    >
      <div class="flex items-center gap-2">
        <span>{{ formatUsd(totalUsd || 0) }}</span>
        <span class="text-font-secondary text-[13px]"> ({{ assetsCount }} Assets)</span>
      </div>
      <svg class="w-4 h-4" fill="none" viewBox="0 0 16 16">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div 
      v-if="open"
      class="absolute z-30 mt-2 w-full max-h-[420px] rounded-md border border-line-default bg-surface-primary shadow-[0_0_20px_rgba(255,255,255,0.0625)] flex flex-col overflow-hidden"
    >
      <!-- Search -->
      <div class="px-3 py-3 bg-surface-primary border-b border-line-default">
        <input
          v-model="search"
          type="text"
          placeholder="Search for Token or NFT"
          class="w-full px-3 py-2 rounded-lg bg-surface-disabled border border-line-default text-font-primary placeholder-font-tertiary text-[14px] outline-none focus:ring-2 focus:ring-line-strong"
        />
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Tokens Group -->
        <div class="px-3 pt-3 pb-2">
          <div class="flex items-center justify-between px-3 py-2 rounded-md bg-surface-disabled text-font-secondary text-[15px] font-semibold">
            <span>Tokens ({{ tokensCount }})</span>
          </div>
        </div>

        <div v-if="loading" class="px-3 py-2 text-[14px] text-font-tertiary">Loading...</div>
        <div v-else-if="filteredTokenItems.length === 0" class="px-5 pb-2 text-[13px] text-font-tertiary">No Tokens</div>
        <div v-else>
          <NuxtLink 
            v-for="(item, idx) in filteredTokenItems" 
            :key="`token-${idx}`"
            :to="`/token/${item.module}`"
            class="px-5 py-2 text-[14px] text-font-primary flex items-center justify-between border-b border-line-default last:border-b-0 hover:bg-surface-disabled"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-7 h-7 rounded-full bg-surface-secondary overflow-hidden grid place-items-center">
                <img v-if="item.icon" :src="item.icon" alt="icon" class="w-7 h-7 object-contain" />
                <span v-else class="text-[12px] text-font-primary">
                  {{ (item.name || 'U')[0]?.toUpperCase() }}
                </span>
              </div>
              <div class="min-w-0">
                <div class="text-[14px] text-link truncate">{{ item.name }}</div>
                <div class="text-[13px] text-font-secondary truncate">Chain <b>{{ item.chainId }}</b></div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[14px]">{{ formatUsd(item.usd || 0) }}</div>
              <div v-if="Number(item.amount) > 0" class="text-[12px] text-font-secondary">{{ formatAmount12(item.amount) }}</div>
            </div>
          </NuxtLink>
        </div>

        <!-- NFTs Group -->
        <div class="px-3 pt-3 pb-2">
          <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-disabled text-font-secondary text-[15px] font-semibold">
            <span>NFTs ({{ nftsCount }})</span>
          </div>
        </div>
        <div v-if="filteredNftItems.length === 0" class="px-5 pb-2 text-[13px] text-font-tertiary">No NFTs</div>
        <div v-else>
          <div
            v-for="(item, idx) in filteredNftItems"
            :key="`nft-${idx}`"
            class="px-5 py-2 text-[14px] text-font-primary flex items-center justify-between border-b border-line-default last:border-b-0"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-6 h-6 rounded bg-surface-secondary grid place-items-center overflow-hidden">
                <img v-if="item.icon && !isMiniBroken(item)" :src="item.icon" alt="nft" class="w-full h-full object-cover" @error="markMiniBroken(item)" />
                <span v-else-if="!item.metaErr && !isMiniBroken(item)" class="inline-block">
                  <span class="block w-[10px] h-[10px] border-2 border-font-secondary border-t-transparent rounded-full animate-spin"></span>
                </span>
                <span v-else class="text-[9px] text-font-danger leading-none">IPFS</span>
              </div>
              <div class="min-w-0">
                <div class="text-[14px] text-font-primary truncate">{{ item.name || 'Unknown' }}</div>
                <div class="text-[13px] text-font-secondary truncate">Chain <b>{{ item.chainId }}</b> · #{{ item.tokenId }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[12px] text-font-secondary">{{ item.amount }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer CTA (sticky bottom, styled like List.vue) -->
      <div class="px-6 py-3 text-center bg-surface-disabled rounded-b-md border-t border-line-default">
        <button 
          class="text-[12px] font-semibold text-font-secondary hover:text-font-accent-strong"
          @click.prevent="onViewAll"
        >
          VIEW ALL ASSETS &rarr;
        </button>
      </div>
    </div>
  </div>
</template>


