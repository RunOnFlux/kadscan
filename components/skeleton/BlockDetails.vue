<template>
  <div>
    <!-- Header Skeleton -->
    <div class="flex items-center pb-5 border-b border-[#222222] mb-6 gap-2">
      <div class="h-6 w-24 bg-gray-600 rounded animate-pulse"></div>
      <div class="h-6 w-24 bg-gray-600 rounded animate-pulse"></div>
    </div>

    <!-- Main Content Skeleton -->
    <div
      class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-1"
    >
      <div class="flex gap-1">
        <!-- Column 1 -->
        <div class="flex flex-col gap-4 animate-pulse w-[300px] flex-shrink-0">
          <div v-for="i in 9" :key="i" class="flex flex-col gap-2">
            <div class="h-4 w-1/4 bg-gray-700 rounded"></div>
            <div class="h-5 w-2/5 bg-gray-600 rounded"></div>
          </div>
        </div>

        <!-- Column 2 -->
        <div class="flex flex-col gap-4 animate-pulse w-full">
          <div v-for="i in 9" :key="i" class="flex flex-col gap-2">
            <div class="h-4 w-1/4 bg-gray-700 rounded"></div>
            <div class="h-5 w-2/5 bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- More Details Card Skeleton -->
    <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mt-4">
      <div class="h-5 w-1/4 bg-gray-600 rounded animate-pulse"></div>
    </div>
  </div>
</template> 