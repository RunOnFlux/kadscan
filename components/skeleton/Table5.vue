<template>
  <div class="bg-surface-primary border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
    <div class="flex justify-between items-center p-4 mb-4">
      <div class="h-6 bg-[#343636] rounded w-1/5 animate-pulse"></div>
      <div class="h-6 bg-[#343636] rounded w-1/3 animate-pulse"></div>
    </div>
    <div class="animate-pulse">
      <div class="flex p-4 rounded-t-lg">
        <div v-for="i in 7" :key="i" class="flex-1 h-4 bg-[#343636] rounded mx-2"></div>
      </div>
      <div v-for="row in 5" :key="row" class="flex items-center p-4 border-t border-[#292B2C]">
        <div v-for="col in 7" :key="col" class="flex-1 h-4 bg-[#292B2C] rounded mx-2"></div>
      </div>
    </div>
    <div class="flex justify-between items-center p-4 mb-4">
      <div class="h-6 bg-[#343636] rounded w-1/6 animate-pulse"></div>
      <div class="h-6 bg-[#343636] rounded w-1/3 animate-pulse"></div>
    </div>
  </div>
</template>


