<script setup lang="ts">
import Tooltip from '~/components/Tooltip.vue'

type Status = {
  text: string
  icon: any
  classes: string
  description: string
  placement: 'top' | 'right' | 'bottom' | 'left'
}

defineProps<{
  status: Status
}>()
</script>

<template>
  <Tooltip :value="status.description" :offset-distance="8" :placement="status.placement">
    <div
      class="px-2 py-1.5 text-[11px] rounded-md border flex items-center gap-1 leading-none"
      :class="status.classes"
    >
      <component :is="status.icon" class="w-2.5 h-2.5" />
      <span v-if="status.text">{{ status.text }}</span>
    </div>
  </Tooltip>
  
</template>


