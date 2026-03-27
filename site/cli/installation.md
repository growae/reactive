# Installation

## Package Manager

::: code-group

```bash [pnpm]
pnpm add -D @growae/reactive-cli
```

```bash [npm]
npm install -D @growae/reactive-cli
```

```bash [yarn]
yarn add -D @growae/reactive-cli
```

:::

## Requirements

- **Node.js** 18+
- **TypeScript** 5.0+ (recommended)

## Global Installation

You can also install globally:

```bash
pnpm add -g @growae/reactive-cli
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
