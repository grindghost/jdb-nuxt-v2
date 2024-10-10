import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { defineNuxtPlugin } from '#app'

// Add all icons from 'free-solid-svg-icons' to the library
library.add(fas)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('fa', FontAwesomeIcon)
})
