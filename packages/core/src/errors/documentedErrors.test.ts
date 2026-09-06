import { readdirSync, readFileSync } from 'node:fs'
import * as reactive from '@growae/reactive'
import { describe, expect, it } from 'vitest'

/**
 * The error-handling guide is the page a consumer copies from, and it drifted
 * far enough that ten of the fourteen classes it named did not exist and its
 * headline example failed on its first import. Reasoning about the export
 * surface is what produced that page, so this test does not reason about it:
 * it reads the shipped markdown and asks the package itself.
 *
 * Both directions matter. A name in the guide that is not an export is the
 * defect that was found; an exported error class the guide never names is how
 * that page fell eleven classes behind the code in the first place.
 */
const GUIDE = readFileSync(
  new URL('../../../../site/core/guides/error-handling.md', import.meta.url),
  'utf8',
)

/** Every `` `SomethingError` `` the guide names, in code spans or code blocks. */
const documented = new Set(
  Array.from(GUIDE.matchAll(/\b([A-Z][A-Za-z0-9]*Error)\b/g), (m) => m[1]!),
)

/** Every error class the package root actually exports. */
const exported = new Set(
  Object.entries(reactive)
    .filter(
      ([name, value]) => /Error$/.test(name) && typeof value === 'function',
    )
    .map(([name]) => name),
)

describe('error-handling guide', () => {
  it('names only errors the package exports', () => {
    const missing = [...documented].filter((name) => !exported.has(name)).sort()
    expect(missing).toEqual([])
  })

  it('names every error the package exports', () => {
    const undocumented = [...exported]
      .filter((name) => !documented.has(name))
      .sort()
    expect(undocumented).toEqual([])
  })

  it('reads a guide that is actually there', () => {
    expect(documented.size).toBeGreaterThan(20)
    expect(exported.size).toBeGreaterThan(20)
  })
})

/**
 * The same question, asked of the per-action API pages.
 *
 * The guide check above reads one file, so `site/core/api/actions/` drifted
 * behind it unnoticed: fifteen of the eighteen pages named at least one error
 * class the package has never exported — `NodeRequestError`,
 * `InsufficientBalanceError`, `ContractCallError` and eight more, none of them
 * real. A consumer's first check on those pages was their own `tsc`.
 *
 * Only one direction is checked here. A page must not name an error class that
 * is not an export; a page is not obliged to name every export, because most
 * actions raise a handful of the package's classes and nothing else.
 */
const ACTION_PAGES_DIR = new URL(
  '../../../../site/core/api/actions/',
  import.meta.url,
)

const actionPages = readdirSync(ACTION_PAGES_DIR)
  .filter((name) => name.endsWith('.md'))
  .map((name) => ({
    name,
    source: readFileSync(new URL(name, ACTION_PAGES_DIR), 'utf8'),
  }))

/**
 * Every non-test source file in `@growae/reactive`, concatenated, for the
 * declaration check below.
 */
const PACKAGE_SOURCE = (() => {
  const root = new URL('../', import.meta.url)
  return readdirSync(root, { recursive: true })
    .map(String)
    .filter((name) => name.endsWith('.ts') && !/\.test(-d)?\.ts$/.test(name))
    .map((name) => readFileSync(new URL(name, root), 'utf8'))
    .join('\n')
})()

describe('action API pages', () => {
  it.each(actionPages)(
    '$name names only errors the package exports',
    (page) => {
      const named = new Set(
        Array.from(
          page.source.matchAll(/\b([A-Z][A-Za-z0-9]*Error)\b/g),
          (m) => m[1]!,
        ),
      )
      const missing = [...named].filter((name) => !exported.has(name)).sort()
      expect(missing).toEqual([])
    },
  )

  /**
   * The `*ErrorType` aliases the pages tell a reader to import are erased
   * before this test runs, so they cannot be read off the package the way the
   * classes are. `readContract.md` imported `ReadContractErrorType`, which is
   * declared nowhere — a source-text check catches that, and is honest about
   * being weaker than the class check: it proves the alias is declared and
   * exported from its own module, not that it is reachable from the root.
   */
  it.each(actionPages)(
    '$name imports only error type aliases that are declared',
    (page) => {
      const imported = Array.from(
        page.source.matchAll(
          /import type \{\s*([A-Za-z0-9,\s]+?)\s*\} from '@growae\/reactive'/g,
        ),
        (m) => m[1]!.split(',').map((x) => x.trim()),
      )
        .flat()
        .filter((name) => name.endsWith('ErrorType'))

      const undeclared = imported.filter(
        (name) =>
          !new RegExp(`export type ${name}\\b`).test(PACKAGE_SOURCE) &&
          !exported.has(name.replace(/Type$/, '')),
      )
      expect(undeclared).toEqual([])
    },
  )

  it('reads pages that are actually there', () => {
    expect(actionPages.length).toBeGreaterThan(15)
  })
})
