<script lang="ts" setup />

<template>
  <div class="grid lg:grid-cols-[1fr_auto] mb-10">
    <div class="flex flex-col justify-between w-full py-6">
      <h1 class="text-font-primary font-semibold text-[20px] mb-2 my-2">
        Kadena Block Explorer
      </h1>

      <SearchInput />
    </div>

    <!--
    <a
      href="https://runonflux.com/"
      target="_blank"
      rel="noopener noreferrer"
      style="
        background: linear-gradient(
          100deg,
          rgb(var(--accent-strong)) 66%,
          color-mix(
              in oklab,
              rgb(var(--accent-strong)),
              rgb(var(--surface-black)) 25%
            )
            100%
        );
        box-shadow: 0 0 15px 0 rgb(var(--accent-strong) / 0.5);
      "
      class="relative hidden lg:flex p-4 rounded-xl text-surface-white w-[400px] h-[125px] flex-shrink-0 mx-[60px] self-center"
    >
      <div class="flex items-center justify-center gap-3 h-full w-full">
        <h2 class="font-bold text-lg leading-tight flex items-center gap-2">
          Kadscan is powered by
        </h2>
        <img src="/rflux-white-logo.svg" alt="Flux Logo" class="h-8 w-auto" />
      </div>
    </a>
    -->
  </div>
</template>
