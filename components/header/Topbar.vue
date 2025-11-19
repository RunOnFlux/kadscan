<script setup lang="ts">
import {
  provideUseId,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from '@headlessui/vue'
import { useSharedData } from '~/composables/useSharedData';
import IconLogoWhite from '~/components/icon/LogoWhite.vue'
import IconLogoColor from '~/components/icon/LogoColor.vue'
import { useTheme } from '~/composables/useTheme'
import IconKadena from '~/components/icon/Kadena.vue';

const routes = [
  { tag: 'home', label: 'Home', path: '/', type: 'link' },
  { tag: 'blocks', label: 'Blocks', path: '/blocks', type: 'link' },
  { tag: 'transactions', label: 'Transactions', path: '/transactions', type: 'link' },
]

provideUseId(() => useId());

const route = useRoute()
const { theme } = useTheme()

const { 
  availableNetworks,
  selectedNetwork,
  setNetwork
} = useSharedData();
</script>

<template>
  <Disclosure
    as="header"
    v-slot="{ open }"
    class="w-full bg-surface-primary border-b border-line-default shadow-[0_4px_10px_-5px_rgba(255,255,255,0.0625)] z-[10]"
  >
    <div
      class="w-full max-w-[1400px] mx-auto px-3 md:px-4 flex items-center justify-between h-[62px] md:h-[56px]"
    >
      <NuxtLink
        to="/"
        class="flex items-end"
      >
        <component :is="theme === 'light' ? IconLogoColor : IconLogoWhite" class="w-max h-7 text-font-primary mx-2" />
        <span
          v-if="selectedNetwork"
          class="text-xs font-bold text-font-secondary"
        >
          {{ selectedNetwork.name }}
        </span>
      </NuxtLink>

      <div
        class="hidden md:block md:flex w-full items-center justify-end gap-2"
      >
        <HeaderRoute
          :key="route.tag + i"
          v-bind="route"
          v-for="(route, i) in routes"
        />
      </div>

      <div class="flex items-center gap-2 md:hidden">
        <Menu as="div" class="relative inline-block text-left">
          <div>
            <MenuButton class="h-8 w-8 rounded-lg flex items-center justify-center border border-line-default">
              <IconKadena class="h-4 w-4" />
            </MenuButton>
          </div>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <MenuItems class="absolute right-0 mt-1 border border-line-default w-32 origin-top-right rounded-lg bg-surface-primary shadow-[0_0_15px_rgba(255,255,255,0.0625)] ring-1 ring-black/5 focus:outline-none px-2 py-1">
              <div class="px-1 py-1">
                <MenuItem v-for="network in availableNetworks" :key="network.id" v-slot="{ active }">
                  <button
                    @click="setNetwork(network)"
                    :class="[
                      active ? 'bg-surface-secondary' : '',
                      selectedNetwork.id === network.id ? 'text-link' : 'text-font-primary',
                      'group flex w-full items-center hover:bg-surface-secondary justify-start rounded-md px-3 py-2 text-sm',
                    ]"
                  >
                    <span>{{ network.name }}</span>
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
        
        <DisclosureButton
          class="h-8 w-8 rounded-lg flex items-center justify-center border border-line-default text-font-tertiary"
        >
          <IconMenu class="w-6 h-6" />
        </DisclosureButton>
      </div>
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
        class="flex md:hidden w-full gap-2 flex-col pt-1 pb-3 px-4 bg-surface-primary"
      >
        <HeaderRouteMobile
          :key="route.tag + i + '-mobile'"
          v-bind="route"
          v-for="(route, i) in routes"
        />
      </DisclosurePanel>
    </transition>
  </Disclosure>
</template>
