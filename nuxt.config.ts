// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: [
    '@splidejs/vue-splide/css',
    '~/assets/css/tokens.css',
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: [
    "nuxt-headlessui",
    "@nuxtjs/tailwindcss",
    "nuxt-graphql-request",
  ],

  build: {
    transpile: ['@popperjs/core', 'nuxt-graphql-request', '@venegrad/vue3-click-outside'],
  },

  alias: {
    "cross-fetch": "cross-fetch/dist/browser-ponyfill.js",
  },

  runtimeConfig: {
    kadindexerMainnetApiUrl: process.env.KADINDEXER_MAINNET_API_URL || 'https://api.mainnet.kadindexer.io/v0',
    kadindexerMainnetApiKey: process.env.KADINDEXER_MAINNET_API_KEY,
    kadindexerTestnetApiUrl: process.env.KADINDEXER_TESTNET_API_URL || 'https://api.testnet.kadindexer.io/v0',
    kadindexerTestnetApiKey: process.env.KADINDEXER_TESTNET_API_KEY,
    public: {
      CG_KEY: process.env.CG_KEY,
      CG_URL: process.env.CG_URL || "https://api.coingecko.com/api/v3",
      // PostHog public runtime config
      posthogPublicKey: process.env.NUXT_PUBLIC_POSTHOG_KEY,
      posthogHost: process.env.NUXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      posthogDefaults: process.env.NUXT_PUBLIC_POSTHOG_DEFAULTS || '2025-05-24',
      // Optional toggle; we will still guard by production in the plugin
      posthogEnabled: process.env.NUXT_PUBLIC_POSTHOG_ENABLED || 'false',
      // Kadindexer WSS endpoints (public)
      kadindexerMainnetWssUrl: process.env.NUXT_PUBLIC_KADINDEXER_MAINNET_WSS_URL || 'wss://mainnet.kadindexer.io/wss/graphql',
      kadindexerTestnetWssUrl: process.env.NUXT_PUBLIC_KADINDEXER_TESTNET_WSS_URL || 'wss://testnet.kadindexer.io/wss/graphql',
    },
  },

  graphql: {
    /**
     * An Object of your GraphQL clients
     */
    clients: {
      default: {
        /**
         * The client endpoint url
         */
        endpoint: "/api/graphql",
        options: {
          method: 'POST', // Default to `POST`
        },
      },
    },
  },

  headlessui: {
    prefix: '',
  },
})
