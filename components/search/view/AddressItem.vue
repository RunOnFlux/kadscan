<script setup lang="ts">
const props = defineProps<{
  account: string,
}>();

const { recordHistory } = useSearch();
</script>

<template>
  <NuxtLink
    :to="`/account/${account}`"
    @click="recordHistory(account, 'account')"
    class="py-3 px-2 flex gap-2 hover:bg-surface-secondary hover:rounded-md flex items-center"
  >
    <IconStatus
      status="success"
      class="mb-auto xl:mb-0  w-[28px] h-[28px]"
    />

    <div
      class="flex truncate"
    >
      <span
        class="text-sm text-font-primary truncate block"
      >
        {{ account }}
      </span>
    </div>
  </NuxtLink>
</template>
