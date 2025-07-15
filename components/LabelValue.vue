<script setup lang="ts">
defineProps<{
  label: string;
  value?: string | number;
  col?: boolean;
  withCopy?: boolean;
  description?: string;
  copyTooltip?: string;
}>()
</script>

<template>
  <div
    class="flex flex-col md:flex-row"
    :class="[
      col && '!flex-col !items-start',
      value && 'md:items-center'
    ]"
  >
    <div
      class="w-full min-w-[300px] max-w-[300px] h-full flex items-center gap-2"
    >
      <Tooltip
        v-if="description"
        :value="description"
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
