// https://nuxt.com/docs/api/configuration/nuxt-configs
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
  runtimeConfig: {
    public: {
      allowedReferrerDomains: (process.env.ALLOWED_REFERRER_DOMAINS || '').split(','),
      allowedSource: process.env.ALLOWED_SOURCE,
    }
  },

  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'Content-Security-Policy': "frame-ancestors 'self' https://www.brioeducation.ca http://localhost:3000",
        }
      }
    }
  },

})