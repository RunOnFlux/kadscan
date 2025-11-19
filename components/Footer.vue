<script setup lang="ts">
import IconTwitter from '~/components/icon/Twitter.vue'
import IconGithub from '~/components/icon/Github.vue'
import IconGitbook from '~/components/icon/Gitbook.vue'
import IconBackToTop from '~/components/icon/BackToTop.vue'

const routes = [
  { tag: 'home', label: 'Home', path: '/', type: 'link' },
  { tag: 'blocks', label: 'Blocks', path: '/blocks', type: 'link' },
  { tag: 'transactions', label: 'Transactions', path: '/transactions', type: 'link' },
]

const socials = [
  {
    name: 'Twitter',
    url: 'https://x.com/hackachain',
    icon: IconTwitter
  },
  {
    name: 'Github',
    url: 'https://github.com/hack-a-chain-software/indexer-kadena',
    icon: IconGithub
  },
  {
    name: 'Gitbook',
    url: 'https://docs.kadindexer.io/',
    icon: IconGitbook
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
  <div class="w-full bg-surface-primary border-t border-line-default">
    <div class="w-full max-w-[1400px] mx-auto px-5 pt-8 pb-4 flex flex-col">
      <div class="flex justify-between items-center gap-8 flex-wrap">
        <div class="flex flex-col gap-3">
          <div class="flex items-end gap-3">
            <IconLogoColor class="h-[38px] md:h-[42px] w-max text-font-primary" />
          </div>
          <span class="hidden md:block text-sm text-font-primary leading-[19.6px]">
            Kadscan powers visibility into Kadena through block explorer and analytics.
            <NuxtLink
              to="https://forms.gle/f3RB1A8MUAf1Pvgx9"
              target="_blank"
              rel="noopener noreferrer"
              class="text-link hover:text-link-hover"
            >
              Provide a Feedback!
            </NuxtLink>
          </span>
        </div>

        <div class="hidden md:flex gap-x-6 gap-y-2 flex-wrap">
          <NuxtLink
            v-for="link in routes"
            :key="link.tag"
            :to="link.path"
            class="text-font-primary hover:text-font-accent-strong transition-colors text-sm"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <button
          @click="scrollToTop"
          class="md:hidden flex items-center gap-2 text-font-primary bg-surface-secondary border border-line-strong rounded-lg px-4 py-2"
        >
          <IconBackToTop class="h-5 w-5" />
          <span>Back to Top</span>
        </button>
      </div>

      <div class="border-t border-t-line-default my-4" />

      <div class="flex justify-between items-center flex-wrap">
        <div class="flex items-center gap-4">
          <a
            v-for="social in socials"
            :key="social.name"
            :href="social.url"
            target="_blank"
            class="text-font-primary hover:text-font-accent-strong transition-colors"
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
          class="flex items-center gap-2 text-xs text-font-primary transition-colors"
        >
          <span>Powered by</span>
          <IconHackachain
            class="h-[22px] w-max mb-1 text-font-secondary"
          />
        </a>

        <div>
          <span class="text-font-primary text-xs">
            Kadscan © {{ new Date().getFullYear() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
