<script setup lang="ts">
import { useConfig, useHeight } from '@growae/reactive-vue'

const config = useConfig()
const { data: height } = useHeight()
</script>

<template>
  <div>
    <p>{{ config }}</p>
    <p>{{ height }}</p>
  </div>
</template>
