<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const {
  data,
  close,
  search,
  cleanup,
  handleInput,
  handleKeyDown,
} = useSearch();

const placeholder = ref('Search by Transaction / Address / Block / Token / Code')
const focused = ref(false)

const updatePlaceholder = () => {
  if (window.innerWidth < 640) {
    placeholder.value = 'Transaction / Address / Block / Token'
  } else {
    placeholder.value = 'Search by Transaction / Address / Block / Token / Code'
  }
}

onMounted(() => {
  updatePlaceholder()
  window.addEventListener('resize', updatePlaceholder)
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePlaceholder)
})
</script>

<template>
  <div
    class="relative md:max-w-[675px] md:min-w-[480px] w-full md:w-auto"
    v-outside="close"
  >
    <IconSearchMagnify class="absolute left-3 md:left-[10px] top-1/2 -translate-y-1/2 w-6 h-6 text-[#bbbbbb]" />
    <input
      class="
        pl-10 md:pl-[38px]
        pr-8 md:pr-[80px]
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
      @click.prevent="data.open = true"
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
      <IconSearchClose class="w-5 h-5 text-[#bbbbbb] hover:text-[#f5f5f5]" />
    </div>

    <SearchModal
      :cleanup="cleanup"
      :close="close"
      :open="data.open && !!data.query && !!data.searched"
      :error="data.error"
      :loading="data.loading"
      :items="data.searched"
      :selectedFilter="data.filter.value"
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