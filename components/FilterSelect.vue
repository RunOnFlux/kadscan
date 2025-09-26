<script setup lang="ts">
import IconFilter from '~/components/icon/Filter.vue'
import IconChevron from '~/components/icon/Chevron.vue'

const props = defineProps<{
  modelValue: any;
  items: any[];
  urlParamName?: string; // URL parameter name for chain (e.g., "chain")
  enableBlockFilter?: boolean; // When true, render block filter row below chain
  blockUrlParamName?: string; // URL parameter name for block (defaults to "block")
}>()

const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()

// Track if showing dropdown and current chain number
const showDropdown = ref(false)
const currentChain = ref<number | null>(null)
const currentBlock = ref<number | null>(null)

// Debounce removed for explicit user submission
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const cancelDebounce = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

const cancelBlockDebounce = () => {}

const scheduleUpdate = (chainValue: number | null) => {
  cancelDebounce()
  debounceTimer = setTimeout(() => {
    const modelValue = chainValue !== null
      ? { label: chainValue.toString(), value: chainValue.toString() }
      : { label: 'All', value: null }
    emit('update:modelValue', modelValue)
    updateUrl(chainValue)
    debounceTimer = null
  }, DEBOUNCE_MS)
}

// Initialize chain from URL parameter if urlParamName is provided
const initializeChainFromUrl = () => {
  if (!props.urlParamName) return null;
  
  const urlValue = route.query[props.urlParamName];
  if (!urlValue) return null;
  
  // Handle "all" case or invalid values
  if (urlValue === 'all' || urlValue === '') return null;
  
  const chainValue = parseInt(urlValue as string);
  if (isNaN(chainValue) || chainValue < 0 || chainValue > 19) {
    return null;
  }
  
  return chainValue;
}

// Initialize block from URL parameter if enabled
const initializeBlockFromUrl = () => {
  const blockParamName = props.blockUrlParamName || 'block';
  const urlValue = route.query[blockParamName];
  if (!urlValue) return null;
  const blockValue = parseInt(urlValue as string);
  if (isNaN(blockValue) || blockValue < 0) return null;
  return blockValue;
}

// Initialize current chain/block from URL or modelValue
const initializeChain = () => {
  // First try to get from URL if urlParamName is provided
  const urlChain = initializeChainFromUrl();
  if (urlChain !== null) {
    currentChain.value = urlChain;
    // Emit the URL value to sync with parent component
    emit('update:modelValue', { label: urlChain.toString(), value: urlChain.toString() });
  } else {
    // Fallback to modelValue initialization
    if (props.modelValue?.value === null) {
      currentChain.value = null;
    } else if (props.modelValue?.value) {
      currentChain.value = parseInt(props.modelValue.value);
    }
  }

  if (props.enableBlockFilter) {
    const urlBlock = initializeBlockFromUrl();
    if (urlBlock !== null) {
      currentBlock.value = urlBlock;
    }
  }
}

// Initialize on component mount
onMounted(() => {
  initializeChain();
})

// Watch for modelValue changes (from parent)
watch(() => props.modelValue, (newValue) => {
  // External change should cancel any pending internal update
  cancelDebounce()
  if (newValue?.value === null) {
    currentChain.value = null;
  } else if (newValue?.value) {
    currentChain.value = parseInt(newValue.value);
  }
}, { immediate: true })

// Watch for URL parameter changes (browser back/forward)
watch(() => route.query[props.urlParamName || ''], (newValue) => {
  if (!props.urlParamName) return;
  
  // Cancel pending updates if URL changed externally
  cancelDebounce()
  const urlChain = initializeChainFromUrl();
  if (urlChain !== currentChain.value) {
    currentChain.value = urlChain;
    const modelValue = urlChain !== null 
      ? { label: urlChain.toString(), value: urlChain.toString() }
      : { label: 'All', value: null };
    emit('update:modelValue', modelValue);
  }
})

// Update URL when chain changes
const updateUrl = (chainValue: number | null) => {
  if (!props.urlParamName) return;
  
  const query = { ...route.query };
  if (chainValue !== null) {
    query[props.urlParamName] = chainValue.toString();
  } else {
    delete query[props.urlParamName];
  }
  
  router.push({ query });
}

// Block URL helpers
const updateBlockUrl = (blockValue: number | null) => {
  const blockParamName = props.blockUrlParamName || 'block';
  const query = { ...route.query } as Record<string, any>;
  if (blockValue !== null) {
    query[blockParamName] = blockValue.toString();
  } else {
    delete query[blockParamName];
  }
  router.push({ query });
}

const scheduleBlockUpdate = (_blockValue: number | null) => {}

watch(() => route.query[props.blockUrlParamName || 'block'], () => {
  if (!props.enableBlockFilter) return;
  const urlBlock = initializeBlockFromUrl();
  if (urlBlock !== currentBlock.value) {
    currentBlock.value = urlBlock;
  }
});

// No auto submit on typing

// Handle "All" button click (immediate)
const selectAll = () => {
  currentChain.value = null
  const modelValue = { label: 'All', value: null }
  emit('update:modelValue', modelValue)
  updateUrl(null)
}

// Handle direct input change
const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)
  
  if (isNaN(value) || value < 0 || value > 19) {
    target.value = currentChain.value?.toString() || ''
    return
  }
  
  currentChain.value = value
  scheduleUpdate(value)
}

// Handle chevron controls
const decrementChain = () => {
  if (currentChain.value === null) {
    currentChain.value = 0
  } else if (currentChain.value > 0) {
    currentChain.value--
  } else {
    return // Don't go below 0
  }
  const modelValue = { label: currentChain.value.toString(), value: currentChain.value.toString() }
  emit('update:modelValue', modelValue)
  updateUrl(currentChain.value)
}

const incrementChain = () => {
  if (currentChain.value === null) {
    currentChain.value = 0
  } else if (currentChain.value < 19) {
    currentChain.value++
  } else {
    return // Don't go above 19
  }
  const modelValue = { label: currentChain.value.toString(), value: currentChain.value.toString() }
  emit('update:modelValue', modelValue)
  updateUrl(currentChain.value)
}

// Toggle dropdown
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// Close dropdown when clicking outside
const closeDropdown = () => {
  showDropdown.value = false
}

onBeforeUnmount(() => {
  cancelDebounce()
})
</script>

<template>
  <div class="relative" v-outside="closeDropdown">
    <!-- Filter Button -->
    <button
      @click="toggleDropdown"
      class="flex items-center justify-center px-2 py-[5px] text-[12px] font-normal text-font-primary bg-surface-disabled border border-line-default rounded-md hover:bg-surface-hover whitespace-nowrap ring-0 outline-none"
    >
      <IconFilter class="w-4 h-4 text-font-secondary" />
    </button>

    <!-- Dropdown with 1x2 layout -->
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="showDropdown"
        class="
          z-[99999]
          p-3
          border border-line-default
          rounded-lg
          absolute
          bg-surface-primary
          shadow-[0_0_15px_rgba(255,255,255,0.0625)]
          left-0 top-[calc(100%+8px)]
          origin-top-left
          w-56
        "
      >
        <div class="flex flex-col gap-3">
          <!-- Chain row -->
          <div class="flex gap-2">
                     <!-- All Chains Button (left side) -->
           <button
             @click="selectAll"
             class="px-2 py-1 text-[12px] font-normal text-link bg-surface-disabled border border-line-default rounded-md hover:text-font-primary hover:bg-[#0784c3] whitespace-nowrap transition-colors duration-300"
           >
             All Chains
           </button>

          <!-- Chain Controls (right side) -->
          <div class="flex items-center gap-1">
                        <!-- Decrement Button -->
            <button
              @click="decrementChain"
              class="flex items-center justify-center w-8 h-8 border border-line-default bg-surface-disabled rounded-md text-link hover:text-font-primary hover:bg-[#0784c3] disabled:hover:bg-surface-disabled disabled:bg-surface-disabled disabled:text-font-tertiary transition-colors duration-300"
              :disabled="currentChain === null || currentChain <= 0"
            >
              <IconChevron class="h-4 w-4 transform rotate-180" />
            </button>

            <!-- Number Input -->
            <input
              type="number"
              min="0"
              max="19"
              :value="currentChain"
              @input="handleInputChange"
              @focus="$event.target.select()"
              class="w-12 h-8 text-center text-sm bg-surface-disabled border border-line-default rounded-md text-font-primary focus:outline-none transition-colors duration-300 hover:border-[#0784c3] focus:border-[#0784c3] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />

            <!-- Increment Button -->
            <button
              @click="incrementChain"
              class="flex items-center justify-center w-8 h-8 border border-line-default bg-surface-disabled rounded-md text-link hover:text-font-primary hover:bg-[#0784c3] disabled:hover:bg-surface-disabled disabled:bg-surface-disabled disabled:text-font-tertiary transition-colors duration-300"
              :disabled="currentChain !== null && currentChain >= 19"
            >
              <IconChevron class="h-4 w-4" />
            </button>
          </div>
          </div>

          <!-- Block filter row (optional) -->
          <div v-if="enableBlockFilter" class="flex gap-2 items-center">
            <button
              @click="() => { currentBlock = null; updateBlockUrl(null); }"
              class="px-2 py-1 text-[12px] font-normal text-link bg-surface-disabled border border-line-default rounded-md hover:text-font-primary hover:bg-[#0784c3] whitespace-nowrap transition-colors duration-300"
            >
              All Blocks
            </button>
            <div class="grid grid-cols-[1fr_auto] items-center gap-1 w-full">
              <input
                v-model.number="currentBlock"
                type="number"
                min="0"
                @keyup.enter="() => { updateBlockUrl(currentBlock ?? null); }"
                @focus="$event.target.select()"
                class="w-full h-8 px-2 text-sm bg-surface-disabled border border-line-default rounded-md text-font-primary focus:outline-none transition-colors duration-300 hover:border-[#0784c3] focus:border-[#0784c3] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Height"
              />
              <button
                @click="() => { updateBlockUrl(currentBlock ?? null); }"
                class="flex items-center justify-center w-8 h-8 border border-line-default bg-surface-disabled rounded-md text-link hover:text-font-primary hover:bg-[#0784c3] disabled:hover:bg-surface-disabled disabled:bg-surface-disabled disabled:text-font-tertiary transition-colors duration-300"
              >
                <IconChevron class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template> 