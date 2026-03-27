# create-reactive

Scaffolding tool that creates a new Reactive project with your choice of framework, tooling, and example contracts.

## Usage

```bash
pnpm create reactive
```

Or with other package managers:

::: code-group

```bash [pnpm]
pnpm create reactive
```

```bash [npm]
npm create reactive@latest
```

```bash [yarn]
yarn create reactive
```

:::

## Interactive Setup

The scaffolder prompts you for:

1. **Project name** — directory name for the new project
2. **Framework** — React, Vue, Solid, or Vanilla (core only)
3. **Template** — Vite, Next.js, Nuxt, or SolidStart
4. **Features** — Which Aeternity features to include examples for:
   - Basic (connect + balance)
   - Contracts (deploy + call)
   - AENS (name registration)
   - Oracles
   - State Channels

## Example

```bash
$ pnpm create reactive

✔ Project name: my-aepp
✔ Framework: React
✔ Template: Vite
✔ Features: Basic, Contracts

Scaffolding project in ./my-aepp...

Done. Now run:

  cd my-aepp
  pnpm install
  pnpm dev
```

## Templates

### Vite + React

- React 18+ with Vite
- `@reactive/react` + `@tanstack/react-query`
- Example connect wallet + balance component
- TypeScript configured

### Next.js

- Next.js App Router
- `@reactive/react` + `@tanstack/react-query`
- SSR-safe provider setup
- Server/client component examples

### Vite + Vue

- Vue 3 with Vite
- `@reactive/vue` + `@tanstack/vue-query`
- Example composable usage
- TypeScript configured

### Nuxt

- Nuxt 3 with Reactive module
- Auto-imported composables
- SSR configured

### Vite + Solid

- SolidJS with Vite
- `@reactive/solid` + `@tanstack/solid-query`
- Example primitive usage
- TypeScript configured

## Generated Structure

```
my-aepp/
├── src/
│   ├── App.tsx          # Main component with examples
│   ├── config.ts        # Reactive config
│   ├── main.tsx         # Entry point with providers
│   └── generated.ts     # Generated contract types (if contracts selected)
├── contracts/           # Example Sophia contracts (if contracts selected)
│   └── Greeter.aes
├── reactive.config.ts   # CLI config
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Non-interactive Mode

Pass flags to skip prompts:

```bash
pnpm create reactive my-aepp --template vite-react --features basic,contracts
```
