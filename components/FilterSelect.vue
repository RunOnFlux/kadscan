<script setup lang="ts">
import IconFilter from '~/components/icon/Filter.vue'
import IconChevron from '~/components/icon/Chevron.vue'

const props = defineProps<{
  modelValue: any;
  items: any[];
  urlParamName?: string; // New prop for URL parameter name (e.g., "chain")
}>()

const emit = defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()

// Track if showing dropdown and current chain number
const showDropdown = ref(false)
const currentChain = ref<number | null>(null)

// Debounce configuration for propagating filter changes
const DEBOUNCE_MS = 1500
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const cancelDebounce = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

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

// Initialize from URL parameter if urlParamName is provided
const initializeFromUrl = () => {
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

// Initialize current chain from URL or modelValue
const initializeChain = () => {
  // First try to get from URL if urlParamName is provided
  const urlChain = initializeFromUrl();
  if (urlChain !== null) {
    currentChain.value = urlChain;
    // Emit the URL value to sync with parent component
    emit('update:modelValue', { label: urlChain.toString(), value: urlChain.toString() });
    return;
  }
  
  // Fallback to modelValue initialization
  if (props.modelValue?.value === null) {
    currentChain.value = null;
  } else if (props.modelValue?.value) {
    currentChain.value = parseInt(props.modelValue.value);
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
  const urlChain = initializeFromUrl();
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

// Handle "All" button click
const selectAll = () => {
  currentChain.value = null
  scheduleUpdate(null)
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
  scheduleUpdate(currentChain.value)
}

const incrementChain = () => {
  if (currentChain.value === null) {
    currentChain.value = 0
  } else if (currentChain.value < 19) {
    currentChain.value++
  } else {
    return // Don't go above 19
  }
  scheduleUpdate(currentChain.value)
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
      class="flex items-center justify-center px-2 py-[5px] text-[12px] font-normal text-[#fafafa] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525] whitespace-nowrap ring-0 outline-none"
    >
      <IconFilter class="w-4 h-4 text-[#bbbbbb]" />
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
          border border-[#222222]
          rounded-lg
          absolute
          bg-[#111111]
          shadow-[0_0_15px_rgba(255,255,255,0.0625)]
          left-0 top-[calc(100%+8px)]
          origin-top-left
          w-56
        "
      >
        <div class="flex gap-2">
                     <!-- All Chains Button (left side) -->
           <button
             @click="selectAll"
             class="px-2 py-1 text-[12px] font-normal text-[#6ab5db] bg-[#151515] border border-[#222222] rounded-md hover:text-[#fafafa] hover:bg-[#0784c3] whitespace-nowrap transition-colors duration-300"
           >
             All Chains
           </button>

          <!-- Chain Controls (right side) -->
          <div class="flex items-center gap-1">
                        <!-- Decrement Button -->
            <button
              @click="decrementChain"
              class="flex items-center justify-center w-8 h-8 border border-[#222222] bg-[#151515] rounded-md text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
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
              class="w-12 h-8 text-center text-sm bg-[#151515] border border-[#222222] rounded-md text-[#fafafa] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />

            <!-- Increment Button -->
            <button
              @click="incrementChain"
              class="flex items-center justify-center w-8 h-8 border border-[#222222] bg-[#151515] rounded-md text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
              :disabled="currentChain !== null && currentChain >= 19"
            >
              <IconChevron class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template> 