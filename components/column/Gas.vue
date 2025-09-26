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

// Check if percentage is valid (not NaN and not 0 when gas exists)
const shouldShowPercentage = computed(() => {
  const perc = percentage.value;
  return !isNaN(perc) && (props.gas > 0 && props.gasLimit > 0);
});

// Check if progress bar should be shown (percentage > 0)
const shouldShowProgressBar = computed(() => {
  return shouldShowPercentage.value && percentage.value > 0;
});
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <div class="flex items-center gap-1">
      <span class="text-[15px] text-font-primary">{{ formattedGas }}</span>
      <span v-if="shouldShowPercentage" class="text-[15px] text-[#b2b2b2]">({{ percentage.toFixed(0) }}%)</span>
    </div>
    <div class="md:w-full max-w-[80px] bg-[#33393e] rounded-full h-[2px]" v-if="shouldShowProgressBar">
      <div
        class="bg-[#57ff90] h-[2px] rounded-full"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
  </div>
</template> 