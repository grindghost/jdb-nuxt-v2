// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  plugins: ['@/plugins/fontawesome.js', '@/plugins/scaler.client.js'],
  typescript: { strict: false },
  css: [    
    'quill/dist/quill.snow.css',
    '@/assets/global.css',  // Your global CSS file
  ],
  routeRules: {
    // prerender index route by default
    '/': { prerender: true },
  },

})