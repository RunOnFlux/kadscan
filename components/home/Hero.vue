<script lang="ts" setup />

<template>
  <div class="grid lg:grid-cols-[1fr_auto] mb-10">
    <div class="flex flex-col justify-between w-full py-6">
      <h1 class="text-[#fafafa] font-semibold text-[20px] mb-2 my-2">
        Kadena Blockchain Explorer
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
      class="relative hidden lg:flex p-4 rounded-xl text-white w-[320px] h-[100px] flex-shrink-0 mx-[100px] mt-[25px] self-center"
    >
      <div
        class="absolute top-2.5 right-2.5 text-xs bg-black/20 rounded-md px-1.5 py-0.5"
      >
        Ad
      </div>
      <div class="flex items-center gap-4 h-full">
        <img
          src="/kadindexer-logo.png"
          alt="Kadindexer Logo"
          class="h-12 w-12 flex-shrink-0"
        />
        <div class="flex flex-col">
          <h2 class="font-bold text-lg leading-tight">
            Kadindexer
          </h2>
          <p class="text-xs font-light leading-tight mt-1">
            Fast, reliable, and developer-friendly.
          </p>
          <div class="font-semibold text-sm flex items-center mt-2">
            Build Better on Kadena
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
      </div>
    </a>
  </div>
</template>
