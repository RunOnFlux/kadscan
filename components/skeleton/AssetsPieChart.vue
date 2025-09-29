<script setup lang="ts">
const COLORS = ['#ff6b6b', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6']
</script>

<template>
  <div class="w-full">
    <div class="grid grid-cols-1 md:flex md:items-center">
      <!-- Left: Donut placeholder -->
      <div class="md:basis-6/12 md:shrink-0 flex justify-center md:justify-start">
        <div class="relative overflow-visible" style="width: 260px; height: 260px">
          <div class="absolute inset-0 rounded-full bg-surface-skeleton animate-pulse"></div>
          <div class="absolute rounded-full bg-surface-primary" style="top: 58px; right: 58px; bottom: 58px; left: 58px"></div>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <div class="text-center">
              <div class="h-3 w-12 bg-line-strong rounded mx-auto mb-1 animate-pulse" />
              <div class="h-4 w-16 bg-surface-skeleton rounded mx-auto animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Legend placeholder -->
      <div class="md:basis-6/12 flex flex-col justify-center md:pt-0 pt-6">
        <div class="space-y-3 max-h-72 overflow-hidden pl-4">
          <div v-for="(c, idx) in COLORS.slice(0,5)" :key="idx" class="flex items-center justify-between flex-wrap">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-3 h-3 rounded-full bg-line-strong"></div>
              <div class="flex items-center gap-2 min-w-0">
                <div class="h-3 w-12 bg-line-strong rounded animate-pulse" />
                <div class="h-3 w-28 bg-surface-skeleton rounded animate-pulse" />
              </div>
            </div>
            <div class="h-3 w-12 bg-surface-skeleton rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


