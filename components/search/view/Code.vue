<script setup lang="ts">
const props = defineProps<{ items: any[]; query?: string; onRecordHistory?: (q: string, type?: string|null) => void }>();
const router = useRouter();
const topFive = computed(() => (props.items || []).slice(0, 5));
const hasMore = computed(() => (props.items || []).length >= 6);

const goToMore = async () => {
  const q = String(props.query || '');
  if (props.onRecordHistory) props.onRecordHistory(q, 'code');
  await router.push({ path: '/transactions', query: { code: q } });
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="pb-1 px-2 pt-3">
      <span class="text-[11px] font-medium text-[#bbbbbb] mb-[1px]">CODE</span>
    </div>

    <div class="flex flex-col gap-2">
      <SearchViewTransactionItem
        v-for="(tx, i) in topFive"
        :key="'code:'+tx.requestkey+':'+i"
        class="py-2"
        v-bind="tx"
      />

      <button
        v-if="hasMore"
        type="button"
        class="py-2 px-2 flex items-center justify-center hover:bg-surface-secondary hover:rounded-md w-full"
        @click.prevent="goToMore"
      >
        <span class="text-[#6ab5db] text-sm">Show more</span>
      </button>
    </div>
  </div>
</template>


