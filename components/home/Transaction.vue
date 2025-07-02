<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { computed, ref, onMounted, onUnmounted } from 'vue';
import Tooltip from '../Tooltip.vue';
import { shortenString, shortenAddress } from '~/composables/string';

const props = defineProps<{
  hash: string;
  sender: string;
  chainId: number;
  createdAt: string;
  fee: number;
}>()

const now = ref(new Date());
let interval: any;

onMounted(() => {
  interval = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(interval);
});

const timeAgo = computed(() => {
  const time = now.value;
  return formatDistanceToNowStrict(new Date(props.createdAt), { addSuffix: true });
});

</script>

<template>
  <div class="flex items-center justify-between px-6 py-4 border-b border-gray-700">
    <div class="flex items-center w-1/3 gap-4">
      <div class="bg-[#151515] rounded-md p-3">
        <svg fill="#b0b0b0" height="24px" width="24px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 490 490" xml:space="preserve">
          <g>
            <path d="M481.8,245c-20.8,45.4-53.7,83.9-94.8,111.9c-4.9,3.4-11.2,2.4-15-2.6l-23.7-32c-3.6-4.9-2.9-11.5,1.5-15.4
              c31.1-27.8,55.3-62,69.5-99.8c2.4-6.4-2.1-13.3-8.5-15.7L254.9,9.8c-6.4-2.4-13.3,2.1-15.7,8.5c-11.9,31.7-11.9,66.3,0,98
              c2.4,6.4,9.2,9.9,15.7,7.5l29.4-11.3c6.4-2.4,9.9-9.2,7.5-15.7c-7.1-18.9-7.1-39.7,0-58.5l10.9,28.9c2.4,6.4,9.2,9.9,15.7,7.5
              L481,133.5c6.4,2.4,9.9,9.2,7.5,15.7C486.2,157,485,165.2,481.8,245z"/>
            <path d="M235.1,380.4c-6.4-2.4-9.9-9.2-7.5-15.7c7.1-18.9,7.1-39.7,0-58.5l-10.9,28.9c-2.4,6.4-9.2,9.9-15.7,7.5L8.2,356.5
              c-6.4-2.4-9.9-9.2-7.5-15.7c2.4-8,3.6-83.2,0-153.2c-20.8-45.4-53.7-83.9-94.8-111.9c-4.9-3.4-11.2-2.4-15,2.6l-23.7,32
              c-3.6,4.9-2.9-11.5,1.5,15.4c31.1,27.8,55.3,62,69.5,99.8c2.4,6.4-2.1,13.3-8.5,15.7l-155.9,59.6c-6.4,2.4-13.3-2.1-15.7-8.5
              c-11.9-31.7-11.9-66.3,0-98c2.4-6.4,9.2-9.9,15.7-7.5l29.4,11.3c6.4,2.4,9.9,9.2,7.5,15.7c-7.1-18.9-7.1-39.7,0,58.5
              l10.9-28.9c2.4-6.4,9.2-9.9,15.7-7.5L211,243.5c6.4,2.4,9.9,9.2,7.5,15.7c-2.4,8-3.6,83.2,0,153.2
              C210.3,457.8,211.5,466,208.2,474z"/>
          </g>
        </svg>
      </div>
      <div>
        <NuxtLink :to="`/transactions/${props.hash}`" class="text-[#6ab5db] hover:text-[#9ccee7]">
          {{ shortenString(props.hash) }}
        </NuxtLink>
        <div class="text-xs text-[#bbbbbb]">{{ timeAgo }}</div>
      </div>
    </div>

    <div class="flex items-center justify-between w-1/3">
      <div class="text-sm text-left">
          <div class="text-[#f5f5f5]">
            Sender: {{ shortenAddress(props.sender) }}
          </div>
        <div>
          <div class="text-[#6ab5db] hover:text-[#9ccee7]">
            Chain: {{ props.chainId }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end w-1/3">
      <Tooltip value="Transaction Fee">
        <div class="hidden sm:block text-[11px] text-[#f5f5f5] border border-gray-600 bg-transparent rounded-md px-2 py-1">
          {{ props.fee.toFixed(8) }} KDA
        </div>
      </Tooltip>
    </div>
  </div>
</template>
