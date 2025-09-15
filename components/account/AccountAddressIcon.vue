<script setup lang="ts">
import { computed } from 'vue'
import { getIdenticon } from '~/composables/useIdenticon'

const props = defineProps<{ address: string }>()

const data = computed(() => getIdenticon(props.address))
</script>

<template>
  <div
    class="overflow-hidden flex items-center justify-center"
    :style="{
      backgroundImage: `linear-gradient(135deg, ${data.backgroundFrom}, ${data.backgroundTo})`
    }"
  >
    <div class="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full">
      <div v-for="(color, idx) in data.cells" :key="idx" :style="{ backgroundColor: color || 'transparent' }"></div>
    </div>
  </div>
</template>


