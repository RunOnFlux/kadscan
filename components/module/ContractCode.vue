<script setup lang="ts">
import IconDownload from '~/components/icon/Download.vue'
import IconCopy from '~/components/icon/Copy.vue'
import IconEnlarge from '~/components/icon/Enlarge.vue'
import { useContractPact } from '~/composables/useContractPact'
import type { PactModuleInfo } from '~/composables/useContractPact'
import { ref, computed, watch, defineAsyncComponent } from 'vue'
const editorOptions = {
  readOnly: true,
  minimap: { enabled: true },
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  contextmenu: false,
}
const MonacoEditor = process.client
  ? defineAsyncComponent(() => import('monaco-editor-vue3'))
  : undefined

defineOptions({ name: 'ContractCode' })

const props = defineProps<{
  modulename?: string
  contract?: string
  token?: string
  chain?: string | number
  moduleInfo?: PactModuleInfo | null
  loading?: boolean
  error?: any
}>()

const moduleName = computed(() => (props.modulename || props.contract || props.token || '').trim())

// Use external data when provided to avoid duplicate fetching
const usingExternal = props.moduleInfo !== undefined || props.loading !== undefined || props.error !== undefined

let internalLoading = ref(false)
let internalError = ref<any>(null)
let internalModuleInfo = ref<PactModuleInfo | null>(null)

if (!usingExternal) {
  const hook = useContractPact(moduleName as any, computed(() => props.chain))
  internalLoading = hook.loading
  internalError = hook.error
  internalModuleInfo = hook.moduleInfo
}

const effectiveLoading = computed(() => (props.loading ?? internalLoading.value))
const effectiveError = computed(() => (props.error ?? internalError.value))
const effectiveModuleInfo = computed(() => (props.moduleInfo ?? internalModuleInfo.value))

const codeContent = ref<string>('')
watch(effectiveModuleInfo, (m) => {
  codeContent.value = (m?.code || '').trim() || ';; No code available or module not found'
}, { immediate: true })
const isEnlarged = ref(false)

function onCopy() {
  navigator.clipboard?.writeText(codeContent.value)
}

function onDownload() {
  const blob = new Blob([codeContent.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(props.contract || props.token || 'contract')}.pact`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function toggleEnlarge() {
  isEnlarged.value = !isEnlarged.value
}

// Extract `@doc "..."` content and top-level declaration details
function decodePactString(raw: string): string {
  // Basic unescape for common sequences used inside Pact strings
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

type DeclarationInfo = {
  type: 'Module' | 'Interface'
  name: string
  capability?: string
}

const docString = computed<string | null>(() => {
  const code = codeContent.value
  if (!code) return null
  // Supports multi-line and escaped quotes
  const match = code.match(/@doc\s+"((?:[^"\\]|\\.)*)"/s)
  if (!match) return null
  return decodePactString(match[1]).trim() || null
})

const declarationInfo = computed<DeclarationInfo | null>(() => {
  const code = codeContent.value
  if (!code) return null
  // Capture: (module|interface) <name> <capability?>  — capability is optional
  const match = code.match(/\(\s*(module|interface)\s+([^\s()]+)(?:\s+([^\s()]+))?/i)
  if (!match) return null
  const type = match[1].toLowerCase() === 'interface' ? 'Interface' : 'Module'
  const name = match[2]
  const capability = match[3]
  return { type, name, capability }
})
</script>

<template>
  <div>
    <div class="mb-4">
      <div class="divide-y divide-[#222222]">
        <div class="pb-3 md:pb-4">
          <h2 class="text-[15px] text-normal text-font-primary">Contract Code</h2>
          <p class="text-[13px] text-font-secondary">Pact source code of the module</p>
        </div>
        <div class="pt-3 md:pt-4 flex flex-col gap-2">
          <p v-if="docString" class="text-[15px] text-font-primary">{{ docString }}</p>
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div v-if="declarationInfo" class="flex flex-wrap gap-2">
            <span v-if="declarationInfo?.type" class="px-2 py-1.5 rounded-md border border-[#444648] bg-surface-secondary text-[11px] font-semibold flex items-center leading-none">
              <span class="text-font-secondary">Type:</span>
              <span class="text-font-primary ml-1">{{ declarationInfo?.type }}</span>
            </span>
            <span v-if="(declarationInfo?.name || moduleInfo?.name)" class="px-2 py-1.5 rounded-md border border-[#444648] bg-surface-secondary text-[11px] font-semibold flex items-center leading-none">
              <span class="text-font-secondary">Module Name:</span>
              <span class="text-font-primary ml-1">{{ declarationInfo?.name || effectiveModuleInfo?.name }}</span>
            </span>
            <span v-if="declarationInfo?.capability" class="px-2 py-1.5 rounded-md border border-[#444648] bg-surface-secondary text-[11px] font-semibold flex items-center leading-none">
              <span class="text-font-secondary">Capability:</span>
              <span class="text-font-primary ml-1">{{ declarationInfo?.capability }}</span>
            </span>
            </div>
            <div v-if="!effectiveLoading && !effectiveError" class="flex items-center gap-2 w-full md:w-fit justify-end mt-2 md:mt-0">
            <button
              @click="onDownload"
              class="flex items-center justify-center w-8 h-8 text-font-primary bg-surface-disabled border border-[#222222] rounded-md hover:bg-[#dadfe3] hover:text-[#000000] transition-colors active:bg-surface-disabled active:text-font-primary"
              aria-label="Download code"
            >
              <IconDownload class="w-4 h-4" />
            </button>
            <button
              @click="onCopy"
              class="flex items-center justify-center w-8 h-8 text-font-primary bg-surface-disabled border border-[#222222] rounded-md hover:bg-[#dadfe3] hover:text-[#000000] transition-colors active:bg-surface-disabled active:text-font-primary"
              aria-label="Copy code"
            >
              <IconCopy class="w-4 h-4" />
            </button>
            <button
              @click="toggleEnlarge"
              class="flex items-center justify-center w-8 h-8 text-font-primary bg-surface-disabled border border-[#222222] rounded-md hover:bg-[#dadfe3] hover:text-[#000000] transition-colors active:bg-surface-disabled active:text-font-primary"
              aria-label="Enlarge editor"
            >
              <IconEnlarge class="w-4 h-4" />
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="effectiveLoading" class="w-full bg-surface-disabled border border-[#222222] rounded-lg px-[10px] py-[40px]">
      <div class="flex items-center justify-center">
        <div class="h-8 w-8 rounded-full border-2 border-[#333333] border-t-[#009367] animate-spin"></div>
      </div>
    </div>

    <div v-else-if="effectiveError" class="w-full bg-surface-disabled border border-[#402222] rounded-lg text-[#ffaaaa] text-sm px-[10px] py-[10px] font-mono">
      Failed to load module code
    </div>

    <ClientOnly v-else>
      <div
        class="w-full bg-surface-disabled border border-[#222222] rounded-lg text-font-secondary text-sm overflow-auto resize-y"
        :style="{ height: (isEnlarged ? 700 : 500) + 'px' }"
        @contextmenu.prevent
      >
        <component
          :is="MonacoEditor"
          v-model:value="codeContent"
          language="pact"
          theme="vs-dark"
          :options="editorOptions"
          @editorWillMount="async (m:any) => {
            try {
              const mod = await import('~/syntaxes/pact-language')
              m.languages.register({ id: 'pact' })
              m.languages.setMonarchTokensProvider('pact', mod.pactLanguage)
            } catch (e) { /* noop */ }
          }"
          :height="'100%'"
          :width="'100%'"
        />
      </div>
    </ClientOnly>
  </div>
</template>


