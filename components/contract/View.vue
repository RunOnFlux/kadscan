<script setup lang="ts">
import { ref, computed } from 'vue'
import ContractCode from '~/components/contract/Code.vue'
import ContractRead from '~/components/contract/Read.vue'

defineOptions({ name: 'ContractView' })

const props = defineProps<{
  modulename: string
  chain?: string | number | undefined
}>()

const activeTab = ref<'code' | 'read'>('code')

const tabs = computed(() => [
  { id: 'code', label: 'Code' },
  { id: 'read', label: 'Read Contract' },
])

const activeComponent = computed(() => {
  return activeTab.value === 'code' ? ContractCode : ContractRead
})

const activeProps = computed(() => ({ modulename: props.modulename, chain: props.chain }))
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-5">
    <div class="flex items-center justify-between mb-4 overflow-x-auto">
      <div class="flex items-center gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id as any"
          :class="[
            'px-3 py-1 rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap relative',
            activeTab === tab.id
              ? 'bg-[#009367] text-[#fafafa]'
              : 'bg-[#252525] text-[#fafafa] hover:bg-[#333333]'
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


