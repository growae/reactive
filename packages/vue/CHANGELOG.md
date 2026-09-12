# @growae/reactive-vue

## 0.1.0

### Minor Changes

- **Breaking.** The core action changes in `@growae/reactive` 0.1.0 reach this
  package through its own exported types, so upgrading it is a breaking upgrade
  even though almost none of its own code changed.
  
  This package re-exports the core parameter and return types inside the types of
  its own hooks, primitives and composables, and those are part of its public
  surface. What a consumer has to change:
  
  - `useSendTransaction` — `connector` and the `options` bag (`options.verify`,
    `options.waitMined`) are gone from the variables it accepts, because they are
    gone from `SendTransactionParameters`. All three were read by nothing;
    passing one is now a compile error. Use the sibling `waitMined` field.
  - `useClaimName` — `salt` is `number` where it was `bigint | string`, and it is
    now optional.
  - `usePreclaimName` — resolves with `salt: number` where it was `bigint`. Code
    doing arithmetic on it, or passing it somewhere typed `bigint`, has to drop
    the conversion.
  - `useUpdateName` — takes `name` where it took `nameId`, gains
    `extendPointers`, and defaults `nameTtl` to 180000 rather than 50000. Pass
    `nameTtl` explicitly to keep the old lifetime.
  - `useClaimName`, `usePreclaimName` and `useUpdateName` reject with
    `ClaimNameNoAccountError`, `PreclaimNameNoAccountError` and
    `UpdateNameNoAccountError` where they rejected with a bare `Error`. Safe for
    anyone catching `Error`; breaking for anyone matching the message text.
  - `useTransferFunds` now signs before sending, so it completes a transfer that
    previously could not complete at all, and its `waitMined` default of `true`
    is honoured — it resolves after the transaction is mined rather than as soon
    as the node accepted it. Pass `waitMined: false` for the old timing.
  - `useWaitForTransaction` is bounded. It forwarded its parameters to the core
    action and supplied no timeout of its own, so `useWaitForTransaction({ hash })`
    polled a transaction that was never mined forever. It is now bounded by 5 key
    blocks and by the transaction's own ttl height, whichever is nearer.
  
  One fix in this release is this package's own, and it is consumer-visible:
  **it now emits ESM that Node can actually resolve.** `dist/esm` and
  `dist/types` shipped extensionless relative import specifiers, `tsc` never
  rewrites a specifier, and Node's ESM resolver does no extension inference, so
  every published version so far — 0.0.1 through 0.0.6 — throws on the first
  import:
  
  ```
  Error [ERR_MODULE_NOT_FOUND]: Cannot find module
    .../dist/esm/context
    imported from .../dist/esm/exports/index.js
  ```
  
  It never surfaced under vite, webpack, esbuild or rollup, all of which infer
  the extension. It surfaces wherever Node's own resolver runs: a plain Node
  script, a Next.js server component or route handler, any SSR entry, Vitest in
  the `node` environment, `node --import`. The declarations carried the same
  specifiers, so a consumer on `moduleResolution: node16` or `nodenext` also saw
  the public type surface collapse to nothing, silently, with no error to read.
  Relative imports now carry explicit `.js` extensions, the package builds under
  `moduleResolution: nodenext` so omitting one is a compile error rather than
  something a reviewer has to notice, and the `Node Resolution` CI job packs real
  tarballs and imports every `exports` subpath under Node.
  
  Apart from that, nothing in this package's own source changed. The version is a
  minor because what a consumer compiles against changed, not because the binding
  was rewritten.

### Patch Changes

- 8de7a92: Bound the declared Nuxt peer range to the majors that are tested.
  
  `peerDependencies.nuxt` and the Nuxt module's `compatibility.nuxt` move from
  `>=3.0.0` to `>=3.0.0 <5.0.0`. Both majors inside that range are now proven by
  a real `nuxt build` in CI against pinned Nuxt 3 and Nuxt 4 fixture apps; the
  previous open range vouched for every future major sight-unseen.
  
  **Consumer-visible.** No published Nuxt version is excluded by the cap — Nuxt 4
  is current — so nothing breaks today, but the declared surface has changed. A
  future Nuxt 5 will need this range widened deliberately, on evidence, rather
  than inheriting a claim nobody made.
  
  The floor stays at `3.0.0` and is not narrowed to the exact versions tested:
  the module uses only `defineNuxtModule`, `addPlugin`, `addImports` and
  `createResolver`, all stable in `@nuxt/kit` since 3.0.0.
- Updated dependencies [de3d9f5]
- Updated dependencies [d2eb066]
- Updated dependencies [7150cec]
- Updated dependencies [ae108e0]
- Updated dependencies [91ce459]
- Updated dependencies [3ceaf95]
  - @growae/reactive@0.1.0

## 0.0.6

### Patch Changes

- The manifest now declares `"license": "MIT"`. The licence has not changed and
  the `LICENSE` file was always shipped, but no `license` field reached npm for
  0.0.5, so registry metadata showed the package as unlicensed and dependency
  scanners read that as more restrictive than MIT rather than less.

- No API or behaviour change in this package, and no change to the `vue >=3.0.0`
  peer range. Internal test and build tooling (`nuxt`, `@nuxt/kit`,
  `@vue/test-utils`) moved within its existing ranges to clear advisories; `nuxt`
  is a peer dependency you supply, so none of that reaches your install.

- If you scaffold with `@growae/create-reactive`, its nuxt template now installs
  cleanly under plain `npm install` — see that package's 0.0.6 notes.

- Updated dependencies
  - @growae/reactive@0.0.6

## 0.0.5

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.5

## 0.0.4

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.4

## 0.0.3

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.3

## 0.0.2

### Patch Changes

- Release patch bump
- Updated dependencies
  - @growae/reactive@0.0.2
