import { ReactivePlugin } from '@growae/reactive-vue'
import { defineNuxtPlugin, useRuntimeConfig } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  const config = nuxtApp.$reactive?.config
  if (config) {
    nuxtApp.vueApp.use(ReactivePlugin, { config })
  }
})
