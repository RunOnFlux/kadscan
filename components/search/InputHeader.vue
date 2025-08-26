    <script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const {
  data,
  close,
  search,
  cleanup,
  handleInput,
  handleKeyDown,
  selectHistoryItem,
  loadHistory,
  submit,
  recordHistory,
} = useSearch();

const placeholder = ref('Search by Transaction / Address / Block / Token / Code')
const focused = ref(false)
const searchInput = ref<HTMLInputElement>()

const updatePlaceholder = () => {
  if (window.innerWidth < 640) {
    placeholder.value = 'Search by Transaction / Address / Block / Token / Code'
  } else {
    placeholder.value = 'Search by Transaction / Address / Block / Token / Code'
  }
}

const handleSlashKey = (event: KeyboardEvent) => {
  // Only focus if not already focused on an input/textarea and not inside the search modal
  if (
    event.key === '/' && 
    !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName) &&
    searchInput.value &&
    !data.open
  ) {
    event.preventDefault()
    // Open modal and load history, then focus input
    data.open = true
    loadHistory()
    searchInput.value.focus()
  }
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  let acted = false
  if (data.open) {
    event.preventDefault()
    close()
    acted = true
  }
  if (searchInput.value && document.activeElement === searchInput.value) {
    ;(searchInput.value as HTMLInputElement).blur()
    acted = true
  }
  if (acted) return
}

onMounted(() => {
  updatePlaceholder()
  window.addEventListener('resize', updatePlaceholder)
  document.addEventListener('keydown', handleSlashKey)
  document.addEventListener('keydown', handleEscapeKey)
  loadHistory()
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePlaceholder)
  document.removeEventListener('keydown', handleSlashKey)
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>

<template>
  <div
    class="relative md:max-w-[675px] md:min-w-[500px] w-full md:w-auto"
    v-outside="close"
  >
    <IconSearchMagnify class="absolute left-3 md:left-[10px] top-1/2 -translate-y-1/2 w-6 h-6 text-[#bbbbbb]" />
    <input
      ref="searchInput"
      class="
        pl-10 md:pl-[38px]
        pr-12 md:pr-20
        py-[6px]
        text-[15px]
        font-normal
        leading-[22.5px]
        bg-[#151515]
        h-[36.5px]
        min-h-[36.5px]
        w-full
        text-[#f5f5f5]
        placeholder:text-[#bbbbbb]
        border border-[#222222]
        rounded-[8px]
        outline-none
        box-border
      "
      style="font-family: Roboto, system-ui, -apple-system, sans-serif;"
      spellcheck="false"
      @click.prevent="(data.open = true, loadHistory())"
      @focus="focused = true"
      @blur="focused = false"
      :value="data.query"
      @input="handleInput"
      @keydown="handleKeyDown"
      :placeholder="placeholder"
    />
    <div
      v-if="!!data.query"
      @click="cleanup()"
      class="absolute right-12 md:right-16 top-1/2 -translate-y-1/2 cursor-pointer"
    >
      <IconSearchClose class="w-5 h-5 text-[#bbbbbb] hover:text-[#f5f5f5]" />
    </div>

    <kbd class="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 bg-[#121212] bg-opacity-75 rounded-[6px] px-2 py-[2px] text-[#fafafa] text-[12.69px] font-semibold leading-[19px] min-w-[23.64px] h-[23.03px] flex items-center justify-center">
      /
    </kbd>

    <SearchModal
      :cleanup="cleanup"
      :close="close"
      :open="data.open && (data.loading || !!data.searched || !data.query)"
      :error="data.error"
      :loading="data.loading"
      :items="data.searched"
      :selectedFilter="data.filter.value"
      :history="data.history"
      :query="data.query"
      :onSelectHistory="selectHistoryItem"
      :onRecordHistory="(q, t) => recordHistory(q, t)"
    />
  </div>
</template>

<style scoped>
input {
  border-color: #222222 !important;
  border-width: 1px !important;
  transition-property: border-color, box-shadow !important;
  transition-duration: 0.15s !important;
  transition-timing-function: ease-in-out !important;
}
input:focus {
  border-color: #292929 !important;
  border-width: 1px !important;
  box-shadow: 0 0 0 2px #292929 !important;
  outline: none !important;
}
</style> 