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
    class="relative max-w-[766px]"
    v-outside="close"
  >
    <div
      class="flex gap-2 items-center w-full p-[6px] bg-[#111111] rounded-lg border border-[#222222]"
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

      <div class="relative w-full flex items-center">
        <input
          class="
            px-1
            bazk:px-2
            py-[0.3rem]
            text-[15px]
            bg-transparent
            outline-none
            h-full w-full
            text-[#f5f5f5]
            placeholder:text-[#bbbbbb]
            pr-8
          "
          @click.prevent="data.open = true"
          :value="data.query"
          @input="handleInput"
          @keydown="handleKeyDown"
          placeholder="Search by Transaction / Address / Token / Block"
        />
        <div
          v-if="!!data.query"
          @click="cleanup()"
          class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
        >
          <IconSearchClose class="w-5 h-5 text-[#bbbbbb] hover:text-[#f5f5f5]" />
        </div>
      </div>

      <div
        @click="search(data.query as any)"
        class="flex items-center justify-center bg-[#0784c3] hover:bg-[#0670a6] rounded-lg w-[36px] h-[34px] shrink-0 cursor-pointer"
      >
        <IconSearch
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
