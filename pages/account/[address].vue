<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScreenSize } from '~/composables/useScreenSize'
import Informational from '~/components/icon/Informational.vue';
import Eye from '~/components/icon/Eye.vue'
import KadenaIcon from '~/components/icon/Kadena.vue'
import UpperRightArrow from '~/components/icon/UpperRightArrow.vue'
import Coins from '~/components/icon/Coins.vue'
import Copy from '~/components/Copy.vue'

definePageMeta({
  layout: 'app',
})

const { isMobile } = useScreenSize()
const route = useRoute()


const account = {
  address: 'k:458aDbs7c',
  kdaBalance: '0.000027157124631',
  kdaValue: '0.10',
  kdaPrice: '3,727.58',
  tokenHoldings: '2.66',
  tokenCount: '64',
  latestTransaction: '17 secs ago',
  firstTransaction: '2 yrs 312 days ago',
  fundedBy: {
    address: 'k:7f3a9b2d8e',
    name: 'k:7f3a9b2d8e',
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
                <span class="text-[#6AB5DB] hover:text-[#9ccee7] font-mono text-xs">2Hd8kF9mN3</span>
                <Copy :value="'2Hd8kF9mN3pQ7rT5uW1xY6zB4cE8fG2jK5mP8sV1wX4yA7dF0gH3jM6pS9vY2eR5tU8xA1dG4'" />
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
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">k:a1b2c3d4</span>
                <Copy :value="'k:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6'" />
              </div>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">k:f7e8d9c0</span>
                <Copy :value="'k:f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4'" />
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
                <span class="text-[#6AB5DB] hover:text-[#9ccee7] font-mono text-xs">9KmL3nP6qR</span>
                <Copy :value="'9KmL3nP6qR8sT5uV2wX7yZ0aB4cD1eF8gH9jK2mN5oP8qR3sT6uV9wX2yZ5aB8cD1eF4gH7j'" />
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
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">k:b2c3d4e5</span>
                <Copy :value="'k:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8'" />
              </div>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">k:g8h9i0j1</span>
                <Copy :value="'k:g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3'" />
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
                <span class="text-[#6AB5DB] hover:text-[#9ccee7] font-mono text-xs">7PqR5sT8uV</span>
                <Copy :value="'7PqR5sT8uV1wX4yZ9aB2cD5eF8gH1jK4mN7oP0qR3sT6uV9wX2yZ5aB8cD1eF4gH7jK0mN3o'" />
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
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">k:c3d4e5f6</span>
                <Copy :value="'k:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9'" />
              </div>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <span class="text-[#6AB5DB] hover:text-[#9ccee7]">k:h1i2j3k4</span>
                <Copy :value="'k:h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5'" />
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
