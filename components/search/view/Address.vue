<script setup lang="ts">
const props = defineProps<{
  addresses: any,
  onRecordHistory?: (q: string, type?: string | null) => void,
}>()
</script>

<template>
  <div
    class="flex flex-col"
  >
    <div
      class="pb-1 px-2 pt-3"
    >
      <span
        class="text-[11px] font-medium text-font-secondary mb-[1px]"
      >
        ADDRESSES
      </span>
    </div>

    <div class="flex flex-col gap-2">
      <SearchViewAddressItem
        v-bind="address"
        class="py-2"
        :key="'address:'+i+address.id"
        v-for="(address, i) in addresses"
        @select="props.onRecordHistory && props.onRecordHistory(address.account, 'account')"
      />
    </div>
  </div>
</template>
