import { describe, expect, it } from 'vitest'
import {
  collectDeclarations,
  documentedNames,
  objectPaths,
  type ResolvedType,
  readActionPages,
  readActionSources,
  resolveType,
  sectionOf,
} from '../../test/documentation.js'

/**
 * The same question `documentedErrors.test.ts` asks of the error sections, one
 * heading up: does a `## Parameters` table name a parameter the action's
 * `*Parameters` type actually declares, at the place it declares it?
 *
 * It had drifted at least as far. Ten of the eighteen pages under
 * `site/core/api/actions/` documented names the type has never had —
 * `sendTransaction`'s `ttl`, `waitForConfirmation` and `confirmationBlocks`,
 * `callContract`'s `fn` and `gas`, `deployContract`'s `args`, `signMessage`'s
 * `account` — and `sendTransaction`'s worked example was written entirely in
 * the invented ones, so a reader who copied it got a call that waits for
 * nothing and says nothing about it.
 *
 * Nesting is checked, not flattened, because flattening is what would have let
 * the second half of the drift through: `spend` documented `ttl`, `nonce` and
 * `fee` as top-level parameters when all three live under `options`, and a
 * check that only asked whether the name exists somewhere would have passed
 * that page.
 *
 * A parameter name is erased before this test runs, so unlike the error check
 * there is no runtime export to ask. This is a source-text check — the reading
 * lives in `test/documentation.ts`, shared with the return-type guard — and it
 * is loose in the two directions where being loose only lets something
 * through: a declaration that references another `*Parameters` type unions that
 * type's paths in, because `ReadContractParameters` is an `Omit` of
 * `CallContractParameters` and an `Omit` cannot be subtracted from source text;
 * and a type carrying an index signature — `BuildTransactionParameters`, whose
 * remaining fields depend on the `tag` — accepts any name, so it is skipped.
 *
 * One direction only, matching the precedent: a page must not document a
 * parameter the type does not declare. The reverse is not asserted, because a
 * page is not obliged to document every optional field.
 */
const ACTIONS_DIR = new URL('.', import.meta.url)

const ACTION_PAGES_DIR = new URL(
  '../../../../site/core/api/actions/',
  import.meta.url,
)

const actionPages = readActionPages(ACTION_PAGES_DIR)

const declarations = collectDeclarations(
  readActionSources(ACTIONS_DIR),
  'Parameters',
)

const parametersTypeOf = (action: string) =>
  `${action[0]!.toUpperCase()}${action.slice(1)}Parameters`

/**
 * The paths `<Action>Parameters` accepts, or `undefined` when the action has no
 * parameters type or accepts anything through an index signature.
 */
const accepted = (action: string): ResolvedType | undefined =>
  resolveType(parametersTypeOf(action), declarations, 'Parameters')

const acceptedPaths = (action: string): Set<string> | undefined =>
  accepted(action)?.paths

/** The paths every `action(config, { … })` call on a page passes. */
function exampleCalls(page: string): { action: string; paths: string[] }[] {
  const calls: { action: string; paths: string[] }[] = []
  for (const match of page.matchAll(
    /\b([a-z][A-Za-z0-9]*)\s*\(\s*config\s*,\s*(\{)/g,
  )) {
    const open = match.index! + match[0].length - 1
    let depth = 0
    let close = -1
    for (let i = open; i < page.length; i++) {
      if (page[i] === '{') depth++
      else if (page[i] === '}' && --depth === 0) {
        close = i
        break
      }
    }
    if (close === -1) continue
    calls.push({
      action: match[1]!,
      paths: objectPaths(page.slice(open, close + 1)),
    })
  }
  return calls
}

describe('action API pages', () => {
  it.each(actionPages)(
    '$name documents only parameters $action declares',
    (page) => {
      const paths = acceptedPaths(page.action)
      const documented = documentedNames(sectionOf(page.source, 'Parameters'))
      if (!paths) {
        // No parameters type, or an index signature. Either way the only thing
        // left to check is that a page for an action with no parameters type
        // documents no parameters at all.
        if (!declarations.has(parametersTypeOf(page.action)))
          expect(documented).toEqual([])
        return
      }
      const invented = [...new Set(documented)]
        .filter((path) => !paths.has(path))
        .sort()
      expect(invented).toEqual([])
    },
  )

  it.each(actionPages)('$name writes examples in real parameters', (page) => {
    const invented = exampleCalls(page.source).flatMap(({ action, paths }) => {
      const declared = acceptedPaths(action)
      if (!declared) return []
      return paths
        .filter((path) => !declared.has(path))
        .map((path) => `${action}: ${path}`)
    })
    expect([...new Set(invented)].sort()).toEqual([])
  })

  it('reads pages and declarations that are actually there', () => {
    expect(actionPages.length).toBeGreaterThan(15)
    expect(declarations.size).toBeGreaterThan(15)
    // The check is worthless if the pages resolve to nothing: most of them must
    // reach a real `*Parameters` declaration, and those must carry real paths.
    const resolved = actionPages.flatMap((page) => [
      ...(acceptedPaths(page.action) ?? []),
    ])
    expect(resolved.length).toBeGreaterThan(12)
    expect(acceptedPaths('callContract')).toContain('options.gasLimit')
    expect(acceptedPaths('callContract')?.has('gasLimit')).toBe(false)
  })
})
