<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useFormat } from '~/composables/useFormat';
import { useBlock } from '~/composables/useBlock';
import { useBlocks } from '~/composables/useBlocks';
import { useSharedData } from '~/composables/useSharedData';
import IconCheckmarkFill from '~/components/icon/CheckmarkFill.vue';
import IconHourglass from '~/components/icon/Hourglass.vue';
import IconCancel from '~/components/icon/Cancel.vue';

definePageMeta({
  layout: 'app',
});

const { formatFullDate, truncateAddress } = useFormat();
const route = useRoute();
const router = useRouter();
const { selectedNetwork } = useSharedData();
const { totalCount: lastBlockHeight, fetchTotalCount } = useBlocks();

const showMore = ref(false);
const height = computed(() => Number(route.params.height));
const chainId = computed(() => Number(route.params.chainId));
const networkId = computed(() => selectedNetwork.value?.id);

// Using -2 because last block is streamed before actual block data
const isLastBlock = computed(() => lastBlockHeight.value === height.value + 2); 

const { block, loading, error, fetchBlock } = useBlock(
  height,
  chainId,
  networkId
);

onMounted(() => {
  if (networkId.value) {
    fetchTotalCount({ networkId: networkId.value });
  }
});

watch(networkId, (newNetworkId) => {
  if (newNetworkId) {
    fetchTotalCount({ networkId: newNetworkId });
  }
});

const blockStatus = computed(() => {
  if (!block.value || !lastBlockHeight.value) {
    return null;
  }

  if(lastBlockHeight.value - 8 >= block.value.height && !block.value.canonical) {
    return {
      text: 'Failed',
      icon: IconCancel,
      classes: 'bg-red-900/40 border-red-400 text-red-400',
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

watch(
  [height, chainId, networkId],
  () => {
    fetchBlock();
  },
  {
    immediate: true,
  }
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

    <div v-if="loading" class="text-white">Loading block data...</div>

    <div
      v-else-if="error || !block"
      class="bg-[#111111] border border-[#222222] rounded-xl p-8 text-white"
    >
      Block not found. It may not exist or has not been indexed yet.
    </div>

    <div
      v-else
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
                    <Tooltip 
                      value="View previous Chain" 
                      :offset-distance="8"
                      :disabled="chainId === 0"
                    >
                      <button
                        @click="goToBlock(height, chainId - 1)"
                        :disabled="chainId === 0"
                        class="relative whitespace-nowrap inline-flex items-center p-1 rounded-md border border-[#222222] bg-[#111111] text-xs font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
                      >
                        <IconChevron class="h-3 w-3 transform rotate-180" />
                      </button>
                    </Tooltip>
                    <Tooltip 
                      value="View next Chain" 
                      :offset-distance="8"
                      :disabled="chainId === 19"
                    >
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
            <LabelValue label="Status">
              <template #value>
                <div
                  v-if="blockStatus"
                  class="px-2 py-1 text-[12px] rounded-md border flex items-center gap-1"
                  :class="blockStatus.classes"
                >
                  <component :is="blockStatus.icon" class="w-3 h-3" />
                  <span>
                    {{ blockStatus.text }}
                  </span>
                </div>
              </template>
            </LabelValue>
            <LabelValue label="Creation Time">
              <template #value>
                <div class="flex items-center gap-1 text-[#f5f5f5]">
                  <IconClock class="w-4 h-4" />
                  <span>{{ formatFullDate(block.creationTime) }}</span>
                </div>
              </template>
            </LabelValue>
            <LabelValue label="Transactions">
              <template #value>
                <NuxtLink
                  :to="`/blocks/${height}/transactions`"
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
                      >{{ truncateAddress(minerAccount, 10, 10) }}</NuxtLink
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
      </Divide>
    </div>

    <div
      v-if="!loading && !error && block"
      class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5"
    >
      <Divide>
        <DivideItem v-if="showMore">
          <div class="flex flex-col gap-4">
            <LabelValue label="Epoch" :value="formatFullDate(block.epoch)" />
            <LabelValue label="Flags" :value="block.flags" />
            <LabelValue label="Nonce" :value="block.nonce"/>
            <LabelValue label="Target" :value="block.target" /> 
            <LabelValue label="Weight" :value="block.weight"/>
          </div>
        </DivideItem>
        <DivideItem v-if="showMore">
          <div class="flex flex-col gap-4">
            <LabelValue label="Hash" :value="block.hash" />
            <LabelValue
              tooltipText="Copy Parent Hash"
              label="Parent Hash"
              :value="block.parent.hash"
            />
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
          <LabelValue label="More Details">
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
                  <span>--</span>
                  <span>Click to show less</span>
                </template>
              </button>
            </template>
          </LabelValue>         
        </DivideItem>
      </Divide>
    </div>
  </div>
</template> 