<script setup lang="ts">
import { format } from 'date-fns'

const props = defineProps<{
  height: number,
  chainId: number,
  chainCount: number,
  totalTransactions: number,
  createdAt: any,
}>()

const status = 'success'

const createdAt = useState('date', () => format(new Date(props.createdAt), 'dd MMM y HH:mm:ss'));
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-3 xl:gap-4 py-3 lg:h-[111px] xl:max-h-[82px] border-b border-b-gray-300"
  >
    <NuxtLink
      :to="`/blocks/chain/${props.chainId}/height/${props.height}`"
      class="mb-auto xl:mb-0"
    >
      <IconStatus
        :status="status"
      />
    </NuxtLink>

    <div
      class="flex xl:flex-col gap-4 grow xl:min-w-[150px]"
    >
      <Value
        isLink
        label="Block"
        :value="props.height"
        :to="`/blocks/chain/${props.chainId}/height/${props.height}`"
      />

      <Value
        label="Chain"
        :value="props.chainId"
      />
    </div>

    <div
      class="flex xl:flex-col gap-4 xl:mx-auto grow"
    >
      <Value
        :label="`Chains ${props.chainCount}/20`"
      />
       <Value
        label="Transactions"
        :value="totalTransactions"
        class="!flex-row flex-grow xl:w-full"
      />
    </div>

    <div
      class="flex flex-row-reverse justify-between w-full xl:w-auto xl:justify-start xl:flex-col items-end gap-4 xl:ml-auto"
    >
      <Value
        :value="createdAt"
      />
    </div>
  </div>
</template>
