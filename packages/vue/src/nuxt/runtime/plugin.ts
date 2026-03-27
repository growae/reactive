import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { ReactivePlugin } from '@growae/reactive-vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = nuxtApp.$reactive?.config
  if (config) {
    nuxtApp.vueApp.use(ReactivePlugin, { config })
  }
})
