import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

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
 * there is no runtime export to ask. This is a source-text check, and it is
 * loose in the two directions where being loose only lets something through:
 * a declaration that references another `*Parameters` type unions that type's
 * paths in, because `ReadContractParameters` is an `Omit` of
 * `CallContractParameters` and an `Omit` cannot be subtracted from source
 * text; and a type carrying an index signature — `BuildTransactionParameters`,
 * whose remaining fields depend on the `tag` — accepts any name, so it is
 * skipped.
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

const actionPages = readdirSync(ACTION_PAGES_DIR)
  .filter((name) => name.endsWith('.md'))
  .map((name) => ({
    name,
    action: name.replace(/\.md$/, ''),
    source: readFileSync(new URL(name, ACTION_PAGES_DIR), 'utf8'),
  }))

/**
 * The dotted paths a braced body writes, for a TypeScript object type and a
 * JavaScript object literal alike — both are `key: value` with `{}` for
 * nesting, which is all this reads. String literals and comments are skipped
 * so that a `'Active account:'` inside an example is not mistaken for a key.
 *
 * A key written in shorthand (`{ sourceCode, onCompiler: compiler }`) has no
 * `:` and is not seen, which is why the example check below is a floor on the
 * examples rather than a census of them.
 */
function objectPaths(text: string): string[] {
  const paths: string[] = []
  const stack: string[] = []
  let pending: string | undefined

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!

    if (char === "'" || char === '"' || char === '`') {
      for (i++; i < text.length && text[i] !== char; i++)
        if (text[i] === '\\') i++
      continue
    }
    if (char === '/' && text[i + 1] === '/') {
      i = text.indexOf('\n', i)
      if (i === -1) break
      continue
    }
    if (char === '/' && text[i + 1] === '*') {
      i = text.indexOf('*/', i)
      if (i === -1) break
      i++
      continue
    }

    if (char === '{') {
      stack.push(pending ?? '')
      pending = undefined
      continue
    }
    if (char === '}') {
      stack.pop()
      pending = undefined
      continue
    }
    if (char === ',' || char === ';' || char === '(' || char === '[') {
      pending = undefined
      continue
    }

    const rest = text.slice(i)
    const key = /^([A-Za-z_$][\w$]*)\??[ \t]*:/.exec(rest)
    if (key && !/[\w$.]/.test(text[i - 1] ?? '')) {
      pending = key[1]!
      paths.push([...stack, pending].filter(Boolean).join('.'))
      i += key[0].length - 1
    }
  }
  return paths
}

/**
 * The text of `export type <name> = …`, ended by the first newline reached
 * outside every bracket. A continued union or intersection is not an end, so a
 * declaration written as leading `|` lines is captured whole.
 */
function declarationOf(source: string, typeName: string): string | undefined {
  const start = source.indexOf(`export type ${typeName} =`)
  if (start === -1) return undefined

  let depth = 0
  for (let i = source.indexOf('=', start) + 1; i < source.length; i++) {
    const char = source[i]!
    if (char === '{' || char === '(' || char === '[') depth++
    else if (char === '}' || char === ')' || char === ']') depth--
    else if (char === '\n' && depth <= 0) {
      if (!/^\s*[|&]/.test(source.slice(i + 1))) return source.slice(start, i)
    }
  }
  return source.slice(start)
}

const actionSources = readdirSync(ACTIONS_DIR, { recursive: true })
  .map(String)
  .filter((name) => name.endsWith('.ts') && !/\.test(-d)?\.ts$/.test(name))
  .map((name) => readFileSync(new URL(name, ACTIONS_DIR), 'utf8'))

/**
 * Every `*Parameters` declaration in the tree, keyed by type name. Two files
 * can declare the same name — `claimName.ts` and `aens/claimName.ts` do — so
 * the declarations are kept together and their paths unioned rather than one
 * of them silently winning.
 */
const declarations = new Map<string, string[]>()
for (const source of actionSources) {
  for (const [, typeName] of source.matchAll(
    /^export type (\w+Parameters)\s*=/gm,
  )) {
    const text = declarationOf(source, typeName!)
    if (!text) continue
    declarations.set(typeName!, [...(declarations.get(typeName!) ?? []), text])
  }
}

const hasIndexSignature = (declaration: string) =>
  /\[\s*\w+\s*:\s*(string|number)\s*\]\s*\??:/.test(declaration)

const parametersTypeOf = (action: string) =>
  `${action[0]!.toUpperCase()}${action.slice(1)}Parameters`

/**
 * The paths `<Action>Parameters` accepts, or `undefined` when the action has no
 * parameters type or accepts anything through an index signature. Referenced
 * `*Parameters` types are resolved to a fixed point.
 */
function acceptedPaths(action: string): Set<string> | undefined {
  const root = parametersTypeOf(action)
  if (!declarations.has(root)) return undefined

  const paths = new Set<string>()
  const seen = new Set<string>()
  const queue = [root]
  while (queue.length > 0) {
    const typeName = queue.shift()!
    if (seen.has(typeName)) continue
    seen.add(typeName)
    for (const declaration of declarations.get(typeName) ?? []) {
      if (hasIndexSignature(declaration)) return undefined
      for (const path of objectPaths(declaration)) paths.add(path)
      for (const [, referenced] of declaration.matchAll(/\b(\w+Parameters)\b/g))
        queue.push(referenced!)
    }
  }
  return paths
}

/** The `## Parameters` section of a page, up to the next level-2 heading. */
function parametersSection(page: string): string {
  const match = page.match(/^## Parameters\s*$/m)
  if (!match) return ''
  const body = page.slice(match.index! + match[0].length)
  const next = body.match(/^## /m)
  return next ? body.slice(0, next.index) : body
}

/**
 * Every parameter a page's `## Parameters` section names, from both shapes the
 * pages use: a `### name` heading and the first cell of a table row. A nested
 * field is written as the path it sits at — `options.ttl`, not `ttl`.
 */
function documentedPaths(page: string): string[] {
  const section = parametersSection(page)
  return [
    ...Array.from(
      section.matchAll(/^### `?([A-Za-z_$][\w$.]*)`?\s*$/gm),
      (m) => m[1]!,
    ),
    ...Array.from(
      section.matchAll(/^\|\s*`([A-Za-z_$][\w$.]*)`\s*\|/gm),
      (m) => m[1]!,
    ),
  ]
}

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
      const accepted = acceptedPaths(page.action)
      const documented = documentedPaths(page.source)
      if (!accepted) {
        // No parameters type, or an index signature. Either way the only thing
        // left to check is that a page for an action with no parameters type
        // documents no parameters at all.
        if (!declarations.has(parametersTypeOf(page.action)))
          expect(documented).toEqual([])
        return
      }
      const invented = [...new Set(documented)]
        .filter((path) => !accepted.has(path))
        .sort()
      expect(invented).toEqual([])
    },
  )

  it.each(actionPages)('$name writes examples in real parameters', (page) => {
    const invented = exampleCalls(page.source).flatMap(({ action, paths }) => {
      const accepted = acceptedPaths(action)
      if (!accepted) return []
      return paths
        .filter((path) => !accepted.has(path))
        .map((path) => `${action}: ${path}`)
    })
    expect([...new Set(invented)].sort()).toEqual([])
  })

  it('reads pages and declarations that are actually there', () => {
    expect(actionPages.length).toBeGreaterThan(15)
    expect(declarations.size).toBeGreaterThan(15)
    // The check is worthless if the pages resolve to nothing: most of them must
    // reach a real `*Parameters` declaration, and those must carry real paths.
    const resolved = actionPages.flatMap(
      (page) => acceptedPaths(page.action) ?? [],
    )
    expect(resolved.length).toBeGreaterThan(12)
    expect(acceptedPaths('callContract')).toContain('options.gasLimit')
    expect(acceptedPaths('callContract')?.has('gasLimit')).toBe(false)
  })
})
