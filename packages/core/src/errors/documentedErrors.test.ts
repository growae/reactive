import { readFileSync } from 'node:fs'
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
