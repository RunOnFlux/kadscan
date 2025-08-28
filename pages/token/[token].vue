<script setup lang="ts">
import { ref, computed } from 'vue'
import Select from '~/components/Select.vue'
import Copy from '~/components/Copy.vue'
import Coins from '~/components/icon/Coins.vue'
import TokenTransfers from '~/components/token/TokenTransfers.vue'
import TokenHolders from '~/components/token/TokenHolders.vue'
import ContractView from '~/components/contract/View.vue'

definePageMeta({
  layout: 'app',
})

const route = useRoute()

const tokenSlug = computed(() => route.params.token as string)
const moduleName = computed(() => (tokenSlug.value || '').replaceAll('-', '.'))

const activeTab = ref<'transfers' | 'holders' | 'contract'>('transfers')

const tabs = computed(() => [
  { id: 'transfers', label: 'Transfers' },
  { id: 'holders', label: 'Holders' },
  { id: 'contract', label: 'Contract' },
])

const activeComponent = computed(() => {
  switch (activeTab.value) {
    case 'transfers':
      return TokenTransfers
    case 'holders':
      return TokenHolders
    case 'contract':
      return ContractView
    default:
      return TokenTransfers
  }
})

const activeProps = computed(() => {
  return { modulename: moduleName.value, chain: route.query.chain as any }
})

const overviewChainLabel = computed(() => {
  const q = route.query.chain as string | undefined
  if (q === undefined) return 'Showing All Chains'
  const n = parseInt(q, 10)
  const isValid = !Number.isNaN(n) && n >= 0 && n <= 19
  return isValid ? `Showing Chain ${n}` : 'Showing All Chains'
})

const selectedChainSelect = computed({
  get() {
    const q = route.query.chain as string | undefined
    const n = q !== undefined ? parseInt(q, 10) : undefined
    const isValid = n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19
    if (!isValid) {
      return { label: `All Chains`, value: null }
    }
    return { label: `Chain ${n}`, value: `${n}` }
  },
  set(_val: any) {}
})

const chainSelectOptions = computed(() => {
  const opts: Array<{ label: string; value: any }> = []
  opts.push({ label: `All Chains`, value: null })
  for (let i = 0; i <= 19; i++) {
    opts.push({ label: `Chain ${i}`, value: `${i}` })
  }
  return opts
})

const onChangeChainSelect = (option: any) => {
  const query = { ...route.query }
  if (!option || option.value === null) {
    delete (query as any).chain
  } else {
    ;(query as any).chain = option.value
  }
  navigateTo({ query }, { replace: true })
}

useHead({
  title: `Token ${moduleName.value} - Kadscan`
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="pb-5 border-b border-[#222222] mb-6 px-1">
      <div class="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
        <div class="flex items-center gap-2 mb-1 md:mb-0">
          <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">Token</h1>
        </div>
        <div class="flex flex-col md:flex-row md:items-center md:gap-3">
          <div class="text-[15px] text-[#f5f5f5] break-all">{{ moduleName }}</div>
          <div class="flex items-center gap-3 pt-2 md:pt-0">
            <Copy 
              :value="moduleName" 
              tooltipText="Copy Module Name"
              iconSize="h-5 w-5"
              buttonClass="w-5 h-5"
              placement="bottom"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Top Blocks -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 items-stretch">
      <!-- Overview -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#fafafa] font-semibold mb-4">
          Overview <span class="text-[#bbbbbb] font-normal">— {{ overviewChainLabel }}</span>
        </h3>
        <div class="flex-1 flex items-center justify-center text-[#888888] text-[14px]">Coming soon...</div>
      </div>

      <!-- More Info -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#fafafa] font-semibold mb-4">More Info</h3>
        <div class="flex-1 flex items-center justify-center text-[#888888] text-[14px]">Coming soon...</div>
      </div>

      <!-- Multichain Info -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4 h-full flex flex-col shadow-[0_0_20px_rgba(255,255,255,0.0625)]">
        <h3 class="text-[#fafafa] font-semibold mb-4">Multichain Info</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <Select
              :modelValue="selectedChainSelect"
              @update:modelValue="onChangeChainSelect"
              :items="chainSelectOptions"
              position="bottom-left"
              size="default"
              variant="filled"
              :fullWidth="false"
            >
              <div class="inline-flex items-center gap-2">
                <Coins class="w-4 h-4 text-[#fafafa]" />
                <span class="text-[#fafafa] text-[14px]">
                  Coming soon... <span class="text-[#bbbbbb] text-[13px]">(All Chains)</span>
                </span>
              </div>
            </Select>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-center justify-between mb-4 overflow-x-auto">
      <div class="flex items-center gap-2">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id as any"
          :class="[
            'px-3 py-1 rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap relative',
            activeTab === tab.id 
              ? 'bg-[#009367] text-[#fafafa]' 
              : 'bg-[#222222] text-[#fafafa] hover:bg-[#333333]'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="mb-6">
      <KeepAlive include="TokenTransfers,TokenHolders,ContractCode">
        <component :is="activeComponent" v-bind="activeProps" />
      </KeepAlive>
    </div>
  </div>
</template>


