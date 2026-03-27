# Contributing to Reactive

Thank you for your interest in contributing to Reactive! This guide will help you get up and running.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18.19
- [pnpm](https://pnpm.io/) >= 10 (enforced via `preinstall` script)
- [Git](https://git-scm.com/)

## Development setup

1. **Fork and clone**

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

5. **Run linting and type checks**

   ```bash
   pnpm check        # Biome linter + formatter
   pnpm check:types  # TypeScript type checking
   ```

## Project structure

```
reactive/
├── packages/
│   ├── core/              @growae/reactive — vanilla TypeScript, no framework deps
│   ├── react/             @growae/reactive-react — React hooks wrapping core
│   ├── vue/               @growae/reactive-vue — Vue composables wrapping core
│   ├── solid/             @growae/reactive-solid — Solid primitives wrapping core
│   ├── connectors/        @growae/reactive-connectors — wallet connectors
│   ├── cli/               @growae/reactive-cli — code generation CLI
│   └── create-reactive/   create-reactive — project scaffolder
├── site/                  VitePress documentation site
├── playgrounds/           Example applications
│   ├── vite-react/
│   ├── vite-vue/
│   ├── vite-solid/
│   └── next/
├── test/                  Integration test infrastructure
└── .github/               CI/CD workflows and templates
```

## Code guidelines

### TypeScript

- **Strict mode** — `strict: true` is enforced across all packages
- **No `any`** — use `unknown` and type guards instead
- **ESM only** — all packages emit ESM; use `.js` extensions in relative imports even for `.ts` files
- **`import type`** — use `import type` for type-only imports (required by `verbatimModuleSyntax`)
- **Module resolution** — `NodeNext`; see [07-project-rules.md](../@growae/projects/reactive/agent-docs/07-project-rules.md) for full details

### Testing

- **Vitest** is the test runner
- **Co-located tests** — place `*.test.ts` files next to the source they test
- **Type tests** — use `*.test-d.ts` for compile-time type assertions with `expectTypeOf`
- **Every feature requires tests** — PRs without tests for new functionality will be asked to add them

### Aeternity-specific conventions

- **DEFAULT_TTL = 300** — all transaction-building actions default to 300 blocks (~15 hours). Users can override with `ttl: 0` or any custom value.
- **Amounts in aettos** — internal representation uses aettos (smallest unit); use `toAe()` / `toAettos()` for conversion.
- **Network, not Chain** — Aeternity uses string network IDs (`ae_mainnet`, `ae_uat`), not numeric chain IDs.

### Commit conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Maintenance, deps, config |
| `refactor:` | Code restructuring without behavior change |
| `docs:` | Documentation only |
| `test:` | Adding/updating tests |
| `ci:` | CI/CD changes |

Use package scopes when applicable: `feat(core):`, `fix(react):`, `test(vue):`.

Keep the subject line under 72 characters.

## Making a pull request

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-new-feature
   ```

2. **Write code and tests** — ensure every new file has a matching `.test.ts`

3. **Verify everything passes**:
   ```bash
   pnpm check && pnpm check:types && pnpm test
   ```

4. **Add a changeset** for user-facing changes:
   ```bash
   pnpm changeset
   ```
   Follow the prompts to select affected packages and write a summary.

5. **Push and open a PR** targeting `main`

6. **Fill out the PR template** — describe your changes, test plan, and link related issues

## Changesets

We use [changesets](https://github.com/changesets/changesets) for versioning and changelogs.

- **User-facing changes** (new features, bug fixes, breaking changes) need a changeset
- **Internal changes** (refactors, CI, docs, tests) generally do not
- Choose the correct semver bump:
  - `patch` — bug fixes, small improvements
  - `minor` — new features, non-breaking additions
  - `major` — breaking changes

```bash
pnpm changeset
```

## Integration tests

Integration tests run against a local Aeternity node via Docker:

```bash
docker compose up -d
pnpm test:integration
docker compose down
```

These are gated behind the `INTEGRATION=true` environment variable and skipped in normal `pnpm test` runs.

## Documentation

The documentation site lives in `site/` and uses [VitePress](https://vitepress.dev/).

```bash
cd site
pnpm dev    # Start dev server
pnpm build  # Build for production
```

When adding a new action, hook, or composable, add a corresponding documentation page and update the sidebar in `site/.vitepress/config.ts`.

## Getting help

- Open a [GitHub Discussion](https://github.com/growae/reactive/discussions) for questions
- Check existing [issues](https://github.com/growae/reactive/issues) before filing a new one
- Join the Aeternity community channels for ecosystem-wide discussions

## License

By contributing to Reactive, you agree that your contributions will be licensed under the [MIT License](../LICENSE).
