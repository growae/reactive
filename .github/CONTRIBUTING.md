# Contributing to Reactive

Thank you for your interest in contributing! Here's how to get started.

## Development setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/growae/reactive.git
   cd reactive
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Build all packages**

   ```bash
   pnpm build
   ```

4. **Run tests**

   ```bash
   pnpm test
   ```

## Project structure

| Path                     | Description                        |
| ------------------------ | ---------------------------------- |
| `packages/core/`         | `@reactive/core` — vanilla TS      |
| `packages/react/`        | `@reactive/react` — React hooks    |
| `packages/vue/`          | `@reactive/vue` — Vue composables  |
| `packages/solid/`        | `@reactive/solid` — Solid prims    |
| `packages/connectors/`   | `@reactive/connectors` — wallets   |
| `packages/cli/`          | `@reactive/cli` — codegen CLI      |
| `packages/create-reactive/` | Project scaffolder              |
| `site/`                  | VitePress documentation            |
| `playgrounds/`           | Example apps                       |

## Code guidelines

- **TypeScript** — strict mode, no `any`
- **ESM only** — use `.js` extensions in relative imports
- **Tests required** — every feature must include co-located `.test.ts` files
- **Conventional commits** — `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `ci:`

## Making a pull request

1. Create a feature branch from `main`
2. Write code and tests
3. Run `pnpm check && pnpm check:types && pnpm test` to verify
4. Add a changeset if your change is user-facing: `pnpm changeset`
5. Open a PR targeting `main`

## Changesets

We use [changesets](https://github.com/changesets/changesets) for versioning.
When you make a user-facing change, run:

```bash
pnpm changeset
```

Follow the prompts to select affected packages and describe your change.
