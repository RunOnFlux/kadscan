<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import Tooltip from './Tooltip.vue';

const props = defineProps<{
  value: string | number | undefined;
  tooltipText?: string;
  iconSize?: string;
  buttonClass?: string;
}>();

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
      class="rounded-lg place-items-center grid group"
      :class="buttonClass || 'w-8 h-8'"
    >
      <IconCheckmark v-if="isCopied" class="w-3 h-3 text-[#888888]" />
      <IconCopy
        v-else
        :sizeClass="iconSize || 'w-5 h-5'"
        class="text-[#888888] group-hover:text-[#39a1d9]"
      />
    </button>
  </Tooltip>
  <button
    v-else
    @click.prevent="onCopy()"
    class="rounded-lg place-items-center grid group"
    :class="buttonClass || 'w-8 h-8'"
  >
    <IconCheckmark v-if="isCopied" class="w-3 h-3 text-[#888888]" />
    <IconCopy
      v-else
      :sizeClass="iconSize || 'w-5 h-5'"
      class="text-[#888888] group-hover:text-[#39a1d9]"
    />
  </button>
</template>
