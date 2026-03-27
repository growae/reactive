# init

Initializes a `reactive.config.ts` configuration file in the current directory.

## Usage

```bash
npx reactive init
```

## What it does

1. Creates `reactive.config.ts` with a default template
2. Detects your project setup (React, Vue, Solid) and pre-configures plugins
3. Scans for `.aes` contract files and adds them to the config

## Generated Config

```typescript
import { defineConfig } from '@reactive/cli'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [],
  plugins: [],
})
```

## Options

### --config, -c

- **Type:** `string`
- **Default:** `'reactive.config.ts'`

Custom config file name.

### --root

- **Type:** `string`
- **Default:** `process.cwd()`

Project root directory.

## Config File Options

### out

- **Type:** `string`
- **Required**

Output file path for generated code.

### contracts

- **Type:** `ContractConfig[]`

Array of contract definitions:

```typescript
type ContractConfig = {
  name: string
  source?: string
  address?: Record<string, string>
}
```

### plugins

- **Type:** `Plugin[]`

Array of CLI plugins for additional code generation.
