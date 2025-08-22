<script setup lang="ts">
defineProps<{
  address: string,
  balances: any,
  pending?: boolean,
}>()

const {
  assetsTableColumns,
  assetsTableSubColumns
} = useAppConfig()

// const data = reactive({
//   currentPage: 1,
//   totalPages: 15,
// })
</script>

<template>
  <div
    class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4"
  >
    <TableRoot
      :rows="balances"
      :isFull="true"
      :mobileWithoutHeader="true"
      :pending="pending"
      :columns="assetsTableColumns"
    >
      <template #row="{ row, columns, rowIndex, isLast }">
        <TableRowExpansible
          :row="row"
          :isLast="isLast"
          :columns="columns"
          :rowIndex="rowIndex"
          :subColumns="assetsTableSubColumns"
        >
          <template #asset="{ row }">
            <ColumnToken
              v-bind="row.metadata"
              :withSymbol="false"
            />
          </template>

          <template #symbol="{ row }">
            <span
              class="uppercase"
            >
              {{ row.symbol }}
            </span>
          </template>

          <template #price="{ row }">
            <ColumnPrice
              :label="row.current_price"
              :delta="row.price_change_percentage_24h"
            />
          </template>

          <template #balance="{ row }">
            {{ integer.format(row.balance) }}
          </template>

          <template #value="{ row }">
            {{ row.current_price ? money.format(row.balance * row.current_price) : '-' }}
          </template>

          <template #distribution="{ open }">
            <div
              :class="[open && 'bg-[#151515] border-[#222222]']"
              class="w-8 h-8 group rounded grid items-center justify-center bg-[#151515] border border-transparent hover:border-[#222222]"
            >
              <IconArrow
                :class="[open && 'rotate-90 text-kadscan-500']"
                class="mx-auto -rotate-90 group-hover:text-kadscan-500 transition"
              />
            </div>
          </template>
        </TableRowExpansible>
      </template>

      <template
        #empty
      >
        <EmptyTable
          image="/empty/nft.png"
          title="No assets held in account"
          description="This account is not holding any assets."
        />
      </template>
    </TableRoot>

    <!-- <PaginateTable
      itemsLabel="Tokens"
      :totalItems="180"
      :currentPage="data.currentPage"
      :totalPages="data.totalPages"
      @pageChange="data.currentPage = $event"
    /> -->
  </div>
</template>
