<script setup lang="ts">
import HomeList from '~/components/home/List.vue'
</script>

<template>
  <HomeList
    label="Latests Blocks"
  >
    <div
      v-for="n in 5"
      :key="`skeleton-recent-blocks-${n}`"
      class="flex animate-pulse items-center justify-between border-b border-gray-700 px-6 py-4"
    >
      <div class="flex w-1/3 items-center gap-4">
        <div class="h-12 w-12 shrink-0 rounded-md bg-gray-700" />
        <div class="flex w-full flex-col gap-2">
          <div class="h-4 w-1/3 rounded bg-gray-700" />
          <div class="h-3 w-1/2 rounded bg-gray-700" />
        </div>
      </div>

      <div class="flex w-2/3 items-center justify-between gap-4">
        <div class="flex w-full flex-col gap-2">
          <div class="h-4 w-1/3 rounded bg-gray-700" />
          <div class="h-4 w-1/2 rounded bg-gray-700" />
        </div>
        <div class="hidden h-7 w-20 shrink-0 rounded-md bg-gray-700 sm:block" />
      </div>
    </div>
  </HomeList>
</template>
