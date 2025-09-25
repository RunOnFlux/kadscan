<script setup lang="ts">
const props = defineProps<{
  name: string,
  chainsCount: number,
  allChains: boolean,
  onRecordHistory?: (q: string, type?: string|null) => void,
}>()

const router = useRouter();
const goToModule = async () => {
  if (props.onRecordHistory) props.onRecordHistory(props.name, 'module')
  await router.push(`/module/${props.name}`)
}
</script>

<template>
  <button
    type="button"
    class="py-3 px-2 flex gap-2 hover:bg-[#222222] hover:rounded-md w-full text-left"
    @click.prevent="goToModule"
  >
    <IconStatus
      status="success"
      class="mb-auto w-[28px] h-[28px]"
    />

    <div class="flex flex-col truncate flex-1">
      <span class="text-[#f5f5f5] text-sm truncate block">
        {{ name }}
      </span>
      <span class="text-[#939393] text-xs">
        {{ allChains ? 'All chains' : `Available on ${chainsCount} chain${chainsCount === 1 ? '' : 's'}` }}
      </span>
    </div>
  </button>
</template>


