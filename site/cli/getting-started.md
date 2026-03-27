# Getting Started

## Overview

`@reactive/cli` is a CLI tool for generating type-safe code from Sophia contract source files. It reads your contracts and produces TypeScript ACI definitions, typed actions, and hooks that integrate with Reactive.

## Quick Start

### 1. Install

```bash
pnpm add -D @reactive/cli
```

### 2. Initialize Config

```bash
npx reactive init
```

This creates a `reactive.config.ts` file:

```typescript
import { defineConfig } from '@reactive/cli'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'Token',
      source: 'contracts/Token.aes',
    },
  ],
})
```

### 3. Generate Code

```bash
npx reactive generate
```

This compiles your Sophia contracts and generates typed ACI, actions, and hooks.

### 4. Use Generated Code

```typescript
import { tokenAci, tokenBytecode } from './generated'
import { readContract } from '@reactive/core/actions'

const balance = await readContract(config, {
  address: 'ct_token...',
  aci: tokenAci,
  fn: 'balance',
  args: ['ak_owner...'],
})
```

## Next Steps

- [Installation](/cli/installation) — detailed install guide
- [init command](/cli/api/commands/init) — config initialization
- [generate command](/cli/api/commands/generate) — code generation
- [create-reactive](/cli/create-reactive) — project scaffolder
