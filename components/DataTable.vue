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
  hasNextPage: {
    type: Boolean,
    default: false,
  },
  hasPreviousPage: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:currentPage', 'update:selectedRows']);

const formatTotalItems = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-[15px] text-normal text-[#f5f5f5]">
          Total of {{ formatTotalItems(totalItems) }} {{ itemNamePlural }}
        </h2>
        <p class="text-[13px] text-[#bbbbbb]">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
        <PaginationControls
          :currentPage="currentPage"
          :totalPages="totalPages"
          :has-next-page="hasNextPage"
          :has-previous-page="hasPreviousPage"
          @update:currentPage="emit('update:currentPage', $event)"
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
              class="px-4 py-2 text-left text-[13px] font-bold text-[#f5f5f5]"
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
              class="px-4 py-3 whitespace-nowrap text-[15px]"
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

    <div class="pt-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-[15px] text-[#bbbbbb]">Show rows:</span>
        <div class="border border-gray-600 rounded-md">
          <Select
            :modelValue="selectedRows"
            @update:modelValue="emit('update:selectedRows', $event)"
            :items="rowOptions"
            position="top-left"
          />
        </div>
      </div>
      <PaginationControls
        :currentPage="currentPage"
        :totalPages="totalPages"
        :has-next-page="hasNextPage"
        :has-previous-page="hasPreviousPage"
        @update:currentPage="emit('update:currentPage', $event)"
      />
    </div>
  </div>
</template> 