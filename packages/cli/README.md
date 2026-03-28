<h1 align="center">@growae/reactive-cli</h1>

<p align="center">
  CLI for generating typed Sophia contract bindings from ACI
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@growae/reactive-cli"><img src="https://img.shields.io/npm/v/@growae/reactive-cli?colorA=21262d&colorB=3b82f6&style=flat" alt="Version"></a>
  <a href="https://www.npmjs.com/package/@growae/reactive-cli"><img src="https://img.shields.io/npm/dm/@growae/reactive-cli?colorA=21262d&colorB=3b82f6&style=flat" alt="Downloads"></a>
  <a href="https://github.com/growae/reactive/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@growae/reactive-cli?colorA=21262d&colorB=3b82f6&style=flat" alt="MIT License"></a>
</p>

<br>

## Overview

CLI for `@growae/reactive` that generates fully typed TypeScript code from Sophia contract ACI files. Supports watch mode for development. Also exports `defineConfig`, `aci()` plugin, and `compiler()` plugin for programmatic use.

## Install

```bash
# npm
npm install -D @growae/reactive-cli

# yarn
yarn add -D @growae/reactive-cli

# pnpm
pnpm add -D @growae/reactive-cli
```

## Usage

### Scaffold a config

```bash
npx @growae/reactive-cli init
```

### Generate typed bindings

```bash
npx @growae/reactive-cli generate
```

### Watch mode

```bash
npx @growae/reactive-cli generate --watch
```

### Config file

```ts
// reactive.config.ts
import { defineConfig } from '@growae/reactive-cli'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [{ name: 'Token', aci: './contracts/Token.json' }],
})
```

## Documentation

Visit [reactive.growae.io/cli/getting-started](https://reactive.growae.io/cli/getting-started) for the full documentation.

## License

[MIT](https://github.com/growae/reactive/blob/main/LICENSE)
