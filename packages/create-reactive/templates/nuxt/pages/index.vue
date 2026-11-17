<script setup lang="ts">
import { useHeight } from '@growae/reactive-vue'

const { data, error } = useHeight()
</script>

<template>
  <main>
    <h1>æternity testnet</h1>
    <p v-if="error">{{ error.message }}</p>
    <p v-else>Key-block height: {{ data ?? 'Loading…' }}</p>
  </main>
</template>
