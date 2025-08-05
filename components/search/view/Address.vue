<script setup lang="ts">
defineProps<{
  addresses: any,
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
        class="text-[11px] font-medium text-[#bbbbbb] mb-[1px]"
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
      />
    </div>
  </div>
</template>
