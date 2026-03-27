# Installation

## Package Manager

::: code-group

```bash [pnpm]
pnpm add @reactive/vue @tanstack/vue-query
```

```bash [npm]
npm install @reactive/vue @tanstack/vue-query
```

```bash [yarn]
yarn add @reactive/vue @tanstack/vue-query
```

:::

## Requirements

- **Vue** 3.3+
- **TypeScript** 5.0+ (recommended)
- **@tanstack/vue-query** 5+

## Peer Dependencies

| Package | Version |
|---------|---------|
| `vue` | `>=3.3.0` |
| `@tanstack/vue-query` | `>=5.0.0` |

## Nuxt Setup

For Nuxt 3, use the Reactive Nuxt module:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@reactive/vue/nuxt'],
  reactive: {
    config: {
      // config options are auto-imported
    },
  },
})
```

The Nuxt module automatically:
- Registers the `ReactivePlugin`
- Sets up `VueQueryPlugin`
- Enables SSR mode
- Auto-imports composables
