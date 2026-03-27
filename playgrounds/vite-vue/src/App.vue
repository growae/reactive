<template>
  <div style="font-family: system-ui; padding: 2rem">
    <h1>Reactive + Vue</h1>
    <p>Network: {{ networkId ?? 'loading...' }}</p>
    <p>Height: {{ height?.toString() ?? 'loading...' }}</p>
  </div>
</template>

<script setup lang="ts">
import { useHeight, useNetworkId } from '@growae/reactive-vue'

const { data: networkId } = useNetworkId()
const { data: height } = useHeight()
</script>
