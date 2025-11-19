<script setup lang="ts">
const props = defineProps<{
  transactions: any,
  onRecordHistory?: (q: string, type?: string | null) => void,
}>()
</script>

<template>
  <div
    class="flex flex-col gap-2"
  >
    <div
      class="pb-1 px-2 pt-3"
    >
      <span
        class="text-[11px] font-medium text-font-secondary mb-[1px]"
      >
        TRANSACTIONS
      </span>
    </div>

    <div class="flex flex-col gap-2">
      <SearchViewTransactionItem
        v-bind="transaction"
        class="py-2"
        :key="'transaction:'+transaction.id"
        v-for="(transaction, i) in transactions"
        @select="props.onRecordHistory && props.onRecordHistory(transaction.requestkey, 'transactions')"
      />
    </div>
  </div>
</template>
