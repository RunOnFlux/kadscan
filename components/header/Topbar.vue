<script setup lang="ts">
import {
  provideUseId,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/vue'

const config = useAppConfig()

provideUseId(() => useId());

const route = useRoute()
</script>

<template>
  <Disclosure
    as="header"
    v-slot="{ open }"
    class="w-full bg-[#111111] border-b border-[#222222] shadow-[0_4px_10px_-5px_rgba(255,255,255,0.0625)] z-[10]"
  >
    <div
      class="w-full px-3 lg:px-4 flex items-center justify-between h-[62px] lg:h-[56px]"
    >
      <NuxtLink
        to="/"
        class="flex items-center"
      >
        <IconLogoWhite
          class="h-7"
        />
      </NuxtLink>

      <div
        class="hidden md:flex w-full items-center justify-end gap-2"
      >
        <HeaderSearch
          variant="secondary"
          v-if="route.name !== 'index'"
        />

        <HeaderRoute
          :key="route.tag + i"
          v-bind="route"
          v-for="(route, i) in config.routes"
        />
      </div>

      <DisclosureButton
        class="md:hidden h-8 w-8 rounded p-1 bg-gray-700"
      >
        <IconMenu
          v-if="!open"
          class="w-6 h-6"
        />

        <IconX
          v-else
          class="w-6 h-6"
        />
      </DisclosureButton>
    </div>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-out"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <DisclosurePanel
        class="flex lg:hidden w-full gap-2 flex-col pt-1 pb-3 px-4 bg-[#111111]"
      >
        <HeaderRouteMobile
          :key="route.tag + i + '-mobile'"
          v-bind="route"
          v-for="(route, i) in config.routes"
        />
      </DisclosurePanel>
    </transition>
  </Disclosure>
</template>
