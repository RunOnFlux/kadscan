<script setup lang="ts">
import CloseIcon from '~/components/icon/Close.vue'
import Copy from '~/components/Copy.vue'

const props = defineProps<{
  open: boolean,
  holding: any | null,
  metadata: any | null,
  errorUrl?: string | null,
}>()

const emit = defineEmits(['close'])

function closeModal() {
  emit('close')
}

function sanitize(input: any, maxLen = 800): string {
  if (input === null || input === undefined) return ''
  let text = String(input)
  // Remove tags
  text = text.replace(/<[^>]*>/g, ' ')
  // Decode a few common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  // Keep conservative set of characters
  text = text.replace(/[^\w\s.,:;!?()\[\]\-_/&#%+'"@]/g, ' ')
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim()
  if (text.length > maxLen) text = text.slice(0, maxLen - 1) + '…'
  return text
}

function safeUrl(url: any): string | null {
  if (!url || typeof url !== 'string') return null
  try {
    const u = new URL(url)
    if (['http:', 'https:'].includes(u.protocol)) return u.toString()
    return null
  } catch (_e) { return null }
}

const title = computed(() => sanitize(props.metadata?.name || 'Unknown'))
const collection = computed(() => sanitize(props.metadata?.collection || 'Unknown'))
const description = computed(() => sanitize(props.metadata?.description || ''))
const imageUrl = computed(() => props.metadata?.image || null)
const externalUrl = computed(() => safeUrl(props.metadata?.external_url))
</script>

<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="props.open" class="fixed inset-0 z-[998] bg-black bg-opacity-50" @click="closeModal" />
    </transition>

    <transition name="slide-fade">
      <div v-if="props.open" class="fixed inset-0 z-[999] flex items-start justify-center pt-[30px]" @click="closeModal">
        <div class="bg-[#111111] border border-gray-700 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden" @click.stop>
          <div class="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 class="text-[15px] font-semibold text-white">NFT Details</h2>
            <button @click="closeModal">
              <CloseIcon class="w-6 h-6 text-[#888888]" />
            </button>
          </div>

          <div class="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="relative rounded-lg bg-[#151515] border border-[#222222] aspect-square overflow-hidden grid place-items-center">
              <img v-if="imageUrl" :src="imageUrl as any" alt="nft" class="w-full h-full object-cover" />
              <div v-else class="text-[#888888] text-center px-3">
                <div>No image</div>
                <div v-if="props.errorUrl" class="text-[#ff6b6b] text-xs mt-1 break-all">
                  This URL blocks kadscan.io:<br />{{ props.errorUrl }}
                </div>
              </div>
              <div v-if="props.holding?.balance && Number(props.holding.balance) > 1" class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-[2px] rounded">
                x{{ props.holding.balance }}
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <div>
                <div class="text-xs text-[#bbbbbb] mb-[2px]">Collection</div>
                <div class="text-[15px] text-[#f5f5f5]">{{ collection }}</div>
              </div>
              <div>
                <div class="text-xs text-[#bbbbbb] mb-[2px]">Name</div>
                <div class="text-[15px] text-[#f5f5f5]">{{ title }}</div>
              </div>
              <div v-if="description">
                <div class="text-xs text-[#bbbbbb] mb-[2px]">Description</div>
                <div class="text-[14px] text-[#f5f5f5] leading-5">{{ description }}</div>
              </div>
              <div class="grid grid-cols-1 gap-3">
                <div>
                  <div class="text-xs text-[#bbbbbb] mb-[2px]">Chain</div>
                  <div class="text-[15px] text-[#f5f5f5]">{{ props.holding?.chainId }}</div>
                </div>
                <div>
                  <div class="text-xs text-[#bbbbbb] mb-[2px]">TokenId</div>
                  <div class="flex items-center gap-2">
                    <div class="text-[15px] text-[#f5f5f5] break-all">{{ props.holding?.tokenId }}</div>
                    <Copy :value="props.holding?.tokenId" tooltipText="Copy Token ID" />
                  </div>
                </div>
              </div>
              <div v-if="externalUrl" class="pt-1">
                <a :href="externalUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#1b1b1b] border border-[#2a2a2a] rounded-md hover:bg-[#262626]">
                  Open site
                </a>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 p-4 bg-[#151515] border-t border-gray-700">
            <button class="px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-[#252525] hover:text-[#f5f5f5]" @click="closeModal">Close</button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style>
.fade-enter-active { transition: opacity 0.3s ease; }
.fade-leave-active { transition: opacity 0.4s ease; transition-delay: 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-fade-enter-active { transition: all 0.25s ease; }
.slide-fade-leave-active { transition: all 0.25s ease; }
.slide-fade-enter-from { transform: translateY(8px); opacity: 0; }
.slide-fade-leave-to { transform: translateY(8px); opacity: 0; }
</style>


