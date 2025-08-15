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
  return Object.values(props.items).every((item: any) => item?.length === 0)
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

// Computed to detect single result type
const singleResultType = computed(() => {
  if (!props.items) return null
  
  const resultTypes = []
  if (hasBlocks.value) resultTypes.push('blocks')
  if (hasTransactions.value) resultTypes.push('transactions') 
  if (hasAddresses.value) resultTypes.push('address')
  if (hasTokens.value) resultTypes.push('tokens')
  
  return resultTypes.length === 1 ? resultTypes[0] : null
})

// Map filter values to activeFilter values
const getInitialActiveFilter = () => {
  // If "All Filters" is selected but only one result type exists, activate that filter
  if (props.selectedFilter === 'all' && singleResultType.value) {
    return singleResultType.value
  }
  
  if (props.selectedFilter === 'all') return ''
  if (props.selectedFilter === 'address') return 'address'
  return props.selectedFilter // 'blocks', 'transactions', 'tokens' stay the same
}

const activeFilter = ref(getInitialActiveFilter());

// Track whether the user has interacted (clicked a filter or scrolled)
const hasInteracted = ref(false)

// Watch for selectedFilter changes to update activeFilter
watch(() => props.selectedFilter, () => {
  activeFilter.value = getInitialActiveFilter()
})

// Watch for items changes to update activeFilter when results change
watch(() => props.items, () => {
  if (props.selectedFilter === 'all') {
    activeFilter.value = getInitialActiveFilter()
  }
}, { deep: true })

const modalRef = ref<any>(null);

onMounted(() => {
  if (modalRef.value) {
    modalRef.value.addEventListener('scroll', () => {
      hasInteracted.value = true
    })
  }
})

onUnmounted(() => {
  if (modalRef.value) {
    modalRef.value.removeEventListener('scroll', () => {
      hasInteracted.value = true
    })
  }
})

const scrollToView = (viewId: string) => {
  hasInteracted.value = true
  activeFilter.value = viewId;
  nextTick(() => {
    const element = document.getElementById(viewId);

    if (element && modalRef.value) {
      const modalContent = modalRef.value;
      const elementPosition = element.offsetTop;
      modalContent.scrollTo({
        top: elementPosition - modalContent.offsetTop - 20,
        behavior: 'smooth'
      });
      activeFilter.value = viewId.split('-')[1];
    }
  });
};

// Only update the active filter from visibility events once the user has
// interacted, or when a single result type exists
const handleSectionVisible = (type: string) => {
  if (hasInteracted.value || singleResultType.value === type) {
    activeFilter.value = type
  }
}
</script>

<template>
  <div
    v-if="open"
    ref="modalRef"
    class="absolute top-full left-0 right-[52px] bg-[#111111] border border-[#222222] rounded-b-md max-h-[344px] overflow-auto z-[99] w-full"
  >
    <div class="sticky top-0 z-10 px-4 pt-3 border-b border-b-[#222222] bg-[#111111]">
      <div
        v-if="loading"
        class="pb-4"
      >
        <span
          class="text-sm text-white"
        >
          Loading...
        </span>
      </div>

      <div
        class="pb-4"
        v-else-if="isEmpty"
      >
        <span
          class="text-white text-sm"
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
      </div>
    </div>

    <div
      @click="props.close"
      v-if="!loading && !isEmpty"
      class="flex flex-col px-2 pb-2 overflow-auto scrollbar-custom min-h-full max-w-full overflow-hidden"
    >
      <SearchViewVisible
        v-if="hasAddresses"
        @visible="handleSectionVisible('address')"
      >
        <SearchViewAddress id="search-address-view" :addresses="items?.addresses" />
      </SearchViewVisible>

      <SearchViewVisible
        v-if="hasTransactions"
        @visible="handleSectionVisible('transactions')"
      >
        <SearchViewTransaction id="search-transactions-view" :transactions="items?.transactions" />
      </SearchViewVisible>

      <SearchViewVisible
        v-if="hasTokens"
        @visible="handleSectionVisible('tokens')"
      >
        <SearchViewTokens id="search-tokens-view" :tokens="items?.tokens" />
      </SearchViewVisible>

      <SearchViewVisible
        v-if="hasBlocks"
        @visible="handleSectionVisible('blocks')"
      >
        <SearchViewBlock id="search-blocks-view" :blocks="items?.blocks" />
      </SearchViewVisible>
    </div>
  </div>
</template>
