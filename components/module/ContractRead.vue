<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useContractPact } from '~/composables/useContractPact'
import { useContractPactParser } from '~/composables/useContractPactParser'
import { useContractPactRead } from '~/composables/useContractPactRead'
import { formatJsonPretty } from '~/composables/string'
import IconEnlarge from '~/components/icon/Enlarge.vue'

defineOptions({ name: 'ContractRead' })

const props = defineProps<{
  modulename: string
  chain?: string | number | undefined
}>()

const moduleName = computed(() => (props.modulename || '').trim())
const { moduleInfo, loading: loadingModule } = useContractPact(moduleName as any, computed(() => props.chain))
const { functions } = useContractPactParser(computed(() => moduleInfo.value?.code || ''))

// Heuristic: consider only lowercase/underscore names as read functions (no defpact/defcap here)
const readFunctions = computed(() => functions.value.filter(f => /^[a-z0-9_\-]+$/.test(f.name)))

const selected = ref<string>('')
watch(readFunctions, (list) => {
  selected.value = list[0]?.name || ''
}, { immediate: true })

const selectedFn = computed(() => readFunctions.value.find(f => f.name === selected.value))
const paramValues = ref<Record<string, string>>({})
watch(selectedFn, (fn) => {
  const seed: Record<string, string> = {}
  fn?.params.forEach(p => { seed[p.name] = '' })
  paramValues.value = seed
}, { immediate: true })

const { loading, error, result, call } = useContractPactRead()
const resultExpanded = ref(false)

async function onCall() {
  if (!selectedFn.value) return
  const args = selectedFn.value.params.map(p => paramValues.value[p.name])
  await call(moduleName as any, selectedFn.value.name, args, props.chain)
}
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row gap-y-2 justify-between items-start md:items-center mb-4">
      <div>
        <h2 class="text-[15px] text-normal text-[#f5f5f5]">Interact with this Contract</h2>
        <p class="text-[13px] text-[#bbbbbb]">Call read-only functions.</p>
      </div>
    </div>

    <div v-if="loadingModule" class="text-[#bbbbbb] text-sm">Loading module...</div>
    <div v-else>
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Left column: functions, inputs, query -->
        <div class="w-[600px] shrink-0">
          <div class="text-[13px] text-[#bbbbbb] mb-2">Functions</div>
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <button
              v-for="fn in readFunctions"
              :key="fn.name"
              @click="selected = fn.name"
              :class="[
                'px-3 py-1 rounded-lg text-[13px] transition-colors whitespace-nowrap overflow-hidden text-ellipsis',
                selected === fn.name ? 'bg-[#009367] text-[#f5f5f5]' : 'bg-[#252525] text-[#f5f5f5] hover:bg-[#333333]'
              ]"
            >
              {{ fn.name }}
            </button>
          </div>

          <div v-if="selectedFn" class="space-y-3">
            <div class="grid grid-cols-1 gap-3 w-[600px]">
              <div v-for="p in selectedFn.params" :key="p.name" class="space-y-1 w-[600px]">
                <div class="text-[12px] text-[#bbbbbb] whitespace-normal break-words">
                  {{ p.name }}<span v-if="p.type" class="text-[#888888]">: {{ p.type }}</span>
                </div>
                <input
                  v-model="paramValues[p.name]"
                  class="w-[600px] bg-[#151515] border border-[#222222] rounded-md text-[#bbbbbb] text-sm px-2 py-1 outline-none font-mono"
                  placeholder='Enter Pact literal (eg "k:addr", 1.0, true, {"k":1})'
                />
              </div>
            </div>

          </div>
        </div>

        <!-- Right column: result (stacks below on mobile) -->
        <div class="flex-1 min-w-0" v-if="selectedFn">
          <div class="space-y-2">
            <div class="text-[13px] text-[#bbbbbb]">Result</div>
            <div class="flex items-center justify-between">
              <div>
                <button
                  @click="onCall"
                  class="px-3 py-1 rounded-lg bg-[#009367] text-[#f5f5f5] text-[13px]"
                  :disabled="loading"
                >
                  {{ 'Query' }}
                </button>
              </div>
              <button
                @click="resultExpanded = !resultExpanded"
                class="flex items-center justify-center w-8 h-8 text-[#f5f5f5] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#dadfe3] hover:text-[#000000] transition-colors active:bg-[#151515] active:text-[#f5f5f5]"
                aria-label="Toggle result size"
                :title="resultExpanded ? 'Collapse' : 'Expand'"
              >
                <IconEnlarge class="w-4 h-4" />
              </button>
            </div>
            <div class="text-[#f5f5f5] text-[15px] fix w-full md:flex-1 overflow-hidden">
              <div v-if="!resultExpanded"
                class="grid w-full text-sm text-[#bbbbbb]
                       [&>textarea]:text-inherit
                       [&>textarea]:resize-none
                       [&>textarea]:[grid-area:1/1/2/2]"
              >
                <textarea
                  readonly
                  :value="formatJsonPretty(result)"
                  class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-sm px-[10px] py-[5px] outline-none font-mono whitespace-pre-wrap overflow-auto h-[40px] m-0"
                ></textarea>
              </div>
              <div v-else
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
                :data-cloned-val="formatJsonPretty(result)"
              >
                <textarea
                  readonly
                  :value="formatJsonPretty(result)"
                  class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-sm px-[10px] py-[5px] outline-none font-mono whitespace-pre-wrap overflow-hidden min-h-[200px]"
                ></textarea>
              </div>
            </div>
            <div v-if="error" class="text-[#ffaaaa] text-[12px]">Error: {{ String(error) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.fix {
  overflow-wrap: anywhere
}
</style>
