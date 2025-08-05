<script lang="ts" setup>
import { ref, computed, watch, onUnmounted, onMounted, nextTick } from 'vue';
import { useFormat } from '~/composables/useFormat';
import { useBlock } from '~/composables/useBlock';
import { useBlocks } from '~/composables/useBlocks';
import { useSharedData } from '~/composables/useSharedData';
import { useScreenSize } from '~/composables/useScreenSize';
import IconCheckmarkFill from '~/components/icon/CheckmarkFill.vue';
import IconHourglass from '~/components/icon/Hourglass.vue';
import IconCancel from '~/components/icon/Cancel.vue';
import GasUsage from '~/components/column/Gas.vue';
import SkeletonBlockDetails from '~/components/skeleton/BlockDetails.vue';
import { useBinance } from '~/composables/useBinance';

definePageMeta({
  layout: 'app',
});

const textContent = {
  blockHeight: { label: 'Block Height:', description: 'Also known as Block Number. The block height, which indicates the length of the blockchain, increases after the addition of the new block.' },
  chainId: { label: 'Chain ID:', description: 'The specific chain (0-19) on which this block was mined' },
  status: { label: 'Status:', description: 'The finality status of the block.' },
  creationTime: { label: 'Creation Time:', description: 'The date and time at which a block is produced.' },
  transactions: { label: 'Transactions:', description: 'The number of transactions in the block.' },
  events: { label: 'Events:', description: 'Number of events emitted by the block’s transactions' },
  minerAccount: { label: 'Miner Account:', description: 'Address receiving fees from transactions in this block.' },
  blockReward: { label: 'Block Reward:', description: 'For each block, the block producer is rewarded with a finite amount of KDA on top of the fees paid for all transactions in the block.' },
  difficulty: { label: 'Difficulty:', description: 'Total dificulty of the chain until this block.' },
  nonce: { label: 'Nonce:', description: 'A random value used by miners to create a valid proof-of-work hash.' },
  gasUsed: { label: 'Gas Used:', description: 'The total gas used in the block and its percentage of gas filled in the block.' },
  gasLimit: { label: 'Gas Limit:', description: 'Maximum gas allowed in the block.' },
  gasPrice: { label: 'Gas Price:', description: 'Average gas price of transactions in this block.' },
  kadenaPrice: { label: 'Kadena Price:', description: 'Closing price of Kadena on date of transaction.' },
  epoch: { label: 'Epoch:', description: 'Start time of the current epoch.' },
  flags: { label: 'Flags:', description: 'Hex-encoded bits used for configuration.' },
  target: { label: 'Target:', description: 'Hash must be below this value to be valid.' },
  weight: { label: 'Weight:', description: 'Cumulative difficulty up to this block.' },
  hash: { label: 'Hash:', description: 'Unique hash of this block (header hash).' },
  parentHash: { label: 'Parent Hash:', description: 'Hash of the previous block in this chain.' },
  powHash: { label: 'POW Hash:', description: 'Hash result of the proof-of-work computation.' },
  payloadHash: { label: 'Payload Hash:', description: 'Hash of the block’s transaction payload.' },
  neighbor: { label: 'Neighbor at Chain #', description: 'Block at same height on another chain.' },
  moreDetails: { label: 'More Details' },
};


const { formatFullDate, truncateAddress, removeTrailingZeros } = useFormat();
const route = useRoute();
const router = useRouter();
const { isMobile } = useScreenSize();
const { selectedNetwork } = useSharedData();
const { totalCount: lastBlockHeight, fetchTotalCount } = useBlocks();

const activeView = ref('overview');
const showMore = ref(false);
const height = computed(() => Number(route.params.height));
const chainId = computed(() => Number(route.params.chainId));
const networkId = computed(() => selectedNetwork.value?.id);
const selectedBlockIndex = ref(0);

// More details animation variables
const contentHeight = ref(0);
const contentRef = ref<HTMLElement | null>(null);

const toggleMoreDetails = () => {
  if (!showMore.value) {
    showMore.value = true;
    nextTick(() => {
      if (contentRef.value) {
        contentHeight.value = contentRef.value.scrollHeight;
      }
    });
  } else {
    contentHeight.value = 0;
    setTimeout(() => {
      showMore.value = false;
    }, 300);
  }
};

const {
  block: initialBlock,
  loading,
  error,
  fetchBlock,
  competingBlocks,
  canonicalIndex,
  totalGasUsed,
  totalGasPrice,
  gasLoading,
  kadenaPrice,
} = useBlock(height, chainId, networkId);

const block = computed(() => {
  if (competingBlocks.value.length > 0) {
    return competingBlocks.value[selectedBlockIndex.value];
  }
  return initialBlock.value;
});

const blockStatus = computed(() => {
  if(lastBlockHeight.value - 10 >= block.value.height && !block.value.canonical) {
    return {
      text: 'Orphaned',
      icon: IconCancel,
      classes: 'bg-[#7f1d1d66] border-[#f87171] text-[#f87171]',
      description: 'Block is not part of the canonical chain and is orphaned',
    };
  }

  if(block.value.canonical) {
    return {
      text: 'Finalized',
      icon: IconCheckmarkFill,
      classes: 'bg-[#0f1f1d] border-[#00a186] text-[#00a186]',
      description: 'Block is part of the canonical chain and safe to use',
    };
  }

  return {
    text: 'Pending',
    icon: IconHourglass,
    classes: 'bg-[#17150d] border-[#444649] text-[#989898]',
    description: 'Block is not part of the canonical chain and is pending to be finalized or orphaned',
  };
});

const coinbaseData = computed(() => {
  if (!block.value?.coinbase) {
    return null;
  }
  try {
    return JSON.parse(block.value.coinbase);
  } catch (e) {
    return null;
  }
});

const formattedKadenaPrice = computed(() => {
  if (kadenaPrice.value === null) {
    return 'N/A';
  }
  return `$${removeTrailingZeros(kadenaPrice.value)}`;
});

const formattedGasPrice = computed(() => {
  if (totalGasPrice.value === null) {
    return '0';
  }
  if(parseFloat(totalGasPrice.value) === 0) {
    return '0';
  }
  return `${(totalGasPrice.value)} KDA`;
});

const minerAccount = computed(() => coinbaseData.value?.events?.[0]?.params?.[1]);
const blockReward = computed(() => coinbaseData.value?.events?.[0]?.params?.[2]);
const isLastBlock = computed(() => lastBlockHeight.value === height.value);

const goToBlock = (newHeight: number, newChainId: number) => {
  if (newHeight < 0) return;
  router.push(`/blocks/${newHeight}/chain/${newChainId}`);
};

let pollingInterval: ReturnType<typeof setInterval> | null = null;

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

const startPolling = () => {
  stopPolling();
  pollingInterval = setInterval(() => {
    if (networkId.value) {
      fetchBlock();
      fetchTotalCount({ networkId: networkId.value });
    }
  }, 6000);
};

onUnmounted(() => {
  stopPolling();
});

watch(
  [height, chainId, networkId],
  () => {
    if (networkId.value) {
      fetchBlock();
    }
  },
  { immediate: true }
);

watch(
  [() => block.value, lastBlockHeight],
  ([currentBlock, newLastBlockHeight]) => {
    const isCanonical = currentBlock?.canonical;
    const isOldEnough = newLastBlockHeight - height.value >= 10;

    if (isCanonical || isOldEnough) {
      stopPolling();
    } else {
      startPolling();
    }
  },
  { deep: true }
);

watch(
  networkId,
  (newNetworkId) => {
    if (newNetworkId) {
      fetchTotalCount({ networkId: newNetworkId });
    }
  },
  { immediate: true }
);

watch(
  canonicalIndex,
  (newIndex) => {
    if (newIndex !== -1) {
      selectedBlockIndex.value = newIndex;
    }
  },
  { immediate: true }
);

// Redirect to error page when block is not found
watch(error, (newError) => {
  if (newError) {
    navigateTo('/error', { replace: true })
  }
})

useHead({
  title: `Block #${height.value} - Details`,
});
</script>

<template>
  <div>
    <div class="flex items-center pb-5 border-b border-[#222222] mb-6 gap-2">
      <h1 class="text-[19px] font-semibold leading-[150%] text-[#fafafa]">
        Block
      </h1>
      <span v-if="block" class="text-[15px] text-[#bbbbbb]"
        >#{{ block.height }}</span
      >
    </div>

    <SkeletonBlockDetails v-if="loading && !pollingInterval" />

    <div v-else-if="block && !error">
      <div class="flex items-center gap-2 pb-3">
        <button
          class="px-[10px] py-[5px] text-[13px] rounded-lg border font-medium transition-colors bg-[#009367] border-[#222222] text-[#f5f5f5]"
          :class="{
            'bg-[#009367] text-[#f5f5f5]': activeView === 'overview',
            'bg-transparent text-[#bbbbbb] hover:bg-[#222222]':
              activeView !== 'overview',
          }"
          @click="activeView = 'overview'"
        >
          Overview
        </button>
      </div>

      <div v-if="activeView === 'overview'">
        <div
          class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-1"
        >
          <Divide>
            <!-- Section 1: Core Information -->
            <DivideItem>
              <div class="flex flex-col gap-4">
                <LabelValue :row="isMobile" :label="textContent.blockHeight.label" :description="textContent.blockHeight.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <Tooltip value="View all chains for this block height" :offset-distance="8">
                        <NuxtLink :to="`/blocks/${block.height}`" class="text-[#6ab5db] hover:text-[#9ccee7] transition-colors">
                          {{ block.height }}
                        </NuxtLink>
                      </Tooltip>
                      <div class="flex gap-1">
                        <Tooltip
                          value="View previous Block"
                          :offset-distance="8"
                          :disabled="height === 0"
                        >
                          <button
                            @click="goToBlock(height - 1, chainId)"
                            :disabled="height === 0"
                            class="relative whitespace-nowrap inline-flex items-center p-1 rounded-md border border-[#222222] bg-[#111111] text-xs font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
                          >
                            <IconChevron class="h-3 w-3 transform rotate-180" />
                          </button>
                        </Tooltip>
                        <Tooltip
                          value="View next Block"
                          :offset-distance="8"
                          :disabled="isLastBlock"
                        >
                          <button
                            @click="goToBlock(height + 1, chainId)"
                            :disabled="isLastBlock"
                            class="relative whitespace-nowrap inline-flex items-center p-1 rounded-md border border-[#222222] bg-[#111111] text-xs font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
                          >
                            <IconChevron class="h-3 w-3" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue :row="isMobile" :label="textContent.chainId.label" :description="textContent.chainId.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <NuxtLink 
                        :to="`/blocks?chain=${block.chainId}`"
                        class="text-[#6ab5db] hover:text-[#9ccee7] cursor-pointer"
                      >
                        {{ String(block.chainId) }}
                      </NuxtLink>
                      <div class="flex gap-1">
                        <Tooltip value="View previous Chain" :offset-distance="8">
                          <button
                            @click="goToBlock(height, chainId - 1)"
                            :disabled="chainId === 0"
                            class="relative whitespace-nowrap inline-flex items-center p-1 rounded-md border border-[#222222] bg-[#111111] text-xs font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
                          >
                            <IconChevron class="h-3 w-3 transform rotate-180" />
                          </button>
                        </Tooltip>
                        <Tooltip value="View next Chain" :offset-distance="8">
                          <button
                            @click="goToBlock(height, chainId + 1)"
                            :disabled="chainId === 19"
                            class="relative whitespace-nowrap inline-flex items-center p-1 rounded-md border border-[#222222] bg-[#111111] text-xs font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
                          >
                            <IconChevron class="h-3 w-3" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue :row="isMobile" :label="textContent.status.label" :description="textContent.status.description" tooltipPos="right">
                  <template #value>
                    <Tooltip :value="blockStatus.description" :offset-distance="8">
                      <div
                        v-if="blockStatus"
                        class="px-2 py-1.5 text-[11px] rounded-md border flex items-center gap-1 leading-none"
                        :class="blockStatus.classes"
                      >
                        <component :is="blockStatus.icon" class="w-2.5 h-2.5" />
                        <span>
                          {{ blockStatus.text }}
                        </span>
                      </div>
                    </Tooltip>
                  </template>
                </LabelValue>
                <LabelValue 
                  :label="textContent.creationTime.label" 
                  :description="textContent.creationTime.description" 
                  tooltipPos="right"
                  topAlign="true"
                >
                  <template #value>
                    <div class="flex items-center gap-1 text-white">
                      <IconClock class="w-4 h-4" />
                      <span>{{ formatFullDate(block.creationTime) }}</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue
                  :label="textContent.transactions.label"
                  :value="block.transactions.totalCount"
                  :description="textContent.transactions.description"
                  tooltipPos="right"
                  topAlign="true"
                >
                  <template #value>
                    <Tooltip value="Click to view Transactions">
                      <NuxtLink
                        :to="`/transactions?block=${block.height}&chainId=${block.chainId}`"
                        class="text-[#6ab5db] hover:text-[#9ccee7]"
                      >
                        {{ block.transactions.totalCount }} transactions in this block
                      </NuxtLink>
                    </Tooltip>
                  </template>
                </LabelValue>
                <LabelValue
                  :label="textContent.events.label"
                  :description="textContent.events.description"
                  :value="`${block.events.totalCount} events in this block`"
                  tooltipPos="right"
                  :row="isMobile"
                />
              </div>
            </DivideItem>

            <!-- Section 2: Miner and Difficulty -->
            <DivideItem>
              <div class="flex flex-col gap-4">
                <LabelValue 
                  :label="textContent.minerAccount.label" 
                  :description="textContent.minerAccount.description" 
                  tooltipPos="right"
                  topAlign="true"
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <Tooltip :value="minerAccount" variant="hash">
                        <NuxtLink
                          :to="`/account/${minerAccount}`"
                          class="text-[#6ab5db] hover:text-[#9ccee7]"
                          >{{
                            truncateAddress(minerAccount, 10, 10)
                          }}</NuxtLink
                        >
                      </Tooltip>
                      <Copy
                        :value="minerAccount"
                        tooltipText="Copy Address"
                        iconSize="h-5 w-5"
                        buttonClass="w-5 h-5"
                      />
                    </div>
                  </template>
                </LabelValue>
                <LabelValue 
                  :label="textContent.blockReward.label" 
                  :description="textContent.blockReward.description" 
                  tooltipPos="right"
                  :row="isMobile"
                >
                  <template #value v-if="blockReward != null">
                    {{ blockReward }} KDA
                  </template>
                </LabelValue>
                <LabelValue 
                  :label="textContent.difficulty.label" 
                  :description="textContent.difficulty.description" 
                  :value="block.difficulty" 
                  tooltipPos="right"
                  :row="isMobile"
                />
                <LabelValue 
                  :label="textContent.nonce.label" 
                  :description="textContent.nonce.description" 
                  :value="block.nonce" 
                  tooltipPos="right"
                  :row="isMobile"
                />
              </div>
            </DivideItem>

            <!-- Section 3: Gas -->
            <DivideItem>
              <div class="flex flex-col gap-4">
                <LabelValue 
                  :label="textContent.gasUsed.label" 
                  :description="textContent.gasUsed.description" 
                  tooltipPos="right"
                  :row="isMobile"
                >
                  <template #value>
                    <GasUsage
                      :gas="totalGasUsed"
                      :gas-limit="150000"
                    />
                  </template>
                </LabelValue>
                <LabelValue 
                  :label="textContent.gasLimit.label" 
                  :description="textContent.gasLimit.description" 
                  value="150,000" 
                  tooltipPos="right"
                  :row="isMobile"
                />
                <LabelValue 
                  :label="textContent.gasPrice.label" 
                  :description="textContent.gasPrice.description" 
                  :value="formattedGasPrice" 
                  tooltipPos="right" 
                  :row="isMobile"
                />
                <LabelValue 
                  :label="textContent.kadenaPrice.label" 
                  :description="textContent.kadenaPrice.description" 
                  :value="formattedKadenaPrice" 
                  tooltipPos="right" 
                  :row="isMobile"
                />
              </div>
            </DivideItem>
          </Divide>
        </div>

        <!-- More Details -->
        <div
          v-if="!loading && !error && block"
          class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5"
        >
          <div 
            ref="contentRef"
            class="overflow-hidden transition-all duration-300 ease-out"
            :style="{ height: showMore ? contentHeight + 'px' : '0px' }"
          >
            <div class="mb-4 pb-4 border-b border-[#333]">
              <Divide>
                <!-- Epoch -->
                <DivideItem>
                  <div class="flex flex-col gap-4">
                    <LabelValue
                      :label="textContent.epoch.label"
                      :description="textContent.epoch.description"
                      tooltipPos="right"
                      topAlign="true"
                    >
                      <template #value>
                        <div class="flex items-center gap-2">
                          <span>{{ formatFullDate(block.epoch) }}</span>
                        </div>
                      </template>
                    </LabelValue>
                    <LabelValue 
                      :label="textContent.flags.label" 
                      :description="textContent.flags.description" 
                      tooltipPos="right"
                      :row="isMobile"
                    >
                      <template #value>
                        <div class="flex items-center gap-2">
                          <span>{{ block.flags }}</span>
                        </div>
                      </template>
                    </LabelValue>
                    <LabelValue 
                      :label="textContent.weight.label" 
                      :description="textContent.weight.description" 
                      tooltipPos="right"
                      topAlign="true"
                    >
                      <template #value>
                        <div class="flex items-center gap-2 break-all">
                          <span>{{ block.weight }}</span>
                        </div>
                      </template>
                    </LabelValue>
                    <LabelValue 
                      :label="textContent.target.label" 
                      :description="textContent.target.description" 
                      tooltipPos="right"
                      topAlign="true"
                    >
                      <template #value>
                        <div class="flex items-center gap-2 break-all">
                          <span>{{ block.target }}</span>
                        </div>
                      </template>
                    </LabelValue>
                  </div>
                </DivideItem>

                <!-- Hash -->
                <DivideItem>
                  <div class="flex flex-col gap-4">
                    <LabelValue 
                      :label="textContent.hash.label" 
                      :description="textContent.hash.description" 
                      tooltipPos="right"
                      topAlign="true"
                    >
                      <template #value>
                        <div class="flex items-center gap-2 break-all">
                          <span>{{ block.hash }}</span>
                        </div>
                      </template>
                    </LabelValue>
                    <LabelValue 
                      :label="textContent.parentHash.label" 
                      :description="textContent.parentHash.description" 
                      tooltipPos="right"
                      topAlign="true"
                    >
                      <template #value>
                        <div class="flex items-center md:gap-2 gap-0 break-all">
                          <NuxtLink
                              :to="`/blocks/${block.parent.height}/chain/${block.parent.chainId}`"
                              class="text-[#6ab5db] hover:text-[#9ccee7]"
                            >
                              {{ block.parent.hash }}
                          </NuxtLink>
                          <Copy
                            :value="block.parent.hash"
                            tooltipText="Copy Parent Hash"
                            iconSize="h-5 w-5"
                            buttonClass="w-5 h-5 md:block hidden"
                          />
                        </div>
                      </template>
                    </LabelValue>
                    <LabelValue 
                      :label="textContent.powHash.label" 
                      :description="textContent.powHash.description" 
                      tooltipPos="right"
                      topAlign="true"
                    >
                       <template #value>
                        <div class="flex items-center gap-2 break-all">
                          <span>{{ block.powHash }}</span>
                        </div>
                      </template>
                    </LabelValue>
                    <LabelValue 
                      :label="textContent.payloadHash.label" 
                      :description="textContent.payloadHash.description" 
                      tooltipPos="right"
                      topAlign="true"
                    >
                      <template #value>
                        <div class="flex items-center gap-2 break-all">
                          <span>{{ block.payloadHash }}</span>

                        </div>
                      </template>
                    </LabelValue>
                  </div>
                </DivideItem>

                <!-- Neighbors -->
                <DivideItem>
                  <div
                    v-if="block.neighbors && block.neighbors.length > 0"
                    class="flex flex-col gap-4"
                  >
                    <LabelValue
                      v-for="neighbor in block.neighbors"
                      :key="neighbor.hash"
                      :label="`${textContent.neighbor.label}${neighbor.chainId}`"
                      :description="textContent.neighbor.description"
                      tooltipPos="right"
                      topAlign="true"
                    >
                      <template #value>
                        <div class="flex items-center md:gap-2 gap-0 break-all">
                          <NuxtLink
                            :to="`/blocks/${block.height}/chain/${neighbor.chainId}`"
                            class="text-[15px] text-[#6ab5db] hover:text-[#9ccee7]"
                            >{{ neighbor.hash }}</NuxtLink
                          >
                          <Copy
                            :value="neighbor.hash"
                            tooltipText="Copy Block Hash"
                            iconSize="h-5 w-5"
                            buttonClass="w-5 h-5 md:block hidden"
                          />
                        </div>
                      </template>
                    </LabelValue>
                  </div>
                  <div v-else class="text-gray-500">No neighbors found for this block.</div>
                </DivideItem>
              </Divide>
            </div>
          </div>
          
          <Divide>
            <DivideItem>
              <LabelValue
                :label="isMobile ? '' : textContent.moreDetails.label"
                tooltipPos="right"
              >
                <template #value>
                  <button 
                    @click="toggleMoreDetails"
                    class="flex items-center gap-1 transition-colors hover:text-[#9ccee7] text-[#6AB5DB] "
                  >
                    <svg 
                      class="w-3 h-3 transition-transform duration-300" 
                      :class="showMore ? 'rotate-45' : ''"
                      fill="none" 
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    {{ showMore ? 'Click to show less' : 'Click to show more' }}
                  </button>
                </template>
              </LabelValue>
            </DivideItem>
          </Divide>
        </div>
      </div>
    </div>
  </div>
</template> 