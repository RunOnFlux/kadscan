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
});

const emit = defineEmits(['update:currentPage', 'update:loadingPage']);

const isFirstPage = computed(() => props.currentPage === 1);
const isLastPage = computed(() => props.currentPage === props.totalPages);

const formatTotalPages = computed(() => {
  if (!props.totalPages) return '...';
  return new Intl.NumberFormat('en-US').format(props.totalPages);
});

const formatCurrentPage = computed(() => {
  return new Intl.NumberFormat('en-US').format(props.currentPage);
});

const goToFirst = () => {
  if (!isFirstPage.value) {
    emit('update:currentPage', 1);
    emit('update:loadingPage', true);
  }
};

const goToLast = () => {
  if (!isLastPage.value) {
    emit('update:currentPage', props.totalPages);
    emit('update:loadingPage', true); 
  }
};

const goToPrevious = () => {
  if (!isFirstPage.value) {
    emit('update:currentPage', props.currentPage - 1);
    emit('update:loadingPage', true);
  }
};

const goToNext = () => {
  if (!isLastPage.value) {
    emit('update:currentPage', props.currentPage + 1);
    emit('update:loadingPage', true);
  }
};
</script>

<template>
  <nav class="flex items-stretch gap-0.5" aria-label="Pagination">
    <button
      :disabled="!hasPreviousPage || loadingPage"
      @click="goToFirst"
      class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#111111] text-xs font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
    >
      First
    </button>
    <button
      :disabled="!hasPreviousPage || loadingPage"
      @click="goToPrevious"
      class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#111111] text-xs font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
    >
      <IconChevron class="h-4 w-4 transform rotate-180" />
    </button>
    <span class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#151515] text-xs font-normal text-[#888888] cursor-default">
      Page {{ formatCurrentPage }} of {{ formatTotalPages }}
    </span>
    <button
      :disabled="!hasNextPage || loadingPage"
      @click="goToNext"
      class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#111111] text-xs font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
    >
      <IconChevron class="h-4 w-4" />
    </button>
    <button
      :disabled="!hasNextPage || loadingPage"
      @click="goToLast"
      class="relative whitespace-nowrap inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#111111] text-xs font-normal text-[#6ab5db] hover:text-[#fafafa] hover:bg-[#0784c3] disabled:hover:bg-[#151515] disabled:bg-[#151515] disabled:text-[#888888] transition-colors duration-300"
    >
      Last
    </button>
  </nav>
</template> 