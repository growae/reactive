import type { Config } from '@growae/reactive'
import { ReactivePlugin } from '@growae/reactive-vue'
import { defineNuxtPlugin } from 'nuxt/app'
import type { NuxtApp } from 'nuxt/app'

type ReactiveNuxtInject = { config?: Config }

export default defineNuxtPlugin((nuxtApp: NuxtApp) => {
  const config = (nuxtApp as NuxtApp & { $reactive?: ReactiveNuxtInject })
    .$reactive?.config
  if (config) {
    nuxtApp.vueApp.use(ReactivePlugin, { config })
  }
})
