#!/usr/bin/env node
// Imports the BUILT package the way a consumer does: from a real tarball, in a
// scratch `"type": "module"` package, under Node's own ESM resolver.
//
// Every other test in this repository resolves `@growae/reactive` through the
// tsconfig `paths` alias to `src/`, and every playground resolves it through a
// bundler. Both infer missing file extensions; Node does not. That gap let
// 0.0.1 through 0.0.5 ship a `dist/esm` full of extensionless relative imports
// and fail `ERR_MODULE_NOT_FOUND` on the first `import` from a plain Node
// script, a Next.js server component, an SSR entry or Vitest in `node`
// environment — while every gate stayed green.
//
// So this check deliberately uses neither. It packs, installs and imports, and
// it also type-checks the shipped `dist/types` under `moduleResolution:
// nodenext`, because `tsc` writes the same unresolvable specifiers into the
// declarations and a consumer on Node16/NodeNext resolution sees an empty type
// surface rather than an error.
//
// `packages/react`, `packages/solid` and `packages/vue` are built by `tsc` the
// same way and carried the same defect; now that their sources carry explicit
// extensions, they are in PACKAGES alongside core and connectors.
//
// HOW TO RUN IT. Both of these are supported and do the same thing:
//
//   pnpm --filter @growae/reactive run test:node-resolution   (what CI runs)
//   node packages/core/scripts/test-node-resolution.mjs       (the shebang)
//
// They used to differ in a way nothing reported: the scratch consumer's
// anti-substitution overrides were read under one invocation and silently
// ignored under the other, and the gate then graded the last PUBLISHED release
// instead of the build in the tree. The banner below records the pnpm actually
// on PATH, and `assertNoSubstitution` re-derives the answer from the installed
// tree rather than trusting any override mechanism — so a difference between
// the two invocations can no longer change the verdict without saying so.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const corePackageRoot = path.resolve(fileURLToPath(import.meta.url), '../..')
const repoRoot = path.resolve(corePackageRoot, '../..')
const workDir = path.join(repoRoot, '.node-resolution-check')
const tarballDir = path.join(workDir, 'tarballs')
const consumerDir = path.join(workDir, 'consumer')

// Every entry the package's `exports` map exposes to a consumer, minus
// `./package.json`. A subpath missing here is a subpath nothing checks.
const SUBPATHS = [
  '@growae/reactive',
  '@growae/reactive/actions',
  '@growae/reactive/query',
  '@growae/reactive/networks',
  '@growae/reactive/connectors',
  '@growae/reactive/internal',
  '@growae/reactive-connectors',
  '@growae/reactive-react',
  '@growae/reactive-react/query',
  '@growae/reactive-solid',
  '@growae/reactive-solid/query',
  '@growae/reactive-vue',
  '@growae/reactive-vue/query',
  '@growae/reactive-vue/nuxt',
]

// `dir` is the package's directory under `packages/`. The post-install
// assertion hashes the entry file the tree just built there and requires the
// installed copy to be byte-identical, so every entry needs to say where its
// build output lives.
const PACKAGES = [
  { name: '@growae/reactive', dir: 'core', tarball: 'growae-reactive.tgz' },
  {
    name: '@growae/reactive-connectors',
    dir: 'connectors',
    tarball: 'growae-reactive-connectors.tgz',
  },
  {
    name: '@growae/reactive-react',
    dir: 'react',
    tarball: 'growae-reactive-react.tgz',
  },
  {
    name: '@growae/reactive-solid',
    dir: 'solid',
    tarball: 'growae-reactive-solid.tgz',
  },
  {
    name: '@growae/reactive-vue',
    dir: 'vue',
    tarball: 'growae-reactive-vue.tgz',
  },
]

// The four packages whose manifests carry `"@growae/reactive": "workspace:*"`.
// `pnpm pack` rewrites that to a plain version — `0.0.6` today — which the
// registry can satisfy, so each of these is a way for the published release to
// walk into this consumer under the name the tree is supposed to be providing.
const DEPENDENTS_ON_CORE = [
  '@growae/reactive-connectors',
  '@growae/reactive-react',
  '@growae/reactive-solid',
  '@growae/reactive-vue',
]

function run(command, args, cwd, options = {}) {
  console.log(
    `$ ${command} ${args.join(' ')}  (in ${path.relative(repoRoot, cwd) || '.'})`,
  )
  return execFileSync(command, args, { cwd, stdio: 'inherit', ...options })
}

// Which pnpm this run uses decides how the scratch consumer is resolved, and
// it is not always the one CI uses: `pnpm run` puts its own pnpm first on
// PATH, a bare `node` invocation takes whatever the shell has. Record it
// rather than let it stay invisible.
//
// TWO pnpms are involved and they are not always the same one. This one builds
// and packs, under this repository's `packageManager` pin. The one that
// installs the scratch consumer is read separately, at the consumer, because
// the consumer's generated manifest carries no `packageManager` field and its
// own `pnpm-workspace.yaml` stops corepack walking up to the pin — so a
// corepack-managed host can run the whole install on a different, newer pnpm
// than the one printed here. That is the pnpm whose behaviour this guard is
// about, and reading the version here would report the wrong one.
const pinnedPackageManager = JSON.parse(
  readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
).packageManager
function pnpmVersionIn(cwd) {
  return execFileSync('pnpm', ['--version'], { cwd, encoding: 'utf8' }).trim()
}
console.log(
  `node ${process.version} · pnpm ${pnpmVersionIn(repoRoot)} at the repo root · started via ${
    process.env.npm_lifecycle_event
      ? `pnpm run ${process.env.npm_lifecycle_event}`
      : 'a direct node invocation'
  }`,
)

rmSync(workDir, { recursive: true, force: true })
mkdirSync(tarballDir, { recursive: true })
mkdirSync(consumerDir, { recursive: true })

// The order matters: core's `./connectors` entry re-exports
// @growae/reactive-connectors, which itself types against core's `dist/types`,
// so core is built twice — bootstrap first, then again with that entry in.
run('pnpm', ['--filter', '@growae/reactive', 'run', 'build'], repoRoot)
run(
  'pnpm',
  ['--filter', '@growae/reactive', 'run', 'build:connectors'],
  repoRoot,
)
run('pnpm', ['--filter', '@growae/reactive-react', 'run', 'build'], repoRoot)
run('pnpm', ['--filter', '@growae/reactive-solid', 'run', 'build'], repoRoot)
run('pnpm', ['--filter', '@growae/reactive-vue', 'run', 'build'], repoRoot)

for (const { name, tarball } of PACKAGES) {
  run(
    'pnpm',
    ['--filter', name, 'pack', '--pack-destination', tarballDir],
    repoRoot,
  )
  const prefix = `${name.replace('@', '').replace('/', '-')}-`
  // The version follows the prefix, which is what keeps `growae-reactive-`
  // from also matching `growae-reactive-connectors-<version>.tgz`.
  const generated = readdirSync(tarballDir).find((f) =>
    new RegExp(`^${prefix}\\d[^/]*\\.tgz$`).test(f),
  )
  if (!generated)
    throw new Error(
      `pnpm pack did not produce a tarball matching ${prefix}*.tgz`,
    )
  renameSync(path.join(tarballDir, generated), path.join(tarballDir, tarball))
}

// `"type": "module"` and no bundler, no tsconfig `paths`, no vite alias.
// Third-party dependencies come from the registry exactly as a consumer's
// would.
//
// The `overrides` are load-bearing. `pnpm pack` rewrites
// `"@growae/reactive": "workspace:*"` in packages/connectors into a fixed
// version, so without them pnpm satisfies that dependency from the REGISTRY —
// and this gate then grades the last published release instead of the build in
// the tree. It fails either way while the published one is broken, which is
// how it was caught; the day that one is fixed the same silent substitution
// would turn the gate green on evidence about the wrong artifact.
//
// Which is why they are written TWICE, and why this install no longer passes
// `--ignore-workspace`. pnpm is moving settings out of the `pnpm` field in
// package.json and into `pnpm-workspace.yaml`; on the way it prints
//
//   [WARN] The "pnpm" field in package.json is no longer read by pnpm.
//
// and honours nothing. But `--ignore-workspace` makes pnpm ignore the
// consumer's own `pnpm-workspace.yaml` too, overrides included — measured on
// pnpm 10.33.0: with the overrides in the new home and `--ignore-workspace`
// still passed, all four dependents resolved `@growae/reactive` to the
// registry-published copy. So the new home only works without that flag, and
// the isolation it used to provide comes instead from the consumer having a
// `pnpm-workspace.yaml` of its own: pnpm stops walking up at the first
// workspace root it finds, and `packages: []` keeps this monorepo's own
// packages out of the graph.
//
// Neither home is trusted. `assertNoSubstitution` below re-derives what was
// actually installed, and that is what decides the verdict.
const tarballSpec = Object.fromEntries(
  PACKAGES.map(({ name, tarball }) => [name, `file:../tarballs/${tarball}`]),
)

// A negative control, for anyone who wants to see the guard fail rather than
// take its word for it: with this set the overrides are left out entirely, the
// registry copy is installed in their place, and the run MUST fail. It can
// only ever make the gate redder, never greener.
const negativeControl =
  process.env.NODE_RESOLUTION_CHECK_NEGATIVE_CONTROL === '1'
if (negativeControl)
  console.log(
    'NODE_RESOLUTION_CHECK_NEGATIVE_CONTROL=1 — installing WITHOUT the overrides; this run is expected to FAIL.',
  )
const overrides = negativeControl ? {} : tarballSpec

// `@tanstack/solid-query`, `@tanstack/vue-query`, `nuxt` and `@nuxt/kit` are
// declared as OPTIONAL peers, so pnpm's default auto-install-peers skips them
// in this scratch consumer — unlike `@tanstack/react-query`, a required peer
// of `@growae/reactive-react`. The `./query` and `./nuxt`
// subpaths import them unconditionally, so the consumer needs them as real
// dependencies. Read straight out of `packages/solid/package.json` and
// `packages/vue/package.json`'s own `devDependencies` — the versions those
// packages already test against — instead of a literal here that could drift
// from what they actually carry.
function devDependencyVersion(packageDir, dependencyName) {
  const manifestPath = path.join(
    repoRoot,
    'packages',
    packageDir,
    'package.json',
  )
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const version = manifest.devDependencies?.[dependencyName]
  if (!version)
    throw new Error(
      `${path.relative(repoRoot, manifestPath)} has no devDependency on ${dependencyName}`,
    )
  return version
}
const EXTRA_DEPENDENCIES = {
  '@tanstack/solid-query': devDependencyVersion(
    'solid',
    '@tanstack/solid-query',
  ),
  '@tanstack/vue-query': devDependencyVersion('vue', '@tanstack/vue-query'),
  nuxt: devDependencyVersion('vue', 'nuxt'),
  '@nuxt/kit': devDependencyVersion('vue', '@nuxt/kit'),
}

writeFileSync(
  path.join(consumerDir, 'package.json'),
  `${JSON.stringify(
    {
      name: 'node-resolution-consumer',
      version: '0.0.0',
      private: true,
      type: 'module',
      dependencies: { ...tarballSpec, ...EXTRA_DEPENDENCIES },
      // The old home. Still read by the pnpm this repository pins, ignored
      // with a warning by the versions that come after it.
      pnpm: { overrides },
    },
    null,
    2,
  )}\n`,
)

// The new home. Written as JSON — valid YAML, and the one form no quoting rule
// about `@` or `file:` can turn into a file pnpm reads as empty. It is written
// by hand rather than through a YAML library so this script keeps no
// dependency of its own; the guard has to run in a scratch directory before
// anything is installed there.
writeFileSync(
  path.join(consumerDir, 'pnpm-workspace.yaml'),
  `# Generated by packages/core/scripts/test-node-resolution.mjs.\n# \`packages: []\` makes this directory its own workspace root, which is what\n# keeps the monorepo above it out of this install.\n${JSON.stringify(
    { packages: [], overrides },
    null,
    2,
  )}\n`,
)

// The pnpm that actually installs the consumer — see the banner above for why
// it can differ from the one at the repo root. Read here, once the consumer's
// manifest exists, so the version reported is the version that resolved.
const consumerPnpmVersion = pnpmVersionIn(consumerDir)
console.log(`consumer install runs pnpm ${consumerPnpmVersion}`)
if (pinnedPackageManager !== `pnpm@${consumerPnpmVersion}`)
  console.log(
    `  note: this repository pins ${pinnedPackageManager}; the guard below does not depend on the version, but resolution details do.`,
  )

// `--ignore-scripts` is what makes the two supported invocations agree.
// pnpm 11 turns ignored dependency build scripts into a fatal
// ERR_PNPM_IGNORED_BUILDS — `bufferutil`, `core-js-pure`, `es5-ext`,
// `esbuild`, `utf-8-validate`, `vue-demi` here — and on its way out it
// rewrites this generated `pnpm-workspace.yaml` with an `allowBuilds` block
// whose values are the literal prose `set this to true or false` — it parses,
// it just cannot be used. Under a `pnpm run` parent the same install is only
// a warning. That is a gate whose verdict depends on how it was started,
// which is the defect this whole check exists to remove.
//
// Skipping them is not a workaround around a real signal: a consumer that
// resolves, imports and type-checks never needs a dependency's build scripts,
// and nothing below this line reads one. Pinning the consumer to the repo's
// pnpm would also make the two agree, and would buy that agreement by never
// exercising the newer pnpm this change exists for.
run('pnpm', ['install', '--ignore-scripts'], consumerDir)

// Everything above is a way of ASKING for the tarballs. This is the part that
// checks what was installed, and it trusts none of it: for every package, and
// then for `@growae/reactive` as seen from inside each package that depends on
// it, resolve the entry Node would actually load and require it to be the file
// this tree just built, byte for byte.
//
// Two properties are asserted, and the second is the one that matters. A
// registry copy lands under the consumer's own `node_modules/.pnpm` too, so
// "is it inside the scratch directory" cannot tell the two apart on its own —
// only the content hash can. The path check catches the other direction: a
// resolution that escaped to the monorepo's `packages/` or to a global store.
function packageEntryPath(packageDir) {
  const manifest = JSON.parse(
    readFileSync(path.join(packageDir, 'package.json'), 'utf8'),
  )
  const dot = manifest.exports?.['.']
  const entry = (typeof dot === 'string' ? dot : dot?.default) ?? manifest.main
  if (!entry)
    throw new Error(`${packageDir}/package.json declares no "." entry`)
  return path.join(packageDir, entry)
}

function hashOf(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

// What the tree built, keyed by package name — the only artifact this gate is
// allowed to be reporting on.
const builtEntryHash = new Map(
  PACKAGES.map(({ name, dir }) => [
    name,
    hashOf(packageEntryPath(path.join(repoRoot, 'packages', dir))),
  ]),
)

function assertResolvesToTreeBuild(name, fromDir, description) {
  // From the REALPATH: pnpm's consumer-level `node_modules/<name>` is a
  // symlink into the virtual store, and Node resolves a package's own
  // dependencies from where the files really are. Resolving from the symlink
  // would answer the top-level question a second time instead of the nested
  // one, which is exactly the question at issue here.
  const require_ = createRequire(
    realpathSync(path.join(fromDir, 'package.json')),
  )
  let resolved
  try {
    resolved = realpathSync(require_.resolve(name))
  } catch (error) {
    return `${description}: ${name} did not resolve at all (${error.code ?? error.message})`
  }
  const where = path.relative(repoRoot, resolved)
  if (!resolved.startsWith(`${workDir}${path.sep}`))
    return `${description}: ${name} resolved OUTSIDE the scratch consumer, to ${where}`
  if (hashOf(resolved) !== builtEntryHash.get(name))
    return `${description}: ${name} resolved to ${where}, which is NOT the build in this tree — a different copy of ${name} was substituted (the published release is the usual one). This gate would have been grading that copy.`
  console.log(`✔ ${description}: ${name} -> ${where}`)
  return null
}

const substitutions = []
for (const { name } of PACKAGES) {
  const failure = assertResolvesToTreeBuild(
    name,
    consumerDir,
    'consumer imports',
  )
  if (failure) substitutions.push(failure)
}
for (const dependent of DEPENDENTS_ON_CORE) {
  const failure = assertResolvesToTreeBuild(
    '@growae/reactive',
    path.join(consumerDir, 'node_modules', dependent),
    `inside ${dependent}`,
  )
  if (failure) substitutions.push(failure)
}

// Fail here rather than carrying on. Fourteen green import lines about the
// wrong artifact is the failure this whole check exists to prevent, and it
// reads exactly like a pass.
if (substitutions.length > 0) {
  console.log(
    `\nNode resolution check ABORTED — the scratch consumer is not testing this tree:\n${substitutions
      .map((f) => `  - ${f}`)
      .join(
        '\n',
      )}\n\nNothing below this line would have been evidence about the built packages.`,
  )
  rmSync(workDir, { recursive: true, force: true })
  process.exit(1)
}
console.log('✔ every resolution above is the build in this tree\n')

const failures = []

// Part one: does Node resolve and evaluate it. One process per subpath, so a
// failure names the entry that failed rather than the first one.
for (const subpath of SUBPATHS) {
  try {
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const m = await import(${JSON.stringify(subpath)})
         const n = Object.keys(m).length
         if (n === 0) throw new Error('resolved but exported nothing')
         console.log('  ' + ${JSON.stringify(subpath)} + ' -> ' + n + ' exports')`,
      ],
      { cwd: consumerDir, stdio: 'inherit' },
    )
    console.log(`✔ import ${subpath}`)
  } catch {
    console.log(`✗ import ${subpath}`)
    failures.push(`runtime import: ${subpath}`)
  }
}

// Part two: does a NodeNext-resolution consumer see the types. `tsc` emits the
// source's specifiers into `dist/types` unchanged, so extensionless relative
// re-exports there silently flatten the public type surface to nothing under
// Node16/NodeNext — no error, just missing members at every call site.
writeFileSync(
  path.join(consumerDir, 'tsconfig.json'),
  `${JSON.stringify(
    {
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        target: 'ES2021',
        lib: ['ES2022', 'DOM'],
        strict: true,
        noEmit: true,
        skipLibCheck: true,
      },
      include: ['types-check.ts'],
    },
    null,
    2,
  )}\n`,
)
writeFileSync(
  path.join(consumerDir, 'types-check.ts'),
  `${SUBPATHS.map((s, i) => `import type * as m${i} from '${s}'`).join('\n')}

// A namespace import alone proves nothing: when the declaration graph breaks,
// the module still RESOLVES, it just resolves to a surface with no members and
// tsc reports nothing at all. NonEmpty turns that silence into an error, and
// the named members below pin the entry surface by name.
type NonEmpty<T> = keyof T extends never
  ? 'module resolved, but its type surface is empty'
  : true
${SUBPATHS.map((_, i) => `const _${i}: NonEmpty<typeof m${i}> = true`).join('\n')}
export type Checked = [${SUBPATHS.map((_, i) => `typeof _${i}`).join(', ')}]

export type Config = m0.Config
export type Connector = m0.Connector
export type CreateConfigParameters = m0.CreateConfigParameters
`,
)

try {
  run(
    path.join(repoRoot, 'node_modules/.bin/tsc'),
    ['--project', 'tsconfig.json'],
    consumerDir,
  )
  console.log('✔ dist/types resolves under moduleResolution: nodenext')
} catch {
  console.log('✗ dist/types does not resolve under moduleResolution: nodenext')
  failures.push('type resolution under nodenext')
}

rmSync(workDir, { recursive: true, force: true })

if (failures.length > 0) {
  console.log(
    `\nNode resolution check failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`,
  )
  process.exit(1)
}

console.log('\nBuilt package resolves under Node ESM and NodeNext types.')
