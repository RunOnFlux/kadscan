<script setup lang="ts">
defineOptions({ name: 'ContractEvents' })

const props = defineProps<{
  contract?: string
}>()

const loading = ref(false)
const events = ref<Array<any>>([])
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-2">
    <div v-if="loading" class="text-center py-8 text-[#bbbbbb]">Loading...</div>
    <div v-else>
      <div v-if="events.length === 0" class="text-center py-8 text-[#bbbbbb]">
        No events found for this contract
      </div>
      <div v-else>
        <!-- Events list (mock) -->
        <div v-for="(ev, idx) in events" :key="idx" class="mb-4">
          <div class="text-[#fafafa] text-[15px] font-mono break-all">{{ ev.qualifiedName }}</div>
          <textarea
            readonly
            :value="ev.parameterText"
            class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-[#bbbbbb] text-sm px-[10px] py-[5px] resize-none outline-none font-mono whitespace-pre-wrap overflow-auto min-h-[100px] mt-2"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>


