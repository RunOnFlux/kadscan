// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
