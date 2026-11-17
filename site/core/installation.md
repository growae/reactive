# Installation

## Package Manager

::: code-group

```bash [pnpm]
pnpm add @growae/reactive
```

```bash [npm]
npm install @growae/reactive
```

```bash [yarn]
yarn add @growae/reactive
```

:::

## Requirements

- **TypeScript** 5.0+ (strict mode recommended)
- **Node.js** 18+

## Peer Dependencies

`@growae/reactive` includes its Rust WASM asset. [Supported operations](./rust-protocol)

## Framework Packages

If you are using a framework, install the corresponding package instead. Each framework package re-exports everything from `@growae/reactive`:

| Framework | Package | Extra Dependencies |
|-----------|---------|-------------------|
| React | `@growae/reactive-react` | `@tanstack/react-query` |
| Vue | `@growae/reactive-vue` | `@tanstack/vue-query` |
| Solid | `@growae/reactive-solid` | `@tanstack/solid-query` |

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
