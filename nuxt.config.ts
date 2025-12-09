import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore
export default defineNuxtConfig({
  devtools: { enabled: true },

  nitro: {
    preset: 'vercel'
  },

  runtimeConfig: {
    // Các khóa bí mật chỉ có trên server-side
    mongodbUri: process.env.MONGODB_URI || process.env.MONGO_URI || "",
    jwtSecret: process.env.JWT_SECRET || "",
    ghnToken: process.env.GHN_TOKEN || "",
    ghnShopId: process.env.GHN_SHOP_ID || "",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    // Các khóa trong public sẽ được hiển thị cả ở client-side
    public: {
      appUrl: process.env.APP_URL || "http://localhost:3000",
      paypalMode: process.env.PAYPAL_MODE || "sandbox", // 'sandbox' or 'live'
    }
  },

  modules: [
    "@unocss/nuxt",
    "shadcn-nuxt",
    "@vueuse/nuxt",
    "@nuxt/eslint",
    "@nuxt/icon",
    "@pinia/nuxt",
    "@nuxtjs/color-mode",
    "nuxtjs-naive-ui",
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },


  css: ["@unocss/reset/tailwind.css"],

  colorMode: {
    classSuffix: "",
  },

  features: {
    // For UnoCSS
    inlineStyles: false,
  },
  vite: {
    plugins: [
      AutoImport({
        imports: [
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar'
            ]
          }
        ]
      }),
      Components({
        resolvers: [NaiveUiResolver()]
      })
    ]
  },
  eslint: {
    config: {
      standalone: false,
    },
  },

  routeRules: {
    "/components": { redirect: "/components/accordion" },
    "/settings": { redirect: "/settings/profile" },
  },

  imports: {
    dirs: ["./lib"],
  },
  ssr: false,

  compatibilityDate: "2024-12-14",

  build: {
    transpile: ['@vuepic/vue-datepicker']
  },
});
