<script setup lang="ts">
import { computed } from 'vue';
import IconChevron from '~/components/icon/Chevron.vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  loadingPage: {
    type: Boolean,
    default: false,
  },
  hasNextPage: {
    type: Boolean,
    default: false,
  },
  hasPreviousPage: {
    type: Boolean,
    default: false,
  },
  unknownTotal: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:currentPage', 'update:loadingPage']);

const isFirstPage = computed(() => props.currentPage === 1);
const isLastPage = computed(() => props.currentPage === props.totalPages);

// Unified navigation capability (cursor mode vs known totals)
const canGoPrev = computed(() => props.unknownTotal ? props.hasPreviousPage : !isFirstPage.value);
const canGoNext = computed(() => props.unknownTotal ? props.hasNextPage : !isLastPage.value);
const canGoFirst = computed(() => !props.unknownTotal && !isFirstPage.value);
const canGoLast = computed(() => !props.unknownTotal && !isLastPage.value);

const formatTotalPages = computed(() => {
  if (!props.totalPages) return '...';
  return new Intl.NumberFormat('en-US').format(props.totalPages);
});

const formatCurrentPage = computed(() => {
  return new Intl.NumberFormat('en-US').format(props.currentPage);
});

const goToFirst = () => {
  if (canGoFirst.value) {
    emit('update:currentPage', 1);
    emit('update:loadingPage', true);
  }
};

const goToLast = () => {
  if (canGoLast.value) {
    emit('update:currentPage', props.totalPages);
    emit('update:loadingPage', true); 
  }
};

const goToPrevious = () => {
  if (canGoPrev.value) {
    emit('update:currentPage', props.currentPage - 1);
    emit('update:loadingPage', true);
  }
};

const goToNext = () => {
  if (canGoNext.value) {
    emit('update:currentPage', props.currentPage + 1);
    emit('update:loadingPage', true);
  }
};
</script>

<template>
  <nav class="flex items-stretch gap-0.5" aria-label="Pagination">
    <button
      v-if="!unknownTotal"
      :disabled="!canGoFirst || loadingPage"
      @click="goToFirst"
      class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-line-default bg-surface-primary text-xs font-normal text-link hover:text-font-primary hover:bg-[#0784c3] disabled:hover:bg-surface-disabled disabled:bg-surface-disabled disabled:text-font-tertiary transition-colors duration-300"
    >
      First
    </button>
    <button
      :disabled="!canGoPrev || loadingPage"
      @click="goToPrevious"
      class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-line-default bg-surface-primary text-xs font-normal text-link hover:text-font-primary hover:bg-[#0784c3] disabled:hover:bg-surface-disabled disabled:bg-surface-disabled disabled:text-font-tertiary transition-colors duration-300"
    >
      <IconChevron class="h-4 w-4 transform rotate-180" />
    </button>
    <span class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-line-default bg-surface-disabled text-xs font-normal text-font-tertiary cursor-default">
      <template v-if="!unknownTotal">Page {{ formatCurrentPage }} of {{ formatTotalPages }}</template>
      <template v-else>Page {{ formatCurrentPage }}</template>
    </span>
    <button
      :disabled="!canGoNext || loadingPage"
      @click="goToNext"
      class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-line-default bg-surface-primary text-xs font-normal text-link hover:text-font-primary hover:bg-[#0784c3] disabled:hover:bg-surface-disabled disabled:bg-surface-disabled disabled:text-font-tertiary transition-colors duration-300"
    >
      <IconChevron class="h-4 w-4" />
    </button>
    <button
      v-if="!unknownTotal"
      :disabled="!canGoLast || loadingPage"
      @click="goToLast"
      class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-line-default bg-surface-primary text-xs font-normal text-link hover:text-font-primary hover:bg-[#0784c3] disabled:hover:bg-surface-disabled disabled:bg-surface-disabled disabled:text-font-tertiary transition-colors duration-300"
    >
      Last
    </button>
  </nav>
</template> 