<script lang="ts" setup>
import { ref, computed, watch, onUnmounted, onMounted } from 'vue';
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

definePageMeta({
  layout: 'app',
});

const textContent = {
  blockHeight: { label: 'Block Height:', description: 'The unique number identifying the block in the blockchain, also known as its position in the chain.' },
  chainId: { label: 'Chain ID:', description: 'The specific chain (0-19) on which this block was mined.' },
  status: { label: 'Status:', description: 'The current confirmation status of the block. Canonical means it is part of the main chain.' },
  creationTime: { label: 'Creation Time:', description: 'The timestamp when the block was created by the miner.' },
  transactions: { label: 'Transactions:', description: 'The list of transactions included in this block.' },
  events: { label: 'Events:', description: 'The total number of events emitted by the transactions in this block.' },
  minerAccount: { label: 'Miner Account:', description: 'The address of the account that mined this block.' },
  blockReward: { label: 'Block Reward:', description: 'The amount of KDA awarded for mining this block.' },
  difficulty: { label: 'Difficulty:', description: 'A measure of how difficult it was to find a hash below the target for this block.' },
  gasUsed: { label: 'Gas Used:', description: 'The total amount of gas consumed by all transactions in this block.' },
  gasLimit: { label: 'Gas Limit:', description: 'The maximum amount of gas that can be used in a block.' },
  nonce: { label: 'Nonce:', description: 'A random value used by miners to create a valid proof-of-work hash.' },
  epoch: { label: 'Epoch:', description: 'The start date and time of the current epoch.' },
  flags: { label: 'Flags:', description: 'Hex-encoded bits used for validation.' },
  target: { label: 'Target:', description: 'The boundary below which the block hash must be for the block to be valid.' },
  weight: { label: 'Weight:', description: 'A measure of the total difficulty of the chain up to this block.' },
  hash: { label: 'Hash:', description: 'The unique identifier for this block (also known as Block Header Hash).' },
  parentHash: { label: 'Parent Hash:', description: 'The hash of the preceding block in this chain.' },
  powHash: { label: 'POW Hash:', description: 'The result of the proof-of-work computation.' },
  payloadHash: { label: 'Payload Hash:', description: 'The hash of all transactions and their outputs in this block.' },
  moreDetails: { label: 'More Details', description: 'Show or hide additional block details.' },
  neighbor: { label: 'Neighbor at Chain #', description: 'A block at the same height on a different chain.' },
};


const { formatFullDate, truncateAddress } = useFormat();
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

const {
  block: initialBlock,
  loading,
  error,
  fetchBlock,
  competingBlocks,
  canonicalIndex,
  totalGasUsed,
  gasLoading,
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
    };
  }

  if(block.value.canonical) {
    return {
      text: 'Canonical',
      icon: IconCheckmarkFill,
      classes: 'bg-[#0f1f1d] border-[#00a186] text-[#00a186]',
    };
  }

  return {
    text: 'Unconfirmed',
    icon: IconHourglass,
    classes: 'bg-[#17150d] border-[#eab308] text-[#eab308]',
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
  }, 2000);
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
    const isOldEnough = newLastBlockHeight - height.value >= 6;

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

    <div
      v-else-if="error || !block"
      class="bg-[#111111] border items-center justify-center border-[#222222] rounded-xl p-8 text-white"
    >
      Block not found. It may not exist or has not been indexed yet. I own you a cool screen displaying the estimated time to index this block.
    </div>

    <div v-else>
      <div class="flex items-center gap-2 mb-2">
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
                      <span class="text-[#f5f5f5]">{{ block.height }}</span>
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
                      <span>{{ String(block.chainId) }}</span>
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
                  </template>
                </LabelValue>
                <LabelValue :label="textContent.creationTime.label" :description="textContent.creationTime.description" tooltipPos="right">
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
                >
                  <template #value>
                    <Tooltip value="Click to view Transactions">
                      <NuxtLink
                        :to="`/transactions?block=${block.height}&chainId=${block.chainId}`"
                        class="text-[#6ab5db] hover:text-[#9ccee7]"
                      >
                        {{ block.transactions.totalCount }} transactions
                      </NuxtLink>
                    </Tooltip>
                  </template>
                </LabelValue>
                <LabelValue
                  :label="textContent.events.label"
                  :description="textContent.events.description"
                  :value="`${block.events.totalCount} events`"
                  tooltipPos="right"
                />
              </div>
            </DivideItem>

            <!-- Section 2: Miner and Difficulty -->
            <DivideItem>
              <div class="flex flex-col gap-4">
                <LabelValue :label="textContent.minerAccount.label" :description="textContent.minerAccount.description" tooltipPos="right">
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
                <LabelValue :label="textContent.blockReward.label" :description="textContent.blockReward.description" tooltipPos="right">
                  <template #value v-if="blockReward != null">
                    {{ blockReward }} KDA
                  </template>
                </LabelValue>
                <LabelValue :label="textContent.difficulty.label" :description="textContent.difficulty.description" :value="block.difficulty" tooltipPos="right" />
              </div>
            </DivideItem>

            <!-- Section 3: Gas -->
            <DivideItem>
              <div class="flex flex-col gap-4">
                <LabelValue :label="textContent.gasUsed.label" :description="textContent.gasUsed.description" tooltipPos="right">
                  <template #value>
                    <GasUsage
                      :gas="totalGasUsed"
                      :gas-limit="150000"
                    />
                  </template>
                </LabelValue>
                <LabelValue :label="textContent.gasLimit.label" :description="textContent.gasLimit.description" value="150,000" tooltipPos="right" />
                <LabelValue :label="textContent.nonce.label" :description="textContent.nonce.description" :value="block.nonce" tooltipPos="right" />
              </div>
            </DivideItem>
          </Divide>
        </div>

        <!-- More Details -->
        <div
          v-if="!loading && !error && block"
          class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5"
        >
          <Divide>
            <!-- Epoch -->
            <DivideItem v-if="showMore">
              <div class="flex flex-col gap-4">
                <LabelValue
                  :label="textContent.epoch.label"
                  :description="textContent.epoch.description"
                  tooltipPos="right"
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span>{{ formatFullDate(block.epoch) }}</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue :label="textContent.flags.label" :description="textContent.flags.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span>{{ block.flags }}</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue :label="textContent.target.label" :description="textContent.target.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span>{{ block.target }}</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue :label="textContent.weight.label" :description="textContent.weight.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span>{{ block.weight }}</span>
                    </div>
                  </template>
                </LabelValue>
              </div>
            </DivideItem>

            <!-- Hash -->
            <DivideItem v-if="showMore">
              <div class="flex flex-col gap-4">
                <LabelValue :label="textContent.hash.label" :description="textContent.hash.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span>{{ block.hash }}</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue :label="textContent.parentHash.label" :description="textContent.parentHash.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
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
                        buttonClass="w-5 h-5"
                      />
                    </div>
                  </template>
                </LabelValue>
                <LabelValue :label="textContent.powHash.label" :description="textContent.powHash.description" tooltipPos="right">
                   <template #value>
                    <div class="flex items-center gap-2">
                      <span>{{ block.powHash }}</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue :label="textContent.payloadHash.label" :description="textContent.payloadHash.description" tooltipPos="right">
                  <template #value>
                    <div class="flex items-center gap-2">
                      <span>{{ block.payloadHash }}</span>

                    </div>
                  </template>
                </LabelValue>
              </div>
            </DivideItem>

            <!-- Neighbors -->
            <DivideItem v-if="showMore">
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
                >
                  <template #value>
                    <div class="flex items-center gap-2">
                      <NuxtLink
                        :to="`/blocks/${block.height}/chain/${neighbor.chainId}`"
                        class="text-[15px] text-[#6ab5db] hover:text-[#9ccee7]"
                        >{{ neighbor.hash }}</NuxtLink
                      >
                      <Copy
                        :value="neighbor.hash"
                        tooltipText="Copy Block Hash"
                        iconSize="h-5 w-5"
                        buttonClass="w-5 h-5"
                      />
                    </div>
                  </template>
                </LabelValue>
              </div>
              <div v-else class="text-gray-500">No neighbors found for this block.</div>
            </DivideItem>

            <!-- More Details -->
            <DivideItem>
              <LabelValue
                :label="isMobile ? '' : textContent.moreDetails.label"
                :description="textContent.moreDetails.description"
                tooltipPos="right"
              >
                <template #value>
                  <button
                    @click="showMore = !showMore"
                    class="text-[#6ab5db] hover:text-[#9ccee7] flex items-center gap-1 whitespace-nowrap"
                  >
                    <template v-if="!showMore">
                      <span v-if="!isMobile">+</span>
                      <span>Click to show more</span>
                    </template>
                    <template v-else>
                      <span v-if="!isMobile">-</span>
                      <span>Click to show less</span>
                    </template>
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