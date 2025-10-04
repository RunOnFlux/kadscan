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

const placeholder = ref('Search for Blocks / Transactions / Addresses / Tokens')
const focused = ref(false)

const updatePlaceholder = () => {
  if (window.innerWidth < 640) {
    placeholder.value = 'Blocks / Transactions / Addresses / Tokens'
  } else {
    placeholder.value = 'Search for Blocks / Transactions / Addresses / Tokens'
  }
}

onMounted(() => {
  updatePlaceholder()
  window.addEventListener('resize', updatePlaceholder)
  loadHistory()
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePlaceholder)
})
</script>

<template>
  <div
    class="relative max-w-[764px]"
    v-outside="close"
  >
    <div
      class="flex gap-2 items-center max-w-[675px] w-full p-[6px] bg-surface-primary rounded-lg border border-line-default"
    >
      <div
        class="hidden sm:block"
      >
        <Select
          :fontSize="15"
          v-model="data.filter"
          :items="data.filters"
          :maxVisible="data.filters.length"
          @click="close"
          @update:model-value="search(data.query as any)"
        />
      </div>

      <div class="relative w-full flex items-start">
        <input
          class="
            pl-3
            pr-8
            bazk:px-2
            py-[0.3rem]
            text-[16px]
            bg-transparent
            h-full w-full
            text-font-primary
            placeholder:text-font-secondary
            border rounded-lg
            outline-none
          "
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
          class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
        >
          <IconSearchClose class="w-5 h-5 text-font-secondary hover:text-font-primary" />
        </div>

    <SearchModal
      :cleanup="cleanup"
      :close="close"
      :open="data.open && (data.loading || !!data.searched || !!data.error || !data.query)"
      :error="data.error"
      :loading="data.loading"
      :items="data.searched"
      :selectedFilter="data.filter.value"
      :history="data.history"
      :query="data.query"
      :onSelectHistory="selectHistoryItem"
      :onRecordHistory="recordHistory"
    />
      </div>

      <div
        @click="submit()"
        class="flex items-center justify-center bg-accent-strong hover:bg-accent-strong rounded-lg w-[36px] h-[34px] shrink-0 cursor-pointer"
      >
        <IconSearch
          class="w-5 h-5 text-btn-text"
        />
        
      </div>
    </div>

  </div>
</template>

<style scoped>
input {
  border-color: transparent !important;
  border-width: 2px !important;
}
input:focus {
  border-color: rgb(var(--line-strong)) !important;
  border-width: 2px !important;
  outline: none !important;
}
</style>
