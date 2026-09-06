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
import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
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

const PACKAGES = [
  { name: '@growae/reactive', tarball: 'growae-reactive.tgz' },
  {
    name: '@growae/reactive-connectors',
    tarball: 'growae-reactive-connectors.tgz',
  },
  { name: '@growae/reactive-react', tarball: 'growae-reactive-react.tgz' },
  { name: '@growae/reactive-solid', tarball: 'growae-reactive-solid.tgz' },
  { name: '@growae/reactive-vue', tarball: 'growae-reactive-vue.tgz' },
]

function run(command, args, cwd, options = {}) {
  console.log(
    `$ ${command} ${args.join(' ')}  (in ${path.relative(repoRoot, cwd) || '.'})`,
  )
  return execFileSync(command, args, { cwd, stdio: 'inherit', ...options })
}

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
// would, and `--ignore-workspace` keeps this monorepo's own resolution out of
// it.
//
// The `overrides` are load-bearing. `pnpm pack` rewrites
// `"@growae/reactive": "workspace:*"` in packages/connectors into a fixed
// version, so without them pnpm satisfies that dependency from the REGISTRY —
// and this gate then grades the last published release instead of the build in
// the tree. It fails either way while the published one is broken, which is
// how it was caught; the day that one is fixed the same silent substitution
// would turn the gate green on evidence about the wrong artifact.
const tarballSpec = Object.fromEntries(
  PACKAGES.map(({ name, tarball }) => [name, `file:../tarballs/${tarball}`]),
)

// `@tanstack/solid-query`, `@tanstack/vue-query`, `nuxt` and `@nuxt/kit` are
// declared as OPTIONAL peers, so pnpm's default auto-install-peers skips them
// in this scratch, `--ignore-workspace` consumer — unlike `@tanstack/react-query`,
// a required peer of `@growae/reactive-react`. The `./query` and `./nuxt`
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
      pnpm: { overrides: tarballSpec },
    },
    null,
    2,
  )}\n`,
)

run('pnpm', ['install', '--ignore-workspace'], consumerDir)

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
