<script setup lang="ts">
defineProps<{
  label: string;
  value?: string | number;
  col?: boolean;
  row?: boolean;
  withCopy?: boolean;
  description?: string;
  copyTooltip?: string;
  tooltipPos?: 'top' | 'right' | 'bottom' | 'left';
}>()
</script>

<template>
  <div
    class="flex flex-col md:flex-row"
    :class="[
      col && '!flex-col !items-start',
      row && '!flex-row !gap-6',
      value && 'md:items-center'
    ]"
  >
    <div
      class="flex gap-2"
      :class="[
        !row && 'w-full h-fullmin-w-[300px] max-w-[300px]',
      ]"
    >
      <Tooltip
        v-if="description"
        :value="description"
        :placement="tooltipPos"
        :offset-distance="16"
      >
        <span
          class="text-[#bbbbbb] text-[15px] font-normal"
        >
          {{ label }}
        </span>
      </Tooltip>
      <span
        v-else
        class="text-[#bbbbbb] text-[15px] font-normal"
      >
        {{ label }}
      </span>
    </div>

    <div
      :class="[!value && 'flex-col', value && 'items-center']"
      class="text-[#f5f5f5] text-[15px] fix flex gap-2 break-words"
    >
      <slot
        name="value"
      >
        <span
          v-if="value"
        >
          {{ value }}
        </span>

        <Copy
          :tooltipText="copyTooltip"
          v-if="withCopy && value"
          :value="value"
        />
      </slot>
    </div>
  </div>
</template>

<style>
.fix {
  overflow-wrap:anywhere
}
</style>
