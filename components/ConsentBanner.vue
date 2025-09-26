<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isVisible = ref(false)

function getConsent(): 'granted' | 'denied' | null {
  try {
    return (window.localStorage.getItem('analytics_consent') as any) || null
  } catch {
    return null
  }
}

function setConsent(value: 'granted' | 'denied') {
  try {
    window.localStorage.setItem('analytics_consent', value)
  } catch {}
}

function accept() {
  setConsent('granted')
  isVisible.value = false
  // Fire a custom event so plugins can react instantly
  window.dispatchEvent(new StorageEvent('storage', { key: 'analytics_consent', newValue: 'granted' }))
}

function decline() {
  setConsent('denied')
  isVisible.value = false
  window.dispatchEvent(new StorageEvent('storage', { key: 'analytics_consent', newValue: 'denied' }))
}

onMounted(() => {
  const existing = getConsent()
  isVisible.value = existing === null
})
</script>

<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform translate-y-4 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-4 opacity-0"
  >
    <div v-if="isVisible" class="fixed bottom-3 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-24px)] md:w-auto">
      <div class="mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-[#222222] bg-surface-primary/95 px-4 py-3 shadow-[0_0_15px_rgba(255,255,255,0.0625)] backdrop-blur">
        <div class="flex-1 text-sm text-[#d6d6d6]">
          <p class="leading-5">
            We use analytics and session replay to improve Kadscan. Data is anonymized; inputs are masked. You can change your choice anytime in your browser storage.
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button @click="decline" class="px-3 py-2 text-sm rounded-lg border border-[#222222] bg-surface-disabled hover:bg-surface-secondary text-font-primary">Decline</button>
          <button @click="accept" class="px-3 py-2 text-sm rounded-lg bg-[#6ab5db] hover:bg-[#9ccee7] text-[#0b0b0b]">Allow</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
</style>


