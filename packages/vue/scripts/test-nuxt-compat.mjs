#!/usr/bin/env node
// Builds a real Nuxt app against @growae/reactive-vue for both nuxt majors
// the module claims to support (nuxt.config's `compatibility.nuxt: '>=3.0.0'`
// and the package's `peerDependencies.nuxt`). A passing `tsc --noEmit` proves
// nothing about whether Nuxt can actually load the module — Nuxt resolves
// `nuxt`, `@nuxt/kit` and `nuxt/app` relative to the *consuming app*, not to
// this monorepo's own devDependencies, so the fixtures install the module
// from a real tarball (never a workspace `link:`) to reproduce what an
// external consumer's node_modules layout actually looks like.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const vuePackageRoot = path.resolve(fileURLToPath(import.meta.url), '../..')
const repoRoot = path.resolve(vuePackageRoot, '../..')
const tarballDir = path.join(repoRoot, '.nuxt-compat-tarballs')
const fixturesDir = path.join(vuePackageRoot, 'test/fixtures')
// One CLI arg selects a single fixture, for a CI matrix leg that wants an
// isolated pass/fail per nuxt major; no arg builds both, for local use.
const requested = process.argv[2]
const fixtures = requested ? [requested] : ['nuxt3-app', 'nuxt4-app']

function run(command, args, cwd) {
  console.log(
    `$ ${command} ${args.join(' ')}  (in ${path.relative(repoRoot, cwd)})`,
  )
  execFileSync(command, args, { cwd, stdio: 'inherit' })
}

rmSync(tarballDir, { recursive: true, force: true })
mkdirSync(tarballDir, { recursive: true })

run('pnpm', ['--filter', '@growae/reactive', 'run', 'build'], repoRoot)
run('pnpm', ['--filter', '@growae/reactive-vue', 'run', 'build'], repoRoot)
run(
  'pnpm',
  ['--filter', '@growae/reactive', 'pack', '--pack-destination', tarballDir],
  repoRoot,
)
run(
  'pnpm',
  [
    '--filter',
    '@growae/reactive-vue',
    'pack',
    '--pack-destination',
    tarballDir,
  ],
  repoRoot,
)

for (const [pkgName, fixedName] of [
  ['growae-reactive-', 'growae-reactive.tgz'],
  ['growae-reactive-vue-', 'growae-reactive-vue.tgz'],
]) {
  const generated = readdirSync(tarballDir).find(
    (f) => f.startsWith(pkgName) && f.endsWith('.tgz'),
  )
  if (!generated)
    throw new Error(
      `pnpm pack did not produce a tarball matching ${pkgName}*.tgz`,
    )
  execFileSync('mv', [
    path.join(tarballDir, generated),
    path.join(tarballDir, fixedName),
  ])
}

const failures = []

for (const fixture of fixtures) {
  const fixtureDir = path.join(fixturesDir, fixture)
  rmSync(path.join(fixtureDir, 'node_modules'), {
    recursive: true,
    force: true,
  })
  rmSync(path.join(fixtureDir, '.nuxt'), { recursive: true, force: true })
  rmSync(path.join(fixtureDir, '.output'), { recursive: true, force: true })
  rmSync(path.join(fixtureDir, 'pnpm-lock.yaml'), { force: true })

  try {
    run('pnpm', ['install', '--ignore-workspace'], fixtureDir)
    run('pnpm', ['exec', 'nuxt', 'build'], fixtureDir)
    console.log(`✔ ${fixture} built`)
  } catch (error) {
    console.log(`✗ ${fixture} failed: ${error.message}`)
    failures.push(fixture)
  }
}

rmSync(tarballDir, { recursive: true, force: true })

if (failures.length > 0) {
  console.log(`\nnuxt compat build failed for: ${failures.join(', ')}`)
  process.exit(1)
}

console.log('\nAll nuxt compat fixture builds passed.')
