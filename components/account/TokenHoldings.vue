<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { staticTokens, unknownToken, unknownNft } from '~/constants/tokens'

const props = defineProps<{
  loading: boolean,
  balances: Array<{ balance: string; chainId: string; module: string }>,
}>()

const emit = defineEmits<{
  (e: 'view-all-assets'): void,
}>()

const open = ref(false)
const search = ref('')

const tokenItems = computed(() => {
  const list = (props.balances || []).map((n: any) => {
    const meta = staticTokens.find(t => t.module === n.module) || unknownToken
    return {
      type: 'token',
      name: meta.name || n.module,
      module: n.module,
      icon: meta.icon || '',
      chainId: n.chainId,
      amount: n.balance,
    }
  })
  return list
})

// Placeholder for NFTs (no data source wired here yet)
const nftItems = computed(() => {
  return [] as Array<{ type: 'nft'; name: string; icon: string; chainId: string; amount: string }>
})

const nonZeroTokens = computed(() => tokenItems.value.filter(i => Number(i.amount) > 0))

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
  return nftItems.value.filter(i => i.name.toLowerCase().includes(q))
})

const tokensCount = computed(() => nonZeroTokens.value.length)
const nftsCount = computed(() => nftItems.value.length)

const close = () => { open.value = false }

const onViewAll = () => {
  emit('view-all-assets')
  close()
}
</script>

<template>
  <div class="relative" v-outside="close">
    <button 
      class="w-full px-3 py-2 rounded-md border border-[#222] bg-[#151515] text-[#fafafa] text-[14px] hover:bg-[#222] transition-colors flex items-center justify-between"
      @click.prevent="open = !open"
      aria-haspopup="true"
      :aria-expanded="open ? 'true' : 'false'"
    >
      <div class="flex items-center gap-2">
        <span>Assets</span>
        <span class="text-[#bbbbbb] text-[13px]"> ({{ tokensCount }} Tokens)</span>
      </div>
      <svg class="w-4 h-4" fill="none" viewBox="0 0 16 16">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div 
      v-if="open"
      class="absolute z-30 mt-2 w-full max-h-[420px] rounded-md border border-[#222] bg-[#0f0f0f] shadow-xl flex flex-col overflow-hidden"
    >
      <!-- Search -->
      <div class="px-3 py-3 bg-[#0f0f0f] border-b border-[#1f1f1f]">
        <input
          v-model="search"
          type="text"
          placeholder="Search for Token or NFT"
          class="w-full px-3 py-2 rounded-lg bg-[#151515] border border-[#222] text-[#fafafa] placeholder-[#777] text-[14px] outline-none focus:ring-2 focus:ring-[#2a2a2a]"
        />
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Tokens Group -->
        <div class="px-3 pt-3 pb-2">
          <div class="flex items-center justify-between px-3 py-2 rounded-md bg-[#141414] text-[#fafafa] text-[15px] font-semibold">
            <span>Tokens ({{ tokensCount }})</span>
          </div>
        </div>

        <div v-if="loading" class="px-3 py-2 text-[14px] text-[#888888]">Loading...</div>
        <div v-else>
          <div 
            v-for="(item, idx) in filteredTokenItems" 
            :key="`token-${idx}`"
            class="px-5 py-2 text-[14px] text-[#fafafa] flex items-center justify-between border-b border-[#1f1f1f] last:border-b-0"
          >
            <div class="flex items-center gap-3 min-w-0">
              <img :src="item.icon" class="w-6 h-6 rounded-full bg-[#222] object-contain" alt="" />
              <div class="min-w-0">
                <div class="text-[14px] text-[#fafafa] truncate">{{ item.name }}</div>
                <div class="text-[13px] text-[#bbbbbb] truncate">Chain <b>{{ item.chainId }}</b></div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-[14px]">$0.0</div>
              <div v-if="Number(item.amount) > 0" class="text-[12px] text-[#bbbbbb]">{{ item.amount }}</div>
            </div>
          </div>
        </div>

        <!-- NFTs Group -->
        <div class="px-3 pt-3 pb-2 mt-2">
          <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-[#141414] text-[#fafafa] text-[15px] font-semibold">
            <span>NFTs ({{ nftsCount }})</span>
          </div>
        </div>
        <div v-if="filteredNftItems.length === 0" class="px-5 pb-2 text-[13px] text-[#888]">No NFTs</div>
      </div>

      <!-- Footer CTA (sticky bottom, styled like List.vue) -->
      <div class="px-6 py-3 text-center bg-[#151515] rounded-b-md border-t border-[#222222]">
        <button 
          class="text-[12px] font-semibold text-[#b8b8b8] hover:text-[#9ccee7]"
          @click.prevent="onViewAll"
        >
          VIEW ALL ASSETS &rarr;
        </button>
      </div>
    </div>
  </div>
</template>


