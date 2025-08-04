<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScreenSize } from '~/composables/useScreenSize'
import Informational from '~/components/icon/Informational.vue';
import Eye from '~/components/icon/Eye.vue'
import KadenaIcon from '~/components/icon/Kadena.vue'
import UpperRightArrow from '~/components/icon/UpperRightArrow.vue'
import Coins from '~/components/icon/Coins.vue'

definePageMeta({
  layout: 'app',
})

const { isMobile } = useScreenSize()
const route = useRoute()


const account = {
  address: '0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263',
  kdaBalance: '0.000027157124631',
  kdaValue: '0.10',
  kdaPrice: '3,727.58',
  tokenHoldings: '2.66',
  tokenCount: '64',
  latestTransaction: '17 secs ago',
  firstTransaction: '2 yrs 312 days ago',
  fundedBy: {
    address: '0x408...F6C',
    name: 'MEV Bot',
    date: '2 yrs 312 days ago'
  },
  multichainPortfolio: '38.62',
  totalTransactions: '811,385',
  badge: '99+'
}

// Tab management
const tabs = [
  { id: 'transactions', label: 'Transactions' },
  { id: 'token-transfers', label: 'Token Transfers' },
  { id: 'nft-transfers', label: 'NFT Transfers' }
]
const activeTab = ref('transactions')

// Select options
const apiOptions = [
  { label: 'API', value: 'api' },
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
]
const apiSelected = ref(apiOptions[0])

const menuOptions = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
]
const menuSelected = ref(menuOptions[0])

const showMoreDetails = ref(false)
const contentHeight = ref(0)
const contentRef = ref<HTMLElement | null>(null)

const toggleMoreDetails = () => {
  if (!showMoreDetails.value) {
    showMoreDetails.value = true
    nextTick(() => {
      if (contentRef.value) {
        contentHeight.value = contentRef.value.scrollHeight
      }
    })
  } else {
    contentHeight.value = 0
    setTimeout(() => {
      showMoreDetails.value = false
    }, 300)
  }
}

useHead({
  title: 'Kadscan'
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center pb-5 border-b border-[#222222] mb-6 gap-2 px-1">
      <div class="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-[#8B4513] to-[#A0522D] flex items-center justify-center">
        <div class="w-6 h-6 grid grid-cols-3 grid-rows-3 gap-0.5">
          <div class="bg-[#0066CC]"></div>
          <div class="bg-[#8B4513]"></div>
          <div class="bg-[#8B4513]"></div>
          <div class="bg-[#8B4513]"></div>
          <div class="bg-[#0066CC]"></div>
          <div class="bg-[#8B4513]"></div>
          <div class="bg-[#8B4513]"></div>
          <div class="bg-[#0066CC]"></div>
          <div class="bg-[#8B4513]"></div>
        </div>
      </div>
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
        Address
      </h1>
      <span class="text-[15px] text-[#f5f5f5]">{{ account.address }}</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <!-- Card 1: Overview -->
      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4">
        <h3 class="text-[#fafafa] font-semibold mb-4">Overview</h3>
        <div class="space-y-4">
          <div>
            <div class="text-xs text-[#bbbbbb] font-medium mb-1">KDA BALANCE</div>
            <div class="flex items-center gap-2">
              <KadenaIcon class="w-3 h-3 text-[#bbbbbb]" />
              <span class="text-[14px] text-[#fafafa]">{{ account.kdaBalance }} KDA</span>
            </div>
          </div>
          <div>
            <div class="text-xs text-[#bbbbbb] font-medium mb-1">KDA VALUE</div>
            <div class="text-[#fafafa] text-[15px]">${{ account.kdaValue }} (@ ${{ account.kdaPrice }}/KDA)</div>
          </div>
          <div>
            <div class="text-xs text-[#bbbbbb] font-medium mb-1">TOKEN HOLDINGS</div>
            <div class="w-full">
              <button class="w-full px-3 py-2 rounded border border-[#222] bg-[#151515] text-[#fafafa] text-sm hover:bg-[#222] transition-colors flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span>${{ account.tokenHoldings }}</span><span class="text-[#bbbbbb] text-xs"> ({{ account.tokenCount }} Tokens)</span>
                </div>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
         
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4">
        <h3 class="text-[#fafafa] font-semibold mb-4">More Info</h3>
        <div class="space-y-4">
          <div>
            <div class="text-xs text-[#bbbbbb] font-medium mb-1">TRANSACTIONS SENT</div>
            <div class="space-y-1">
              <div class="flex items-center">
                <span class="text-[#bbb] text-sm mr-1">Latest:</span><span class="text-[#fafafa] text-sm"> {{ account.latestTransaction }}</span>
                <UpperRightArrow class="w-4 h-4 text-[#bbbbbb] mr-2" />
                <span class="text-[#bbb] text-sm mr-1">First: </span><span class="text-[#fafafa] text-sm">{{ account.firstTransaction }}</span>
                <UpperRightArrow class="w-4 h-4 text-[#bbbbbb]" />
              </div>
            </div>
          </div>
          <div>
            <div class="text-xs text-[#bbbbbb] font-medium">FUNDED BY</div>
            <div class="flex items-center">
              <span class="text-[#6AB5DB] hover:text-[#9ccee7] text-sm ">{{ account.fundedBy.name }}: {{ account.fundedBy.address }}</span>
              <Copy :value="account.fundedBy.address" />
              
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#111111] border border-[#222222] rounded-xl p-4">
        <h3 class="text-[#fafafa] font-semibold mb-4">Multichain Info</h3>
        <div class="space-y-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#222222] border border-[#333333]">
              <Coins class="w-4 h-4 text-white" />
              <span class="text-white text-sm">${{ account.multichainPortfolio }} (Multichain Portfolio)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex items-center justify-between mb-4 overflow-x-auto">
      <div class="flex items-center gap-2">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-3 py-1 rounded-lg text-sm font-medium transition-colors whitespace-nowrap relative',
            activeTab === tab.id 
              ? 'bg-[#0784c3] text-white' 
              : 'bg-[#222222] text-[#fafafa] hover:bg-[#333333]'
          ]"
        >
          {{ tab.label }}
          <span 
            v-if="tab.badge" 
            class="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full"
          >
            {{ tab.badge }}
          </span>
        </button>
      </div>
      
    </div>

    <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-2">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="text-[#fafafa] font-medium">Latest 25 from a total of {{ account.totalTransactions }} transactions</span>
        </div>
      </div>

      <!-- Table Headers -->
      <table class="w-full">
        <thead>
          <tr class="text-xs text-[#bbbbbb] font-medium border-b border-[#333] pb-2">
            <th class="text-left py-2">
              <div class="flex px-1">
                <Informational class="w-3 h-3" />
              </div>
            </th>
            <th class="text-left py-2">
              <div class="flex items-center gap-1">
                Transaction Hash
              </div>
            </th>
            <th class="text-left py-2">
              <div class="flex items-center gap-1">
                Method
              </div>
            </th>
            <th class="text-left py-2">Block</th>
            <th class="text-left py-2">Age</th>
            <th class="text-left py-2">From</th>
            <th class="text-left py-2">To</th>
            <th class="text-left py-2">Amount</th>
            <th class="text-left py-2">Txn Fee</th>
          </tr>
        </thead>
        <tbody>
          <!-- Row 1 -->
          <tr class="text-sm border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
            <td class="py-3">
              <div class="flex items-center justify-center w-6 h-6 bg-[#151515] border border-[#222] rounded-lg hover:bg-[#222] transition-colors">
                <Eye class="w-5 h-5 text-[#fafafa]" />
              </div>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7] font-mono text-xs">0x2db83d4548f...</span>
                <Copy :value="'0x2db83d4548f...'" />
              </div>
            </td>
            <td class="py-3">
              <span class="px-2 py-1 rounded text-xs bg-[#333333] text-white border border-[#444444]">Transfer</span>
            </td>
            <td class="py-3">
              <span class="text-[#6AB5DB] hover:text-[#9ccee7]">23021867</span>
            </td>
            <td class="py-3">
              <span class="text-[#fafafa]">40 secs ago</span>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">Titan</span>
                <Copy :value="'Titan Builder'" />
              </div>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">Beg</span>
                <Copy :value="'Beg'" />
              </div>
            </td>
            <td class="py-3">
              <span class="text-[#fafafa]">0.01543647 KDA</span>
            </td>
            <td class="py-3">
              <span class="text-[#fafafa]">0.00000722</span>
            </td>
          </tr>

          <!-- Row 2 -->
          <tr class="text-sm border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
            <td class="py-3">
              <div class="flex items-center justify-center w-6 h-6 bg-[#151515] border border-[#222] rounded-lg hover:bg-[#222] transition-colors">
                <Eye class="w-5 h-5 text-[#fafafa]" />
              </div>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7] font-mono text-xs">0x7a8f9c2d1e...</span>
                <Copy :value="'0x7a8f9c2d1e...'" />
              </div>
            </td>
            <td class="py-3">
              <span class="px-2 py-1 rounded text-xs bg-[#333333] text-white border border-[#444444]">Transfer</span>
            </td>
            <td class="py-3">
              <span class="text-[#6AB5DB] hover:text-[#9ccee7]">22991266</span>
            </td>
            <td class="py-3">
              <span class="text-[#fafafa]">4 mins ago</span>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">quasarbuilder</span>
                <Copy :value="'quasarbuilder'" />
              </div>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">Beg</span>
                <Copy :value="'beg'" />
              </div>
            </td>
            <td class="py-3">
              <span class="text-[#fafafa]">0.03060837 KDA</span>
            </td>
            <td class="py-3">
              <span class="text-[#fafafa]">0.00004215</span>
            </td>
          </tr>

          <!-- Row 3 -->
          <tr class="text-sm border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
            <td class="py-3">
              <div class="flex items-center justify-center w-6 h-6 bg-[#151515] border border-[#222] rounded-lg hover:bg-[#222] transition-colors">
                <Eye class="w-5 h-5 text-[#fafafa]" />
              </div>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7] font-mono text-xs">0x9b2e4f8a3c...</span>
                <Copy :value="'0x9b2e4f8a3c...'" />
              </div>
            </td>
            <td class="py-3">
              <span class="px-2 py-1 rounded text-xs bg-[#333333] text-white border border-[#444444]">Transfer</span>
            </td>
            <td class="py-3">
              <span class="text-[#6AB5DB] hover:text-[#9ccee7]">22991265</span>
            </td>
            <td class="py-3">
              <span class="text-[#fafafa]">6 mins ago</span>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">BuilderNet</span>
                <Copy :value="'BuilderNet'" />
              </div>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">Beg</span>
                <Copy :value="'Beg'" />
              </div>
            </td>
            <td class="py-3">
              <span class="text-[#fafafa]">0.07929505 KDA</span>
            </td>
            <td class="py-3">
              <span class="text-[#fafafa]">0.00005123</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
