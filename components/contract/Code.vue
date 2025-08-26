<script setup lang="ts">
import IconDownload from '~/components/icon/Download.vue'
import IconCopy from '~/components/icon/Copy.vue'
import IconEnlarge from '~/components/icon/Enlarge.vue'

defineOptions({ name: 'ContractCode' })

const props = defineProps<{
  contract?: string
  token?: string
}>()

const codeContent = ref<string>(';; Coming soon...')
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
</script>

<template>
  <div class="bg-[#111111] border border-[#222222] rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.0625)] p-4">
    <div class="flex flex-col md:flex-row gap-y-2 justify-between items-start md:items-center mb-4">
      <div>
        <h2 class="text-[15px] text-normal text-[#f5f5f5]">Contract Code</h2>
        <p class="text-[13px] text-[#bbbbbb]">Pact source code of the module</p>
      </div>
      <div class="flex items-center gap-2 w-full md:w-fit justify-end">
        <button
          @click="onDownload"
          class="flex items-center justify-center w-8 h-8 text-[#fafafa] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525]"
          aria-label="Download code"
        >
          <IconDownload class="w-4 h-4 text-[#bbbbbb]" />
        </button>
        <button
          @click="onCopy"
          class="flex items-center justify-center w-8 h-8 text-[#fafafa] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525]"
          aria-label="Copy code"
        >
          <IconCopy class="w-4 h-4 text-[#bbbbbb]" />
        </button>
        <button
          @click="toggleEnlarge"
          class="flex items-center justify-center w-8 h-8 text-[#fafafa] bg-[#151515] border border-[#222222] rounded-md hover:bg-[#252525]"
          aria-label="Enlarge editor"
        >
          <IconEnlarge class="w-4 h-4 text-[#bbbbbb]" />
        </button>
      </div>
    </div>

    <textarea
      v-model="codeContent"
      class="w-full bg-[#151515] border border-[#222222] rounded-lg text-[#bbbbbb] text-sm px-[10px] py-[10px] outline-none font-mono whitespace-pre resize-y overflow-auto"
      :class="isEnlarged ? 'min-h-[700px]' : 'min-h-[300px]'"
    />
  </div>
</template>


