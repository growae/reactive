# Installation

## Package Manager

::: code-group

```bash [pnpm]
pnpm add @reactive/core
```

```bash [npm]
npm install @reactive/core
```

```bash [yarn]
yarn add @reactive/core
```

:::

## Requirements

- **TypeScript** 5.0+ (strict mode recommended)
- **Node.js** 18+

## Peer Dependencies

`@reactive/core` depends on the Aeternity SDK under the hood. It is bundled with the package — you do not need to install `@aeternity/aepp-sdk` separately.

## Framework Packages

If you are using a framework, install the corresponding package instead. Each framework package re-exports everything from `@reactive/core`:

| Framework | Package | Extra Dependencies |
|-----------|---------|-------------------|
| React | `@reactive/react` | `@tanstack/react-query` |
| Vue | `@reactive/vue` | `@tanstack/vue-query` |
| Solid | `@reactive/solid` | `@tanstack/solid-query` |

## TypeScript Configuration

Reactive requires strict TypeScript settings. Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```
