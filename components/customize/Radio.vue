<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  value: string;
  label: string;
}>();

const emit = defineEmits(['update:modelValue']);

const isChecked = computed(() => props.modelValue === props.value);

function select() {
  emit('update:modelValue', props.value);
}
</script>

<template>
  <label
    class="flex items-center gap-2 px-2 py-1 text-sm border rounded-lg cursor-pointer border-gray-700"
    @click="select"
  >
    <div
      class="w-4 h-4 border-2 rounded-full flex items-center justify-center"
      :class="isChecked ? 'border-[#009367]' : 'border-gray-500'"
    >
      <div
        v-if="isChecked"
        class="w-2 h-2 bg-[#009367] rounded-full"
      />
    </div>
    <span
      class="text-sm text-[#b8b8b8]"
    >
      {{ label }}
    </span>
  </label>
</template> 