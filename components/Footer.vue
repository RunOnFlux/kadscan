<script setup lang="ts">
import IconTwitter from '~/components/icon/Twitter.vue'
import IconGithub from '~/components/icon/Github.vue'
import IconGitbook from '~/components/icon/Gitbook.vue'
import IconBackToTop from '~/components/icon/BackToTop.vue'

const { routes } = useAppConfig()

const socials = [
  {
    name: 'Github',
    url: 'https://github.com/hack-a-chain-software/indexer-kadena',
    icon: IconGithub
  },
  {
    name: 'Gitbook',
    url: 'https://kadindexer.gitbook.io/docs/',
    icon: IconGitbook
  },
  {
    name: 'Twitter',
    url: 'https://x.com/hackachain',
    icon: IconTwitter
  }
]

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
</script>

<template>
  <div class="w-full bg-[#111111] border-t border-[#222222]">
    <div class="w-full px-5 pt-8 pb-4 flex flex-col">
      <div class="flex justify-between items-center gap-8 flex-wrap">
        <div class="flex flex-col gap-3">
          <div class="flex items-end gap-3">
            <IconLogoColor class="h-[38px] md:h-[42px] w-max" />
          </div>
          <span class="hidden md:block text-sm text-[#f5f5f5] leading-[19.6px]">
            Kadscan is a Block Explorer and Analytics Platform for Kadena.
          </span>
        </div>

        <div class="hidden md:flex gap-x-6 gap-y-2 flex-wrap">
          <NuxtLink
            v-for="link in routes"
            :key="link.tag"
            :to="link.path"
            class="text-[#f5f5f5] hover:text-white transition-colors text-sm"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <button
          @click="scrollToTop"
          class="md:hidden flex items-center gap-2 text-[#f5f5f5] bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-4 py-2"
        >
          <IconBackToTop class="h-5 w-5" />
          <span>Back to Top</span>
        </button>
      </div>

      <div class="border-t border-t-[#222222] my-4" />

      <div class="flex justify-between items-center flex-wrap">
        <div class="flex items-center gap-4">
          <a
            v-for="social in socials"
            :key="social.name"
            :href="social.url"
            target="_blank"
            class="text-[#f5f5f5] hover:text-white transition-colors"
          >
            <component
              :is="social.icon"
              class="w-5 h-5"
            />
          </a>
        </div>

        <a
          href="https://hackachain.io"
          target="_blank"
          class="flex items-center gap-2 text-xs text-[#f5f5f5] hover:text-white transition-colors"
        >
          <img
            src="public/hackachain.svg"
            class="h-[22px]"
          />
        </a>

        <div>
          <span class="text-[#f5f5f5] text-xs">
            Kadscan © {{ new Date().getFullYear() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
