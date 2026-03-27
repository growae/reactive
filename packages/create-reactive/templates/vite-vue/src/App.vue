<script setup lang="ts">
import { useConnect, useDisconnect, useBalance } from '@reactive/vue'

const { connect, connectors, status, error } = useConnect()
const { disconnect } = useDisconnect()
const { data: balance } = useBalance()
</script>

<template>
  <div>
    <h1>Reactive App</h1>

    <div>
      <h2>Connect</h2>
      <button
        v-for="connector in connectors"
        :key="connector.uid"
        @click="connect({ connector })"
      >
        {{ connector.name }}
      </button>
      <div>{{ status }}</div>
      <div v-if="error">{{ error.message }}</div>
    </div>

    <div v-if="balance !== undefined">
      <h2>Balance</h2>
      <p>{{ balance }} aettos</p>
    </div>

    <button @click="disconnect()">Disconnect</button>
  </div>
</template>
