<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ReactivePlugin } from '@growae/reactive-vue'
import { createConfig } from '@growae/reactive'
import { testnet } from '@growae/reactive'
import { superhero } from '@growae/reactive-connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero()],
})
</script>
