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
      class="pb-2"
    >
      <span
        class="text-xs text-[#bbbbbb] mb-[1px]"
      >
        ADDRESSES
      </span>
    </div>

    <SearchViewAddressItem
      v-bind="address"
      class="py-3"
      :key="'address:'+i+address.id"
      v-for="(address, i) in addresses"
      :class="[!((i + 1) === addresses.length) && '!border-b border-b-[#222222]']"
    />
  </div>
</template>
