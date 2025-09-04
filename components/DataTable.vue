<script setup lang="ts">
import PaginationControls from '~/components/PaginationControls.vue';
import Select from '~/components/Select.vue';

defineProps({
  headers: {
    type: Array as () => Array<{ key: string, label: string, class?: string }>,
    required: true,
  },
  items: {
    type: Array as () => Array<any>,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  itemNamePlural: {
    type: String,
    default: 'items',
  },
  subtitle: {
    type: String,
    required: true,
  },
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  selectedRows: {
    type: Object,
    required: true,
  },
  rowOptions: {
    type: Array as () => Array<any>,
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
  showTopPagination: {
    type: Boolean,
    default: true,
  },
  unknownTotal: {
    type: Boolean,
    default: false,
  },
  customTitle: {
    type: String,
    default: '',
  },
  preventHeaderWrap: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:currentPage', 'update:selectedRows', 'update:loadingPage']);

const formatTotalItems = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
    <div class="flex justify-between mb-4" :class="preventHeaderWrap ? 'flex-row items-center gap-2 flex-nowrap' : 'flex-col md:flex-row gap-y-2 items-start md:items-center'">
      <div>
        <h2 class="text-[15px] text-normal text-[#f5f5f5]">
          <template v-if="!unknownTotal">
            Total of {{ formatTotalItems(totalItems) }} {{ itemNamePlural }}
          </template>
          <template v-else>
            {{ customTitle || 'Searching with code' }}
          </template>
          <slot name="titleSuffix" />
        </h2>
        <p class="text-[13px] text-[#bbbbbb]">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex items-center gap-2 justify-end" :class="preventHeaderWrap ? 'w-fit' : 'w-full md:w-fit'">
        <slot name="actions" />
        <PaginationControls
          v-if="showTopPagination"
          :currentPage="currentPage"
          :totalPages="totalPages"
          :loadingPage="loadingPage"
          :has-next-page="hasNextPage"
          :has-previous-page="hasPreviousPage"
          :unknownTotal="unknownTotal"
          @update:currentPage="emit('update:currentPage', $event)"
          @update:loadingPage="emit('update:loadingPage', $event)"
        />
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-[#222222]">
        <thead class="bg-transparent">
          <tr>
            <th
              v-for="header in headers"
              :key="header.key"
              scope="col"
              class="px-2 py-[9px] text-left text-[12px] font-bold text-[#f5f5f5] whitespace-nowrap"
              :class="header.class"
            >
              {{ header.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-transparent divide-y divide-[#222222]">
          <tr v-for="(item, index) in items" :key="index">
            <td
              v-for="header in headers"
              :key="header.key"
              class="px-2 py-[9px] whitespace-nowrap text-[14px]"
              :class="header.class"
            >
              <slot :name="header.key" :item="item">
                <span class="text-[#f5f5f5]">{{ item[header.key] }}</span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pt-4 flex items-center justify-end md:justify-between">
      <div class="hidden md:flex items-center gap-2">
        <span class="text-[15px] text-[#bbbbbb]">Show rows:</span>
        <div class="border border-[#222222] rounded-md">
          <Select
            :modelValue="selectedRows"
            @update:modelValue="emit('update:selectedRows', $event)"
            :items="rowOptions"
            position="bot-left"
            fontSize="12"
          />
        </div>
      </div>
      <PaginationControls
        :currentPage="currentPage"
        :totalPages="totalPages"
        :loadingPage="loadingPage"
        :has-next-page="hasNextPage"
        :has-previous-page="hasPreviousPage"
        :unknownTotal="unknownTotal"
        @update:currentPage="emit('update:currentPage', $event)"
        @update:loadingPage="emit('update:loadingPage', $event)"
      />
    </div>
  </div>
</template> 