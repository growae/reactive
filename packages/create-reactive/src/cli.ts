#!/usr/bin/env node
import { createReactive } from './index.js'

createReactive().catch((_e: unknown) => {})
