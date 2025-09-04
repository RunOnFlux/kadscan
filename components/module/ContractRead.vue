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

// Chain display helpers
const chainDisplay = computed(() => (props.chain ?? '') + '')
const chainUpperLabel = computed(() => (chainDisplay.value ? `CHAIN ${chainDisplay.value}` : ''))
const resultLabel = computed(() => (chainDisplay.value ? `Results shown on ${chainUpperLabel.value}` : 'Result'))

// Heuristic: consider only lowercase/underscore names as read functions (no defpact/defcap here)
const readFunctions = computed(() => functions.value.filter(f => /^[a-z0-9_\-]+$/.test(f.name)))

const selected = ref<string>('')
watch(readFunctions, (list) => {
  selected.value = list[0]?.name || ''
}, { immediate: true })

const selectedFn = computed(() => readFunctions.value.find(f => f.name === selected.value))
const valuesByFunction = ref<Record<string, Record<string, string>>>({})
const paramValues = ref<Record<string, string>>({})
watch(selectedFn, (fn, prevFn) => {
  if (prevFn) {
    // save current values before switching away
    valuesByFunction.value[prevFn.name] = { ...paramValues.value }
  }
  const seed: Record<string, string> = {}
  const cached = fn ? valuesByFunction.value[fn.name] : undefined
  fn?.params.forEach(p => { seed[p.name] = cached?.[p.name] ?? '' })
  paramValues.value = seed
}, { immediate: true })

// Clear cache when the list of functions changes (e.g., module changed)
watch(readFunctions, () => { valuesByFunction.value = {} })

const { loading, error, result, call } = useContractPactRead()
const resultExpanded = ref(false)
const hasQueried = ref(false)

async function onCall() {
  if (!selectedFn.value) return
  const args = selectedFn.value.params.map(p => paramValues.value[p.name])
  hasQueried.value = false
  await call(moduleName as any, selectedFn.value.name, args, props.chain)
  hasQueried.value = true
}

// Autosize directive for wrapping, single-line-to-multiline inputs
function autosize(el: HTMLTextAreaElement) {
  if (!el) return
  el.style.overflow = 'hidden'
  el.style.height = 'auto'
  const cs = window.getComputedStyle(el)
  const line = parseFloat(cs.lineHeight || '20')
  const pt = parseFloat(cs.paddingTop || '0')
  const pb = parseFloat(cs.paddingBottom || '0')
  const bt = parseFloat(cs.borderTopWidth || '0')
  const bb = parseFloat(cs.borderBottomWidth || '0')
  const singleLineH = line + pt + pb + bt + bb
  const contentH = el.scrollHeight
  el.style.minHeight = contentH > singleLineH + 1 ? '110px' : '25px'
  el.style.height = Math.max(contentH, parseFloat(el.style.minHeight)) + 'px'
}

const vAutosize = {
  mounted(el: HTMLTextAreaElement) {
    const handler = () => autosize(el)
    ;(el as any)._autosizeHandler = handler
    el.addEventListener('input', handler)
    // initialize next frame to allow layout
    requestAnimationFrame(handler)
  },
  updated(el: HTMLTextAreaElement) {
    requestAnimationFrame(() => autosize(el))
  },
  unmounted(el: HTMLTextAreaElement) {
    const h = (el as any)._autosizeHandler
    if (h) el.removeEventListener('input', h)
    delete (el as any)._autosizeHandler
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row gap-y-2 justify-between items-start md:items-center mb-4">
      <div>
        <h2 class="text-[15px] text-normal text-[#f5f5f5]">Interacting with this Contract<span v-if="chainDisplay"> on chain {{ chainDisplay }}</span></h2>
        <p class="text-[13px] text-[#bbbbbb]">Call read-only functions of this module.</p>
      </div>
    </div>

    <div v-if="loadingModule" class="text-[#bbbbbb] text-sm">Loading module...</div>
    <div v-else>
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Left column: functions, inputs, query -->
        <div class="w-full md:flex-1 md:min-w-0">
          <div class="text-[13px] text-[#bbbbbb] mb-2">Functions</div>
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <button
              v-for="fn in readFunctions"
              :key="fn.name"
              @click="selected = fn.name"
              :class="[
                'px-3 py-1 rounded-lg text-[13px] transition-colors whitespace-normal break-words text-left max-w-full',
                selected === fn.name ? 'bg-[#009367] text-[#f5f5f5]' : 'bg-[#252525] text-[#f5f5f5] hover:bg-[#333333]'
              ]"
            >
              {{ fn.name }}
            </button>
          </div>

          <div v-if="selectedFn" class="space-y-3">
            <div class="grid grid-cols-1 gap-3 w-full">
              <div v-for="p in selectedFn.params" :key="p.name" class="space-y-1 w-full">
                <div class="text-[12px] text-[#bbbbbb] whitespace-normal break-words">
                  {{ p.name }}<span v-if="p.type" class="text-[#888888]">: {{ p.type }}</span>
                </div>
                <div class="w-full text-sm text-[#bbbbbb]">
                  <textarea
                    v-model="paramValues[p.name]"
                    v-autosize
                    rows="1"
                    class="w-full bg-[#151515] border border-[#222222] rounded-md text-[#bbbbbb] text-sm px-2 py-1 outline-none font-mono whitespace-pre-wrap break-words overflow-hidden resize-none"
                    placeholder='Enter Pact literal (eg "k:addr", 1.0, true, {"k":1})'
                    data-gramm="false"
                    data-gramm_editor="false"
                    spellcheck="false"
                    style="min-height:25px;height:auto"
                  ></textarea>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Right column: result (stacks below on mobile) -->
        <div class="flex-1 min-w-0" v-if="selectedFn">
          <div class="space-y-2">
            <div class="text-[13px] text-[#bbbbbb]">{{ resultLabel }}</div>
            <div class="flex items-center justify-between">
              <div>
                <button
                  @click="onCall"
                  class="px-3 py-1 rounded-lg bg-[#009367] text-[#f5f5f5] text-[13px] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  :disabled="loading"
                >
                  <svg v-if="loading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  {{ loading ? 'Querying…' : 'Query' }}
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
              <div v-if="loading" class="w-full">
                <div class="relative overflow-hidden rounded-lg border border-[#222222] bg-[#151515] h-[110px] md:h-[120px]">
                  <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent animate-shimmer"></div>
                </div>
              </div>
              <div v-else-if="!resultExpanded"
                class="grid w-full text-sm text-[#bbbbbb]
                       [&>textarea]:text-inherit
                       [&>textarea]:resize-none
                       [&>textarea]:[grid-area:1/1/2/2]"
              >
                <textarea
                  readonly
                  :value="error ? 'Error: ' + String(error) : result === null && hasQueried ? 'No result returned for this query.' : formatJsonPretty(result)"
                  class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-sm px-[10px] py-[5px] outline-none font-mono whitespace-pre-wrap overflow-auto h-[110px] m-0"
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
                :data-cloned-val="error ? 'Error: ' + String(error) : result === null && hasQueried ? 'No result returned for this query.' : formatJsonPretty(result)"
              >
                <textarea
                  readonly
                  :value="error ? 'Error: ' + String(error) : result === null && hasQueried ? 'No result returned for this query.' : formatJsonPretty(result)"
                  class="break-all w-full bg-[#151515] border border-[#222222] rounded-lg text-sm px-[10px] py-[5px] outline-none font-mono whitespace-pre-wrap overflow-hidden min-h-[200px]"
                ></textarea>
              </div>
            </div>
            <div v-if="error" class="text-[#ffaaaa] text-[12px]">Request failed. Please verify your inputs and try again.</div>
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
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
.animate-shimmer {
  animation: shimmer 1.2s infinite;
}
</style>
