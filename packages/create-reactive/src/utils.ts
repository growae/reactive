import * as fs from 'node:fs'
import * as path from 'node:path'

export function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, '')
}

export function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) copyDir(src, dest)
  else fs.copyFileSync(src, dest)
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

export function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  )
}

export function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-')
}

export function isEmpty(dirPath: string) {
  const files = fs.readdirSync(dirPath)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

export function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) return
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') continue
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

export type PkgManager = 'bun' | 'npm' | 'pnpm' | 'yarn'

// uuid <11.1.1, pulled in transitively via `@metamask/utils` (a dependency
// of `@growae/reactive-connectors`), carries a known advisory. Each package
// manager reads a different override mechanism, and pnpm and yarn's
// grammars are mutually exclusive within a single field, so the generated
// project must carry only the one key its own package manager reads.
const UUID_OVERRIDE_SELECTOR = 'uuid@<11.1.1'
const UUID_OVERRIDE_RANGE = '^11.1.1'
// pnpm's own path-selector grammar (`**/@metamask/utils/uuid`) is rejected
// with ERR_PNPM_INVALID_SELECTOR under `resolutions`, and yarn's path
// selector without `**/` only partially resolves — this is the one key
// verified to fully protect yarn 1.x without depending on pnpm ever reading
// the same field.
const YARN_UUID_RESOLUTION_KEY = '**/@metamask/utils/uuid'

/**
 * Mutates `pkg` in place with the uuid override npm, bun and yarn read
 * directly from `package.json`. Returns the `pnpm-workspace.yaml` contents
 * to write alongside it for pnpm, since pnpm 11 dropped the `pnpm.overrides`
 * package.json field pnpm 10 used to read and moved it to a workspace file
 * that both majors honour outside an actual multi-package workspace.
 */
export function applyUuidOverride(
  pkg: Record<string, unknown>,
  pkgManager: PkgManager,
): string | undefined {
  switch (pkgManager) {
    case 'npm':
    case 'bun':
      pkg.overrides = { [UUID_OVERRIDE_SELECTOR]: UUID_OVERRIDE_RANGE }
      return undefined
    case 'yarn':
      pkg.resolutions = { [YARN_UUID_RESOLUTION_KEY]: UUID_OVERRIDE_RANGE }
      return undefined
    case 'pnpm':
      return `overrides:\n  '${UUID_OVERRIDE_SELECTOR}': '${UUID_OVERRIDE_RANGE}'\n`
  }
}

export function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]!
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}

function parseVersionParts(version: string): number[] {
  return version.split('.').map((part) => {
    const n = Number.parseInt(part, 10)
    return Number.isNaN(n) ? 0 : n
  })
}

function compareVersionParts(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Minimal `engines`-style range check: space-separated comparators
 * (`>=`, `>`, `<=`, `<`, `=`), ANDed together — enough for floors like
 * `">=11"`, not a full semver range implementation.
 */
export function satisfiesEngineRange(version: string, range: string): boolean {
  const current = parseVersionParts(version)
  return range
    .trim()
    .split(/\s+/)
    .every((comparator) => {
      const match = comparator.match(/^(>=|<=|>|<|=)?(.+)$/)
      if (!match) return true
      const [, op = '>=', rawVersion] = match
      const cmp = compareVersionParts(current, parseVersionParts(rawVersion!))
      switch (op) {
        case '>=':
          return cmp >= 0
        case '<=':
          return cmp <= 0
        case '>':
          return cmp > 0
        case '<':
          return cmp < 0
        default:
          return cmp === 0
      }
    })
}
