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
    kadindexerApiUrl:
      process.env.API_URL_KADINDEXER ||
      'https://api.mainnet.kadindexer.io/v1',
    kadindexerApiKey: process.env.API_KEY_KADINDEXER,
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
