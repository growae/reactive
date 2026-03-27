#!/usr/bin/env node
import { createReactive } from './index.js'

createReactive().catch((e: unknown) => {
  console.error(e)
})
