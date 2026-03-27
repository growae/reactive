# generate

Generates typed code from Sophia contracts based on your `reactive.config.ts`.

## Usage

```bash
npx reactive generate
```

## What it does

1. Reads `reactive.config.ts`
2. Compiles each Sophia contract source (`.aes` files)
3. Generates TypeScript code with:
   - Typed ACI (Application Call Interface)
   - Compiled bytecode
   - Typed action wrappers
   - Framework hooks/composables/primitives (if plugins configured)

## Options

### --config, -c

- **Type:** `string`
- **Default:** `'reactive.config.ts'`

Path to config file.

### --watch, -w

Watch for contract file changes and regenerate automatically.

```bash
npx reactive generate --watch
```

### --root

- **Type:** `string`
- **Default:** `process.cwd()`

Project root directory.

## Generated Output

For a contract named `Token`:

```typescript
// src/generated.ts

export const tokenAci = { /* ... */ } as const

export const tokenBytecode = 'cb_...'

export const tokenActions = {
  balance: (config, params) => readContract(config, {
    aci: tokenAci,
    fn: 'balance',
    ...params,
  }),
  transfer: (config, params) => callContract(config, {
    aci: tokenAci,
    fn: 'transfer',
    ...params,
  }),
}
```

## Example Config

```typescript
import { defineConfig } from '@growae/reactive-cli'
import { react } from '@growae/reactive-cli/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'Token',
      source: 'contracts/FungibleToken.aes',
      address: {
        ae_mainnet: 'ct_mainnet...',
        ae_uat: 'ct_testnet...',
      },
    },
    {
      name: 'DEX',
      source: 'contracts/DEX.aes',
    },
  ],
  plugins: [react()],
})
```
