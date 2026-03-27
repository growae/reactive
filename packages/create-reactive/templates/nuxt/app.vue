<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ReactivePlugin } from '@reactive/vue'
import { createConfig } from '@reactive/core'
import { testnet } from '@reactive/core'
import { superhero } from '@reactive/connectors'

const config = createConfig({
  networks: [testnet],
  connectors: [superhero()],
})
</script>
