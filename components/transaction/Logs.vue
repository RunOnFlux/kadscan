<script setup lang="ts">
import { computed, reactive } from 'vue'
import { formatJsonPretty } from '~/composables/useString'
import { useScreenSize } from '~/composables/useScreenSize'
import Informational from '~/components/icon/Informational.vue'
import Tooltip from '~/components/Tooltip.vue'
import IconEnlarge from '~/components/icon/Enlarge.vue'

const props = defineProps<{
  transaction: any
}>()

const { isMobile } = useScreenSize()

// Text content for tooltips and labels
const textContent = {
  logsHash: { label: 'Logs Hash:', description: 'Unique identifier for the transaction logs generated during execution.' },
  qualifiedName: { label: 'Qualified Name:', description: 'The fully qualified name of the event including module namespace.' },
  eventDetails: { label: 'Event #', description: 'Event details.' },
  parameters: { label: 'Parameters:', description: 'Parameters passed to this event when it was emitted.' },
}

// Sort events by orderIndex in ascending order (0, 1, 2, ...)
const sortedEvents = computed(() => {
  if (!props.transaction?.result?.events?.edges) return []
  
  return [...props.transaction.result.events.edges].sort((a, b) => 
    a.node.orderIndex - b.node.orderIndex
  )
})

const expandedById = reactive<Record<string, boolean>>({})

function isExpanded(id: string): boolean {
  return !!expandedById[id]
}

function toggleExpand(id: string) {
  expandedById[id] = !expandedById[id]
}

function makeEventKey(edge: any, index: number): string {
  const qn = edge?.node?.qualifiedName ?? ''
  const oi = edge?.node?.orderIndex
  return `${qn}:${oi ?? index}`
}
</script>

<template>
  <div class="bg-surface-primary border border-[#222222] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5 mb-2">
    <div v-if="transaction?.result?.logs || sortedEvents.length">
      <Divide>
        <!-- Logs Hash Section -->
        <DivideItem v-if="transaction?.result?.logs">
          <LabelValue
            :label="textContent.logsHash.label"
            :description="textContent.logsHash.description"
            tooltipPos="right"
            topAlign="true"
          >
            <template #value>
              <div class="flex items-center gap-2">
                <span class="text-[#f5f5f5] text-[15px] break-all">{{ transaction.result.logs }}</span>
              </div>
            </template>
          </LabelValue>
        </DivideItem>

        <!-- Events Section -->
        <DivideItem 
          v-for="(eventEdge, index) in sortedEvents" 
          :key="makeEventKey(eventEdge, index)"
        >
          <div class="flex flex-col gap-4">

            <LabelValue
              :label="textContent.qualifiedName.label"
              :description="textContent.qualifiedName.description"
              tooltipPos="right"
              topAlign="true"
            >
              <template #value>
                <div class="flex items-center gap-2">
                  <span class="text-[#f5f5f5] text-[15px] break-all">{{ eventEdge.node.qualifiedName }}</span>
                  <Copy 
                    :value="eventEdge.node.qualifiedName" 
                    tooltipText="Copy Qualified Name"
                    iconSize="h-5 w-5"
                    buttonClass="w-5 h-5"
                  />
                </div>
              </template>
            </LabelValue>

            <LabelValue
              :label="`${textContent.eventDetails.label}${index}:`"
              :description="`${eventEdge.node.qualifiedName} ${textContent.eventDetails.description}`"
              tooltipPos="right"
              topAlign="true"
            >
              <template #value>
                <div class="flex items-center gap-2 w-full">
                  <span v-if="eventEdge.node.orderIndex !== undefined" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                    <span class="text-[#bbbbbb]">Order Indexer:</span>
                    <span class="text-[#f5f5f5] ml-1">{{ eventEdge.node.orderIndex }}</span>
                  </span>
                  <span v-if="eventEdge.node.moduleName !== undefined" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                    <span class="text-[#bbbbbb]">Module:</span>
                    <NuxtLink :to="`/module/${eventEdge.node.moduleName}`" class="text-[#6ab5db] ml-1 hover:text-[#9ccee7]">{{ eventEdge.node.moduleName }}</NuxtLink>
                  </span>
                  <span v-if="eventEdge.node.name !== undefined" class="px-2 py-1.5 rounded-md border border-[#444648] bg-[#222222] text-[11px] font-semibold flex items-center leading-none">
                    <span class="text-[#bbbbbb]">Event:</span>
                    <span class="text-[#f5f5f5] ml-1">{{ eventEdge.node.name }}</span>
                  </span>
                  <button
                    @click="toggleExpand(makeEventKey(eventEdge, index))"
                    class="ml-auto flex items-center justify-center w-8 h-8 text-[#f5f5f5] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#dadfe3] hover:text-[#000000] transition-colors active:bg-[#151515] active:text-[#f5f5f5]"
                    aria-label="Enlarge parameters"
                  >
                    <IconEnlarge class="w-4 h-4" />
                  </button>
                </div>
              </template>
            </LabelValue>

            <!-- Event Parameters Section (matching Input Data style) -->
            <div class="flex flex-col md:flex-row items-start gap-1 md:gap-0">
              <!-- Label Section (matching LabelValue styling) -->
              <div class="flex gap-2 w-full md:min-w-[300px] md:max-w-[300px]">
                <div class="flex items-center gap-2">
                  <Tooltip
                    :value="textContent.parameters.description"
                    placement="right"
                    :offset-distance="16"
                  >
                    <Informational class="w-4 h-4" />
                  </Tooltip>
                  <span class="text-[#bbbbbb] text-[15px] font-normal">
                    {{ textContent.parameters.label }}
                  </span>
                </div>
              </div>
              
              <!-- Parameters Container with proper boundaries -->
              <div class="text-[#f5f5f5] text-[15px] fix w-full md:flex-1 overflow-hidden">
                <div v-if="eventEdge.node.parameterText" class="w-full">
                  <div v-if="!isExpanded(makeEventKey(eventEdge, index))"
                    class="grid w-full text-sm text-[#bbbbbb]
                           [&>textarea]:text-inherit
                           [&>textarea]:resize-none
                           [&>textarea]:[grid-area:1/1/2/2]"
                    >
                    <textarea
                      readonly
                      :value="formatJsonPretty(eventEdge.node.parameterText)"
                      class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-sm px-[10px] py-[5px] outline-none font-mono whitespace-pre-wrap overflow-auto h-[110px] m-0"
                    ></textarea>
                  </div>
                  <div
                    v-else
                    class="grid w-full text-sm text-[#bbbbbb]
                           [&>textarea]:text-inherit
                           [&>textarea]:resize-none
                           [&>textarea]:overflow-hidden
                           [&>textarea]:[grid-area:1/1/2/2]
                           after:[grid-area:1/1/2/2]
                           after:whitespace-pre-wrap
                           after:invisible
                           after:content-[attr(data-cloned-val)_'_']
                           after:pb-2"
                    :data-cloned-val="formatJsonPretty(eventEdge.node.parameterText)"
                  >
                    <textarea
                      readonly
                      :value="formatJsonPretty(eventEdge.node.parameterText)"
                      class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-sm px-[10px] py-[5px] outline-none font-mono whitespace-pre-wrap overflow-hidden min-h-[110px]"
                    ></textarea>
                  </div>
                </div>
                <span v-else class="text-[#f5f5f5] text-xs">No parameters</span>
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