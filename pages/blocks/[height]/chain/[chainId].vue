<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useFormat } from '~/composables/useFormat';
import { useBlock } from '~/composables/useBlock';
import { useBlocks } from '~/composables/useBlocks';
import { useSharedData } from '~/composables/useSharedData';
import IconCheckmarkFill from '~/components/icon/CheckmarkFill.vue';
import IconHourglass from '~/components/icon/Hourglass.vue';
import IconCancel from '~/components/icon/Cancel.vue';
import GasUsage from '~/components/column/Gas.vue';
import SkeletonBlockDetails from '~/components/skeleton/BlockDetails.vue';

definePageMeta({
  layout: 'app',
});

const activeView = ref('overview');

const { formatFullDate, truncateAddress } = useFormat();
const route = useRoute();
const router = useRouter();
const { selectedNetwork } = useSharedData();
const { totalCount: lastBlockHeight, fetchTotalCount } = useBlocks();

const showMore = ref(false);
const height = computed(() => Number(route.params.height));
const chainId = computed(() => Number(route.params.chainId));
const networkId = computed(() => selectedNetwork.value?.id);

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

watch(
  networkId,
  (newNetworkId) => {
    if (newNetworkId) {
      fetchTotalCount({ networkId: newNetworkId });
    }
  },
  { immediate: true }
);

const selectedBlockIndex = ref(0);

const block = computed(() => {
  if (competingBlocks.value.length > 0) {
    return competingBlocks.value[selectedBlockIndex.value];
  }
  return initialBlock.value;
});

watch(
  canonicalIndex,
  (newIndex) => {
    if (newIndex !== -1) {
      selectedBlockIndex.value = newIndex;
    }
  },
  { immediate: true }
);

const blockStatus = computed(() => {
  if (!block.value || !lastBlockHeight.value) {
    return null;
  }

  if(lastBlockHeight.value - 8 >= block.value.height && !block.value.canonical) {
    return {
      text: 'Failed',
      icon: IconCancel,
      classes: 'bg-[#7f1d1d66] border-[#f87171] text-[#f87171]',
    };
  }

  if(block.value.canonical) {
    return {
      text: 'Finalized',
      icon: IconCheckmarkFill,
      classes: 'bg-[#0f1f1d] border-[#00a186] text-[#00a186]',
    };
  }

  return {
    text: 'Pending',
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

const goToBlock = (newHeight: number, newChainId: number) => {
  if (newHeight < 0) return;
  router.push(`/blocks/${newHeight}/chain/${newChainId}`);
};

const isLastBlock = computed(() => lastBlockHeight.value === height.value);

watch(
  [height, chainId, networkId],
  () => {
    if (networkId.value) {
      fetchBlock();
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

    <SkeletonBlockDetails v-if="loading" />

    <div
      v-else-if="error || !block"
      class="bg-[#111111] border items-center justify-center border-[#222222] rounded-xl p-8 text-white"
    >
      Block not found. It may not exist or has not been indexed yet. TODO: Cooler screen for this :D 
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
        <button
          class="px-[10px] py-[5px] text-[13px] rounded-lg border font-medium transition-colors bg-[#009367] border-[#222222] text-[#f5f5f5]"
          :class="{
            'bg-[#009367] text-[#f5f5f5]': activeView === 'neighbors',
            'bg-transparent text-[#bbbbbb] hover:bg-[#222222]':
              activeView !== 'neighbors',
          }"
          @click="activeView = 'neighbors'"
        >
          Neighbors
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
                <LabelValue label="Block Height">
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
                <LabelValue label="Chain ID">
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
                            :disabled="chainId === 20"
                            class="relative whitespace-nowrap inline-flex items-center p-1 rounded-md border border-[#222222] bg-[#111111] text-xs font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
                          >
                            <IconChevron class="h-3 w-3" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue label="Status">
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
                <LabelValue label="Creation Time">
                  <template #value>
                    <div class="flex items-center gap-1 text-white">
                      <IconClock class="w-4 h-4" />
                      <span>{{ formatFullDate(block.creationTime) }}</span>
                    </div>
                  </template>
                </LabelValue>
                <LabelValue label="Transactions">
                  <template #value>
                    <NuxtLink
                      :to="`/transactions?block=${block.hash}`"
                      class="text-[#6ab5db] hover:text-[#9ccee7]"
                    >
                      {{ block.transactions.totalCount }} transactions
                    </NuxtLink>
                  </template>
                </LabelValue>
                <LabelValue
                  label="Events"
                  :value="`${block.events.totalCount} events`"
                />
              </div>
            </DivideItem>

            <!-- Section 2: Miner and Difficulty -->
            <DivideItem>
              <div class="flex flex-col gap-4">
                <LabelValue label="Miner Account">
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
                <LabelValue label="Block Reward">
                  <template #value v-if="blockReward != null">
                    {{ blockReward }} KDA
                  </template>
                </LabelValue>
                <LabelValue label="Difficulty" :value="block.difficulty" />
              </div>
            </DivideItem>

            <!-- Section 3: Gas -->
            <DivideItem>
              <div class="flex flex-col gap-4">
                <LabelValue label="Gas Used">
                  <template #value>
                    <span v-if="gasLoading">Calculating...</span>
                    <GasUsage
                      v-else
                      :gas="totalGasUsed"
                      :gas-limit="150000"
                    />
                  </template>
                </LabelValue>
                <LabelValue label="Gas Limit" value="150,000" />
                <LabelValue label="Nonce" :value="block.nonce" />
              </div>
            </DivideItem>
          </Divide>
        </div>
        <div
          v-if="!loading && !error && block"
          class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5"
        >
          <Divide>
            <DivideItem v-if="showMore">
              <div class="flex flex-col gap-4">
                <LabelValue
                  label="Epoch"
                  :value="formatFullDate(block.epoch)"
                />
                <LabelValue label="Flags" :value="block.flags" />
                <LabelValue label="Target" :value="block.target" />
                <LabelValue label="Weight" :value="block.weight" />
              </div>
            </DivideItem>
            <DivideItem v-if="showMore">
              <div class="flex flex-col gap-4">
                <LabelValue label="Hash" :value="block.hash" />
                <LabelValue label="Parent Hash">
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
                <LabelValue
                  tooltipText="Copy POW Hash"
                  label="POW Hash"
                  :value="block.powHash"
                />
                <LabelValue
                  tooltipText="Copy Payload Hash"
                  label="Payload Hash"
                  :value="block.payloadHash"
                />
              </div>
            </DivideItem>
            <DivideItem>
              <LabelValue label="More Details:">
                <template #value>
                  <button
                    @click="showMore = !showMore"
                    class="text-[#6ab5db] hover:text-[#9ccee7] flex items-center gap-1 whitespace-nowrap"
                  >
                    <template v-if="!showMore">
                      <span>+</span>
                      <span>Click to show more</span>
                    </template>
                    <template v-else>
                      <span>-</span>
                      <span>Click to show less</span>
                    </template>
                  </button>
                </template>
              </LabelValue>
            </DivideItem>
          </Divide>
        </div>
      </div>

      <div
        v-if="activeView === 'neighbors'"
        class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5"
      >
        <div
          v-if="block.neighbors && block.neighbors.length > 0"
          class="flex flex-col gap-4"
        >
          <div
            v-for="neighbor in block.neighbors"
            :key="neighbor.hash"
            class="flex items-center"
          >
            <span class="text-[#bbbbbb] text-[15px] min-w-[300px]">Chain {{ neighbor.chainId }}</span>
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
          </div>
        </div>
        <div v-else class="text-gray-500">No neighbors found for this block.</div>
      </div>
    </div>
  </div>
</template> 