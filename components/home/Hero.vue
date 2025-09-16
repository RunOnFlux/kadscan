<script lang="ts" setup />

<template>
  <div class="grid lg:grid-cols-[1fr_auto] mb-10">
    <div class="flex flex-col justify-between w-full py-6">
      <h1 class="text-[#f5f5f5] font-semibold text-[20px] mb-2 my-2">
        Kadena Block Explorer
      </h1>

      <SearchInput />
    </div>

    <a
      href="https://www.kadindexer.io/"
      target="_blank"
      rel="noopener noreferrer"
      style="
        background: linear-gradient(100deg, #009367 66%, #134237 100%);
        box-shadow: 0px 0px 15px 0px #1c955080;
      "
      class="relative hidden lg:flex p-4 rounded-xl text-white w-[400px] h-[125px] flex-shrink-0 mx-[60px] self-center"
    >
      <div class="flex items-center gap-4 h-full">
        <div class="flex flex-col">
          <h2 class="font-bold text-lg leading-tight">
            Kadscan is powered by Kadindexer
          </h2>
          <p class="text-xs font-light leading-tight mt-1">
            Build better on Kadena using a fast, reliable and developer friendly GraphQL API with access to all of Kadena's data.
          </p>
          <div class="font-semibold text-sm flex items-center mt-2">
            Kadindexer
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>
        <img
          src="/kadindexer-logo.png"
          alt="Kadindexer Logo"
          class="h-12 w-12 flex-shrink-0 mb-[33px]"
        />
      </div>
    </a>
  </div>
</template>
