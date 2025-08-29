<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useContractPact } from '~/composables/useContractPact'
import { useContractPactParser } from '~/composables/useContractPactParser'
import { useContractPactRead } from '~/composables/useContractPactRead'
import Code from '~/components/Code.vue'

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
        <h2 class="text-[15px] text-normal text-[#f5f5f5]">Read Contract</h2>
        <p class="text-[13px] text-[#bbbbbb]">Call read-only functions</p>
      </div>
    </div>

    <div v-if="loadingModule" class="text-[#bbbbbb] text-sm">Loading module...</div>
    <div v-else>
      <div class="flex items-center gap-2 mb-3 overflow-x-auto">
        <button
          v-for="fn in readFunctions"
          :key="fn.name"
          @click="selected = fn.name"
          :class="[
            'px-3 py-1 rounded-lg text-[13px] transition-colors whitespace-nowrap',
            selected === fn.name ? 'bg-[#009367] text-[#fafafa]' : 'bg-[#252525] text-[#fafafa] hover:bg-[#333333]'
          ]"
        >
          {{ fn.name }}
        </button>
      </div>

      <div v-if="selectedFn" class="space-y-3">
        <div class="grid md:grid-cols-2 gap-3">
          <div v-for="p in selectedFn.params" :key="p.name" class="space-y-1">
            <div class="text-[12px] text-[#bbbbbb]">
              {{ p.name }}<span v-if="p.type" class="text-[#888888]">: {{ p.type }}</span>
            </div>
            <input
              v-model="paramValues[p.name]"
              class="w-full bg-[#151515] border border-[#222222] rounded-md text-[#bbbbbb] text-sm px-2 py-1 outline-none font-mono"
              placeholder='Enter Pact literal (eg "k:addr", 1.0, true, {"k":1})'
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="onCall"
            class="px-3 py-1 rounded-lg bg-[#009367] text-[#fafafa] text-[14px]"
            :disabled="loading"
          >
            {{ 'Query' }}
          </button>
        </div>

        <div class="space-y-2">
          <div class="text-[13px] text-[#bbbbbb]">Result</div>
          <Code :value="result" />
          <div v-if="error" class="text-[#ffaaaa] text-[12px]">Error: {{ String(error) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>


