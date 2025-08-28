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
  <div>
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
              : 'bg-[#222222] text-[#fafafa] hover:bg-[#333333]'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <KeepAlive include="ContractCode,ContractRead">
      <component :is="activeComponent" v-bind="activeProps" />
    </KeepAlive>
  </div>
  
</template>


