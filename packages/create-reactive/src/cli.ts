#!/usr/bin/env node
import { createReactive } from './index'

createReactive().catch((_e: unknown) => {})
