<script setup lang="ts">
import CloseIcon from '~/components/icon/Close.vue';
import CustomizeRadio from '~/components/customize/Radio.vue';
import { useCustomCardSettings, type CardType } from '~/composables/useCustomCardSettings';

const props = defineProps<{
  isOpen: boolean;
  cardType: CardType;
}>();

const emit = defineEmits(['close']);

const { getPreset } = useCustomCardSettings();
const cardPreset = computed(() => getPreset(props.cardType));

const selectedPreset = ref('');

function closeModal() {
  emit('close');
}

function saveChanges() {
  cardPreset.value.value = selectedPreset.value;
  closeModal();
}

const blockPresets = [
  { value: 'latest-blocks', label: 'Latest Blocks' },
];

const transactionPresets = [
  { value: 'latest-transactions', label: 'Latest Transactions' },
  { value: 'latest-coinbase-transactions', label: 'Latest Coinbase Transactions' },
];

const presets = computed(() => {
  return props.cardType === 'blocks' ? blockPresets : transactionPresets;
});

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedPreset.value = cardPreset.value.value;
  }
});
</script>

<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[998] bg-black bg-opacity-50"
        @click="closeModal"
      />
    </transition>

    <transition name="slide-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[999] flex items-start justify-center pt-[30px]"
        @click="closeModal"
      >
        <div
          class="bg-[#111111] border border-gray-700 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
          @click.stop
        >
          <div class="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 class="text-[15px] font-semibold text-white">
              Custom Card
            </h2>
            <button @click="closeModal">
              <CloseIcon class="w-6 h-6 text-[#888888]" />
            </button>
          </div>

          <div class="p-4">
            <p class="mb-4 text-sm text-[#f5f5f5]">
              Customize this card by selecting one of the options below.
            </p>

            <div class="space-y-4">
              <div>
                <h3 class="mb-3 text-xs tracking-wider text-[#b8b8b8] uppercase">
                  Preset
                </h3>
                <div class="flex flex-wrap gap-4">
                  <CustomizeRadio
                    v-for="preset in presets"
                    :key="preset.value"
                    v-model="selectedPreset"
                    :value="preset.value"
                    :label="preset.label"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 p-4 bg-[#151515] border-t border-gray-700">
            <button
              class="px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-[#252525] hover:text-[#f5f5f5]"
              @click="closeModal"
            >
              Close
            </button>
            <button
              class="px-3 py-2 text-sm text-white bg-[#0784c3] rounded-lg hover:bg-[#0670a6]"
              @click="saveChanges"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style>
.fade-enter-active {
  transition: opacity 0.3s ease;
}
.fade-leave-active {
  transition: opacity 0.4s ease;
  transition-delay: 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.4s ease-out;
  transition-delay: 0.2s;
}
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-40px);
  opacity: 0;
}
</style> 