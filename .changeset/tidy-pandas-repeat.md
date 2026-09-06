---
'@growae/reactive': patch
'@growae/reactive-connectors': patch
---

Emit ESM that Node can actually resolve.

`dist/esm` and `dist/types` shipped extensionless relative import specifiers.
`tsc` never rewrites a specifier, so `from '../createConfig'` in the source
became `from '../createConfig'` in the emitted JavaScript, and Node's ESM
resolver does no extension inference. Every published version so far —
0.0.1 through 0.0.6 — throws on the first import:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  .../@growae/reactive/dist/esm/createConfig
  imported from .../@growae/reactive/dist/esm/exports/index.js
```

This never surfaced in development because vite, webpack, esbuild and rollup
all infer the extension. It surfaces wherever Node's own resolver runs: a plain
Node script, a Next.js server component or route handler, any SSR entry,
Vitest in `node` environment without an alias, `node --import`. The declarations
carried the same specifiers, so a consumer on `moduleResolution: node16` or
`nodenext` also saw the public type surface collapse to nothing — silently,
with no error to read.

**Consumer-visible fix, no API change.** Every export, name and signature is
what it was; the same imports that already worked under a bundler keep working
unchanged, and the ones that failed under Node now resolve.

Relative imports in the sources now carry explicit `.js` extensions, and both
packages build under `moduleResolution: nodenext`, which makes omitting one a
compile error rather than something a reviewer has to notice. A new
`Node Resolution` CI job packs real tarballs, installs them into a scratch
`"type": "module"` package and imports every `exports` subpath under Node,
then type-checks the shipped declarations under `nodenext`; the same check runs
in the release workflow before anything is published.
