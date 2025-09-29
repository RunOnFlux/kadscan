<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    error: any,
    open: boolean,
    loading: boolean,
    items: any,
    cleanup: any,
    close: any,
    selectedFilter?: string,
    history?: Array<{ query: string, type?: string | null, timestamp: number }>,
    query?: string,
    onSelectHistory?: (q: string) => void,
    onRecordHistory?: (q: string, type?: string | null) => void,
  }>(),
  {
    error: null,
    open: false,
    loading: false,
    selectedFilter: 'all',
  }
)
const isEmpty = computed(() => {
  if (props.items === null) {
    return true
  }
  const entries = Object.entries(props.items || {}).filter(([k]) => !k.startsWith('__'))
  return entries.every(([, item]: any) => item?.length === 0)
});

const hasBlocks = computed(() => {
  return props.items?.blocks?.length > 0
});

const hasTransactions = computed(() => {
  return props.items?.transactions?.length > 0
});

const hasAddresses = computed(() => {
  return props.items?.addresses?.length > 0
});

const hasTokens = computed(() => {
  return props.items?.tokens?.length > 0
});

const hasCode = computed(() => {
  return props.items?.code?.length > 0
});

const hasModule = computed(() => {
  return props.items?.modules?.length > 0
});

// Helper to check if a given filter type currently has results
const isFilterAvailable = (type: string) => {
  if (type === 'address') return hasAddresses.value
  if (type === 'code') return hasCode.value
  if (type === 'transactions') return hasTransactions.value
  if (type === 'tokens') return hasTokens.value
  if (type === 'blocks') return hasBlocks.value
  if (type === 'modules') return hasModule.value
  return false
}

// Return the first available result type for default selection
const getFirstAvailableFilter = (): string => {
  return (
    (hasAddresses.value && 'address') ||
    (hasCode.value && 'code') ||
    (hasTransactions.value && 'transactions') ||
    (hasTokens.value && 'tokens') ||
    (hasBlocks.value && 'blocks') ||
    (hasModule.value && 'modules') ||
    (hasModule.value && 'module') ||
    ''
  ) as string
}

// Active tag; defaults to first available on open
const activeFilter = ref<string>('')

// When modal opens, default to the first available tag
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    activeFilter.value = getFirstAvailableFilter()
  }
})

// If results load later and nothing is selected yet, default once
watch(() => props.items, () => {
  if (!activeFilter.value) {
    activeFilter.value = getFirstAvailableFilter()
  }
}, { deep: true })

const modalRef = ref<any>(null);

const scrollToView = (viewId: string) => {
  const type = viewId.split('-')[1]
  activeFilter.value = type
  nextTick(() => {
    const element = document.getElementById(viewId);

    if (element && modalRef.value) {
      const modalContent = modalRef.value;
      const elementPosition = element.offsetTop;
      modalContent.scrollTo({
        top: elementPosition - modalContent.offsetTop - 20,
        behavior: 'smooth'
      });
    }
  });
};


// History
const showHistory = computed(() => {
  const q = (props.query ?? '').trim();
  return !q && (props.history?.length ?? 0) > 0 && !props.loading;
});
</script>

<template>
  <div
    v-if="open"
    ref="modalRef"
    class="absolute top-full left-0 right-[52px] bg-surface-primary border border-line-default rounded-b-md max-h-[344px] overflow-auto z-[99] w-full"
  >
    <div class="sticky top-0 z-10 px-4 pt-3 border-b border-b-line-default bg-surface-primary">
      <!-- History header -->
      <div v-if="showHistory">
        <span class="text-font-primary text-sm">Recent searches</span>
      </div>
      <div
        v-if="loading || (items && items.__bgLoading)"
        class="pb-4"
      >
        <div class="flex flex-col gap-1">
          <span class="text-sm text-font-primary">Loading...</span>
        </div>
      </div>

      <div
        class="pb-4"
        v-else-if="isEmpty && !showHistory && !(items && items.__bgLoading)"
      >
        <span
          class="text-font-primary text-sm"
        >
          No results found.
        </span>
      </div>

      <div
        v-else
        class="flex gap-2 pb-3 overflow-auto"
      >
        <SearchViewFilter
          label="Addresses"
          v-if="hasAddresses"
          @click.prevent="scrollToView('search-address-view')"
          :isActive="activeFilter === 'address'"
        />

        <SearchViewFilter
          label="Code"
          v-if="hasCode"
          @click.prevent="scrollToView('search-code-view')"
          :isActive="activeFilter === 'code'"
        />

        <SearchViewFilter
          label="Transactions"
          v-if="hasTransactions"
          @click.prevent="scrollToView('search-transactions-view')"
          :isActive="activeFilter === 'transactions'"
        />

        <SearchViewFilter
          label="Tokens"
          v-if="hasTokens"
          @click.prevent="scrollToView('search-tokens-view')"
          :isActive="activeFilter === 'tokens'"
        />

        <SearchViewFilter
          label="Blocks"
          v-if="hasBlocks"
          @click.prevent="scrollToView('search-blocks-view')"
          :isActive="activeFilter === 'blocks'"
        />

        <SearchViewFilter
          label="Module"
          v-if="hasModule"
          @click.prevent="scrollToView('search-module-view')"
          :isActive="activeFilter === 'module'"
        />
      </div>
    </div>

    <!-- History list -->
    <div v-if="showHistory" class="flex flex-col px-2 pb-2 overflow-auto scrollbar-custom max-w-full overflow-hidden">
      <div class="flex flex-col">
        <button
          v-for="(h, idx) in (history || [])"
          :key="h.query + ':' + idx"
          class="text-left w-full px-3 py-2 hover:bg-surface-disabled rounded-md transition-colors"
          @click.prevent="onSelectHistory && onSelectHistory(h.query)"
        >
          <div class="flex items-center gap-2">
            <IconSearch class="w-4 h-4 text-font-secondary shrink-0" />
            <span class="text-sm text-font-primary flex-1 min-w-0 truncate">{{ h.query }}</span>
            <span class="text-xs text-font-tertiary ml-4 shrink-0 w-24 text-right truncate">{{ h.type || '' }}</span>
          </div>
        </button>
      </div>
    </div>

    <div
      @click="props.close"
      v-if="!loading && !isEmpty && !showHistory"
      class="flex flex-col px-2 pb-2 overflow-auto scrollbar-custom min-h-full max-w-full overflow-hidden"
    >
      <SearchViewVisible
        v-if="hasAddresses"
      >
        <SearchViewAddress id="search-address-view" :addresses="items?.addresses" :onRecordHistory="onRecordHistory" />
      </SearchViewVisible>

      <SearchViewVisible
        v-if="hasCode"
      >
        <SearchViewCode id="search-code-view" :items="items?.code" :query="query" :onRecordHistory="onRecordHistory" />
      </SearchViewVisible>

      <SearchViewVisible
        v-if="hasTransactions"
      >
        <SearchViewTransaction id="search-transactions-view" :transactions="items?.transactions" :onRecordHistory="onRecordHistory" />
      </SearchViewVisible>

      <SearchViewVisible
        v-if="hasTokens"
      >
        <SearchViewTokens id="search-tokens-view" :tokens="items?.tokens" :onRecordHistory="onRecordHistory" />
      </SearchViewVisible>

      <SearchViewVisible
        v-if="hasBlocks"
      >
        <SearchViewBlock id="search-blocks-view" :blocks="items?.blocks" :onRecordHistory="onRecordHistory" />
      </SearchViewVisible>

      <SearchViewVisible
        v-if="hasModule"
      >
        <SearchViewModule id="search-module-view" :items="items?.modules" :onRecordHistory="onRecordHistory" />
      </SearchViewVisible>
    </div>
  </div>
</template>
