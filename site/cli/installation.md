# Installation

## Package Manager

::: code-group

```bash [pnpm]
pnpm add -D @reactive/cli
```

```bash [npm]
npm install -D @reactive/cli
```

```bash [yarn]
yarn add -D @reactive/cli
```

:::

## Requirements

- **Node.js** 18+
- **TypeScript** 5.0+ (recommended)

## Global Installation

You can also install globally:

```bash
pnpm add -g @reactive/cli
```

Then use without `npx`:

```bash
reactive init
reactive generate
```

## Add to package.json Scripts

```json
{
  "scripts": {
    "generate": "reactive generate",
    "generate:watch": "reactive generate --watch"
  }
}
```
