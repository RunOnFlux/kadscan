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
  hasNextPage: {
    type: Boolean,
    default: false,
  },
  hasPreviousPage: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:currentPage']);

const isFirstPage = computed(() => props.currentPage === 1);
const isLastPage = computed(() => props.currentPage === props.totalPages);

const formatTotalPages = computed(() => {
  if (!props.totalPages) return '...';
  return new Intl.NumberFormat('en-US').format(props.totalPages);
});

const goToFirst = () => {
  if (!isFirstPage.value) {
    emit('update:currentPage', 1);
  }
};

const goToLast = () => {
  if (!isLastPage.value) {
    emit('update:currentPage', props.totalPages);
  }
};

const goToPrevious = () => {
  if (!isFirstPage.value) {
    emit('update:currentPage', props.currentPage - 1);
  }
};

const goToNext = () => {
  if (!isLastPage.value) {
    emit('update:currentPage', props.currentPage + 1);
  }
};
</script>

<template>
  <nav class="flex items-center gap-1" aria-label="Pagination">
    <button
      :disabled="!hasPreviousPage"
      @click="goToFirst"
      class="relative inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#151515] text-xs font-medium text-[#6ab5db] hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed disabled:text-[#bbbbbb]"
    >
      First
    </button>
    <button
      :disabled="!hasPreviousPage"
      @click="goToPrevious"
      class="relative inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#151515] text-xs font-medium text-[#6ab5db] hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed disabled:text-[#bbbbbb]"
    >
      <IconChevron class="h-4 w-4 transform rotate-180" />
    </button>
    <span class="relative inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#151515] text-xs font-medium text-gray-300">
      Page {{ currentPage }} of {{ formatTotalPages }}
    </span>
    <button
      :disabled="!hasNextPage"
      @click="goToNext"
      class="relative inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#151515] text-xs font-medium text-[#6ab5db] hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed disabled:text-[#bbbbbb]"
    >
      <IconChevron class="h-4 w-4" />
    </button>
    <button
      :disabled="!hasNextPage"
      @click="goToLast"
      class="relative inline-flex items-center px-2 py-1 rounded-md border border-[#222222] bg-[#151515] text-xs font-medium text-[#6ab5db] hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed disabled:text-[#bbbbbb]"
    >
      Last
    </button>
  </nav>
</template> 