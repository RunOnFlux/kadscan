<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import Tooltip from './Tooltip.vue';

const props = defineProps<{
  value: string | number | undefined;
  isSmall?: boolean;
  tooltipText?: string;
}>()

const isCopied = ref(false);
const dynamicTooltipText = ref(props.tooltipText);

watchEffect(() => {
  if (!isCopied.value) {
    dynamicTooltipText.value = props.tooltipText;
  }
});

const copyToClipboard = async (value: string | number) => {
  try {
    await navigator.clipboard.writeText(value + '')
  } catch (e) {
    console.warn(e)
  }
}

const onCopy = async () => {
  if (isCopied.value) {
    return;
  }

  isCopied.value = true;
  await copyToClipboard(props.value || '');

  if (props.tooltipText) {
    dynamicTooltipText.value = 'Copied!';
  }

  setTimeout(() => {
    isCopied.value = false;
  }, 1500);
}
</script>

<template>
  <Tooltip v-if="props.tooltipText" :value="dynamicTooltipText">
    <button
      @click.prevent="onCopy()"
      class="w-8 h-8 rounded-lg place-items-center grid group"
      :class="isSmall && '!w-6 !h-6'"
    >
      <IconCheckmark v-if="isCopied" class="w-3 h-3 text-[#888888]" />
      <IconCopy
        v-else
        class="w-5 h-5 text-[#888888] group-hover:text-kadscan-400"
      />
    </button>
  </Tooltip>
  <button
    v-else
    @click.prevent="onCopy()"
    class="w-8 h-8 rounded-lg place-items-center grid group"
    :class="isSmall && '!w-6 !h-6'"
  >
    <IconCheckmark v-if="isCopied" class="w-3 h-3 text-[#888888]" />
    <IconCopy
      v-else
      class="w-5 h-5 text-[#888888] group-hover:text-kadscan-400"
    />
  </button>
</template>
