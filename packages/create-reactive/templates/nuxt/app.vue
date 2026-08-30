<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { createConfig, testnet } from '@growae/reactive'
import { superhero } from '@growae/reactive-connectors'
import { ReactivePlugin } from '@growae/reactive-vue'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero()],
})
</script>
