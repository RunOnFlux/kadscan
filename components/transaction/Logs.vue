<script setup lang="ts">
import { computed } from 'vue'
import { formatJsonPretty } from '~/composables/string'
import { useScreenSize } from '~/composables/useScreenSize'
import Informational from '~/components/icon/Informational.vue'

const props = defineProps<{
  transaction: any
}>()

const { isMobile } = useScreenSize()

// Sort events by orderIndex in ascending order (0, 1, 2, ...)
const sortedEvents = computed(() => {
  if (!props.transaction?.result?.events?.edges) return []
  
  return [...props.transaction.result.events.edges].sort((a, b) => 
    a.node.orderIndex - b.node.orderIndex
  )
})
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-2">
    <div v-if="transaction?.result?.logs || sortedEvents.length">
      <Divide>
        <!-- Logs Hash Section -->
        <DivideItem v-if="transaction?.result?.logs">
          <LabelValue
            :row="isMobile"
            label="Logs Hash:"
            description="Unique identifier for the transaction logs generated during execution"
            tooltipPos="right"
          >
            <template #value>
              <div class="flex items-center gap-2">
                <span class="text-[#fafafa] text-[15px] break-all">{{ transaction.result.logs }}</span>
              </div>
            </template>
          </LabelValue>
        </DivideItem>

        <!-- Events Section -->
        <DivideItem 
          v-for="(eventEdge, index) in sortedEvents" 
          :key="eventEdge.node.id"
        >
          <div class="flex flex-col gap-4">
            <LabelValue
              :label="`Event #${index}:`"
              :description="`${eventEdge.node.qualifiedName} event details`"
              tooltipPos="right"
            >
              <template #value>
                <div class="flex items-center gap-1 text-[15px]">
                  <span class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#212122] text-[11px] font-semibold flex items-center leading-none">
                    <span class="text-[#bbbbbb]">Order:</span>
                    <span class="text-[#fafafa] ml-1">{{ eventEdge.node.orderIndex }}</span>
                  </span>
                </div>
              </template>
            </LabelValue>

            <LabelValue
              :row="isMobile"
              label="Module:"
              description="The smart contract module that emitted this event"
              tooltipPos="right"
            >
              <template #value>
                <span class="text-[#fafafa] text-[15px]">{{ eventEdge.node.moduleName }}</span>
              </template>
            </LabelValue>

            <LabelValue
              :row="isMobile"
              label="Event Name:"
              description="The name of the event that was emitted"
              tooltipPos="right"
            >
              <template #value>
                <span class="text-[#fafafa] text-[15px]">{{ eventEdge.node.name }}</span>
              </template>
            </LabelValue>

            <LabelValue
              :row="isMobile"
              label="Qualified Name:"
              description="The fully qualified name of the event including module namespace"
              tooltipPos="right"
            >
              <template #value>
                <div class="flex items-center gap-2">
                  <span class="text-[#fafafa] text-[15px] break-all">{{ eventEdge.node.qualifiedName }}</span>
                  <Copy 
                    :value="eventEdge.node.qualifiedName" 
                    tooltipText="Copy Qualified Name"
                    iconSize="h-5 w-5"
                    buttonClass="w-5 h-5"
                  />
                </div>
              </template>
            </LabelValue>

            <!-- Event Parameters Section (matching Input Data style) -->
            <div class="flex flex-col md:flex-row items-start">
              <!-- Label Section (matching LabelValue styling) -->
              <div class="flex gap-2 w-full min-w-[300px] max-w-[300px]">
                <div class="flex items-center gap-2">
                  <Tooltip
                    value="Parameters passed to this event when it was emitted"
                    placement="right"
                    :offset-distance="16"
                  >
                    <Informational class="w-4 h-4" />
                  </Tooltip>
                  <span class="text-[#bbbbbb] text-[15px] font-normal">
                    Parameters:
                  </span>
                </div>
              </div>
              
              <!-- Parameters Container with proper boundaries -->
              <div class="text-[#f5f5f5] text-[15px] fix flex gap-2 flex-1 overflow-hidden">
                <div v-if="eventEdge.node.parameterText" class="w-full">
                  <textarea
                    readonly
                    :value="formatJsonPretty(eventEdge.node.parameterText)"
                    class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-[#bbbbbb] text-sm px-[10px] py-[5px] resize-none outline-none font-mono whitespace-pre-wrap overflow-auto min-h-[100px]"
                  ></textarea>
                </div>
                <span v-else class="text-[#fafafa] text-xs">No parameters</span>
              </div>
            </div>
          </div>
        </DivideItem>
      </Divide>
    </div>
    <div v-else class="text-center py-8 text-[#bbbbbb]">
      No events or logs found for this transaction
    </div>
  </div>
</template>

<style>
.fix {
  overflow-wrap: anywhere
}
</style> 