<template>
  <div class="bg-surface-primary border border-line-default rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
    <div class="flex justify-between items-center p-4 mb-4">
      <div class="h-6 bg-line-strong rounded w-1/5 animate-pulse"></div>
      <div class="h-6 bg-line-strong rounded w-1/3 animate-pulse"></div>
    </div>
    <div class="animate-pulse">
      <div class="flex p-4 rounded-t-lg">
        <div v-for="i in 7" :key="i" class="flex-1 h-4 bg-line-strong rounded mx-2"></div>
      </div>
      <div v-for="row in 10" :key="row" class="flex items-center p-4 border-t border-surface-skeleton">
        <div v-for="col in 7" :key="col" class="flex-1 h-4 bg-surface-skeleton rounded mx-2"></div>
      </div>
    </div>
    <div class="flex justify-between items-center p-4 mb-4">
      <div class="h-6 bg-line-strong rounded w-1/6 animate-pulse"></div>
      <div class="h-6 bg-line-strong rounded w-1/3 animate-pulse"></div>
    </div>
  </div>
</template>


