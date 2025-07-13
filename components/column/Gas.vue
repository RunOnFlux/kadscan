<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  gas?: number;
  gasLimit?: number;
}>();

const percentage = computed(() => {
  if (!props.gas || !props.gasLimit || props.gasLimit === 0) {
    return 0;
  }
  const ratio = props.gas / props.gasLimit;
  return Math.min(ratio * 100, 100); // Ensure it doesn't exceed 100%
});

const formattedGas = computed(() => {
  if (props.gas === undefined) {
    return '0';
  }
  return new Intl.NumberFormat().format(props.gas);
});
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <div class="flex items-center gap-1">
      <span class="text-[15px] text-[#f5f5f5]">{{ formattedGas }}</span>
      <span class="text-[15px] text-[#b2b2b2]">({{ percentage.toFixed(0) }}%)</span>
    </div>
    <div class="w-full bg-[#33393e] rounded-full h-[2px]">
      <div
        class="bg-[#01ff58] h-[2px] rounded-full"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
  </div>
</template> 