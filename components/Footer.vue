<script setup lang="ts">
import IconX from "~/components/icon/Twitter.vue";
import IconLinkedIn from "~/components/icon/LinkedIn.vue";
import IconDiscord from "~/components/icon/Discord.vue";
import IconYouTube from "~/components/icon/YouTube.vue";
import IconTelegram from "~/components/icon/Telegram.vue";
import IconGithub from "~/components/icon/Github.vue";
import IconBackToTop from "~/components/icon/BackToTop.vue";

const routes = [
  { tag: "home", label: "Home", path: "/", type: "link" },
  { tag: "blocks", label: "Blocks", path: "/blocks", type: "link" },
  {
    tag: "transactions",
    label: "Transactions",
    path: "/transactions",
    type: "link",
  },
];

const socials = [
  {
    name: "X",
    url: "https://x.com/RunOnFlux",
    icon: IconX,
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/influxtechnologies/",
    icon: IconLinkedIn,
  },
  {
    name: "Discord",
    url: "https://discord.com/invite/runonflux",
    icon: IconDiscord,
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/@runonflux_official",
    icon: IconYouTube,
  },
  {
    name: "Telegram",
    url: "https://t.me/runonflux",
    icon: IconTelegram,
  },
  {
    name: "Github",
    url: "https://github.com/RunOnFlux/",
    icon: IconGithub,
  },
];

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
</script>

<template>
  <div class="w-full bg-surface-primary border-t border-line-default">
    <div class="w-full max-w-[1400px] mx-auto px-5 pt-8 pb-4 flex flex-col">
      <div class="flex justify-between items-center gap-8 flex-wrap">
        <div class="flex flex-col gap-3">
          <div class="flex items-end gap-3">
            <IconLogoColor
              class="h-[38px] md:h-[42px] w-max text-font-primary"
            />
          </div>
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
            <component :is="social.icon" class="w-5 h-5" />
          </a>
        </div>

        <div>
          <span class="text-font-primary text-xs">
            Kadscan © {{ new Date().getFullYear() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
