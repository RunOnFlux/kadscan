<script setup lang="ts">
import CloseIcon from '~/components/icon/Close.vue'
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean;
  address: string;
}>()

const emit = defineEmits(['close'])

const dataUrl = ref<string>('')

async function generateQr(value: string) {
  try {
    const { toDataURL } = await import('qrcode')
    dataUrl.value = await toDataURL(value, {
      margin: 1,
      width: 220,
      color: {
        dark: '#ffffff',
        light: '#111111'
      }
    })
  } catch (e) {
    console.error('QR generation failed', e)
    dataUrl.value = ''
  }
}

function closeModal() {
  emit('close')
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      await generateQr(props.address)
    } else {
      dataUrl.value = ''
    }
  }
)
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
          class="bg-surface-primary border border-surface-skeleton rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
          @click.stop
        >
          <div class="flex items-center justify-between p-4 border-b border-surface-skeleton">
            <h2 class="text-[15px] font-semibold text-font-primary">
              Account QR Code
            </h2>
            <button @click="closeModal">
              <CloseIcon class="w-6 h-6 text-font-tertiary" />
            </button>
          </div>

          <div class="p-5 flex flex-col items-center gap-3">
            <div
              class="rounded-lg p-3 bg-surface-disabled border border-surface-skeleton"
            >
              <img v-if="dataUrl" :src="dataUrl" alt="QR Code" class="w-[220px] h-[220px]" />
              <div v-else class="w-[220px] h-[220px] grid place-items-center text-font-tertiary">
                Generating...
              </div>
            </div>
            <div class="text-[14px] text-font-primary break-all text-center">
              {{ address }}
            </div>
          </div>

          <div class="flex justify-end gap-2 p-4 bg-surface-disabled border-t border-surface-skeleton">
            <button
              class="px-3 py-2 text-sm text-line-muted rounded-lg hover:bg-surface-hover hover:text-font-primary"
              @click="closeModal"
            >
              Close
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


