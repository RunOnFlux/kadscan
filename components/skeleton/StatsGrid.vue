<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
    <div
      v-for="n in 4"
      :key="`skeleton-stats-card-${n}`"
      class="bg-[#111111] border border-[#222222] rounded-xl p-4 shadow-[0_0_20px_rgba(255,255,255,0.0625)]"
    >
      <div class="animate-pulse">
        <div class="h-4 bg-gray-600 rounded w-1/3 mb-2"></div>
        <div class="h-6 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  </div>
</template>


