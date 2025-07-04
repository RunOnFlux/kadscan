<script setup lang="ts">
const {
  data,
  close,
  search,
  cleanup,
  handleInput,
  handleKeyDown,
} = useSearch();
</script>

<template>
  <div
    class="relative w-full max-w-[500px] max-h-[48px]"
    v-outside="close"
  >
    <div
      class="flex gap-2 items-center w-full p-2 bg-[#111111] rounded-lg border border-[#222222]"
    >
      <div
        class="hidden sm:block"
      >
        <Select
          v-model="data.filter"
          :items="data.filters"
          @click="close"
          @update:model-value="search(data.query as any)"
        />
      </div>

      <input
        class="
          px-1
          bazk:px-2
          text-[15px]
          bg-transparent
          outline-none
          h-full w-full
          text-[#f5f5f5]  
          placeholder:text-[#bbbbbb]
        "
        @click.prevent="data.open = true"
        :value="data.query"
        @input="handleInput"
        @keydown="handleKeyDown"
        placeholder="Search by Address / Token / Block"
      />

      <div
        @click="cleanup()"
        class="mr-1 flex items-center justify-center p-[6px] bg-[#0784c3] hover:bg-[#0670a6] rounded-lg h-8 w-8 shrink-0 cursor-pointer"
      >
        <IconSearchClose
          class="w-5 h-5 text-[#fafafa]"
          v-if="data.open && !!data.query"
        />

        <IconSearch
          v-else
          class="w-5 h-5 text-[#fafafa]"
        />
      </div>
    </div>

    <SearchModal
      :cleanup="cleanup"
      :open="data.open && !!data.query && !!data.searched"
      :error="data.error"
      :loading="data.loading"
      :items="data.searched"
    />
  </div>
</template>
