<script setup lang="ts">
import { ref, computed } from 'vue'
import ContractCode from '~/components/module/ContractCode.vue'
import ContractRead from '~/components/module/ContractRead.vue'
import { useContractPact } from '~/composables/useContractPact'
import type { PactModuleInfo } from '~/composables/useContractPact'

defineOptions({ name: 'ContractView' })

const props = defineProps<{
  modulename: string
  chain?: string | number | undefined
  moduleInfo?: PactModuleInfo | null
  loading?: boolean
  error?: any
}>()

const activeTab = ref<'code' | 'read'>('code')

const tabs = computed(() => [
  { id: 'code', label: 'Code' },
  { id: 'read', label: 'Interact' },
])

const activeComponent = computed(() => {
  return activeTab.value === 'code' ? ContractCode : ContractRead
})

// Fetch pact info here only if not provided by parent
const usingExternal = props.moduleInfo !== undefined || props.loading !== undefined || props.error !== undefined
let loadingRef = ref(false)
let errorRef = ref<any>(null)
let moduleInfoRef = ref<PactModuleInfo | null>(null)
if (!usingExternal) {
  const hook = useContractPact(computed(() => props.modulename), computed(() => props.chain))
  loadingRef = hook.loading
  errorRef = hook.error
  moduleInfoRef = hook.moduleInfo
}

const effectiveLoading = computed(() => (props.loading ?? loadingRef.value))
const effectiveError = computed(() => (props.error ?? errorRef.value))
const effectiveModuleInfo = computed(() => (props.moduleInfo ?? moduleInfoRef.value))

const activeProps = computed(() => ({ modulename: props.modulename, chain: props.chain, moduleInfo: effectiveModuleInfo.value, loading: effectiveLoading.value, error: effectiveError.value }))
</script>

<template>
  <div class="bg-surface-primary border border-line-default rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5">
    <div class="flex items-center justify-between mb-4 overflow-x-auto">
      <div class="flex items-center gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id as any"
          :class="[
            'px-3 py-1 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap relative',
            activeTab === tab.id
              ? 'bg-accent-strong text-font-primary'
              : 'bg-surface-hover text-font-primary hover:bg-[#333333]'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Content stays mounted; toggle visibility only -->
    <KeepAlive include="ContractCode,ContractRead">
      <div>
        <ContractCode v-bind="activeProps" v-show="activeTab === 'code'" />
        <ContractRead v-bind="activeProps" v-show="activeTab === 'read'" />
      </div>
    </KeepAlive>
  </div>
  
</template>


