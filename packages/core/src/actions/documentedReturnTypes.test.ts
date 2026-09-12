import { describe, expect, it } from 'vitest'
import {
  collectDeclarations,
  destructuredNames,
  documentedNames,
  objectPaths,
  type ResolvedType,
  readActionPages,
  readActionSources,
  resolveType,
  sectionOf,
} from '../../test/documentation.js'

/**
 * The same question `documentedParameters.test.ts` asks of the `## Parameters`
 * tables, one heading over: does a `## Return Type` block describe the shape
 * the action's `*ReturnType` actually declares?
 *
 * It had drifted the same way and further. `getBalance` documented
 * `{ aettos: bigint; ae: string }` with a `### aettos` and a `### ae` section
 * under it when `GetBalanceReturnType` is `string`, so a reader who
 * destructured `{ ae }` got `undefined`; `signMessage` documented an `address`
 * the action has never returned; `callContract` documented `result` as always
 * present when it is optional and omitted `decodedResult`, the field carrying
 * the call's actual return value, entirely; `transferFunds` omitted three
 * fields; and `readContract` claimed the return type is inferred from the ACI
 * through generics when nothing on either action is generic.
 *
 * A return type name is erased before this test runs exactly as a parameter
 * name is, so this is a source-text check over the same reader
 * (`test/documentation.ts`), with the same looseness: an alias to another
 * `*ReturnType` unions that type's fields in — `ReadContractReturnType` *is*
 * `CallContractReturnType` — and a type with an index signature accepts any
 * name and is skipped.
 *
 * Two things differ from the parameters guard rather than being copied from it.
 *
 * A `*ReturnType` need not be an object at all: `GetBalanceReturnType` is
 * `string` and `WaitForTransactionConfirmReturnType` is `number`. A page that
 * documents `### field` sections under one of those is describing a shape the
 * action cannot return whatever the field names say, and the parameters guard
 * has no equivalent of that — every `*Parameters` is an object. It is checked
 * here as its own failure, before names are compared.
 *
 * And the direction is one way for a different reason. On parameters, the
 * reverse is not asserted because a page need not document every optional
 * field; here the reverse is not asserted for the same reason, but the forward
 * direction is the whole defect class — every page above documented a field the
 * type does not have.
 */
const ACTIONS_DIR = new URL('.', import.meta.url)

const ACTION_PAGES_DIR = new URL(
  '../../../../site/core/api/actions/',
  import.meta.url,
)

const actionPages = readActionPages(ACTION_PAGES_DIR)

const declarations = collectDeclarations(
  readActionSources(ACTIONS_DIR),
  'ReturnType',
)

const returnTypeOf = (action: string) =>
  `${action[0]!.toUpperCase()}${action.slice(1)}ReturnType`

/**
 * What `<Action>ReturnType` resolves to, or `undefined` when the action has no
 * return type or accepts anything through an index signature.
 */
const returns = (action: string): ResolvedType | undefined =>
  resolveType(returnTypeOf(action), declarations, 'ReturnType')

/**
 * The fenced blocks in a `## Return Type` section that declare the shape —
 * `type XReturnType = { … }` — with the type name each one gives itself and the
 * paths it writes. A fenced block that declares nothing is a worked example and
 * is left to the destructuring check below; reading its paths would mistake the
 * `address`/`aci`/`method` of an example call for return fields.
 */
function declaredShapes(
  section: string,
): { typeName: string; paths: string[] }[] {
  return Array.from(section.matchAll(/```[a-z]*\n([\s\S]*?)```/g))
    .map((match) => match[1]!)
    .flatMap((block) => {
      const declared = /\btype\s+(\w+)\s*=/.exec(block)
      if (!declared) return []
      return [{ typeName: declared[1]!, paths: objectPaths(block) }]
    })
}

/**
 * The documented paths worth comparing against a type's own.
 *
 * A page may legitimately inline the shape of a type the declaration only
 * names — `pointers: NamePointer[]` written out as
 * `Array<{ key: string; id: string }>`. The declaration's source text has no
 * `key` or `id` under `pointers`, so those would read as invented. A nested
 * path is therefore checked only where the declaration itself nests: if the
 * type declares fields under the parent, the page's fields under that parent
 * must be among them; if it declares none, the page is expanding a named type
 * this reader cannot follow and its children are left alone. Loose only in the
 * direction that lets something through, as everywhere else here.
 */
function comparablePaths(
  documented: string[],
  declared: Set<string>,
): string[] {
  const nests = (parent: string) =>
    [...declared].some((path) => path.startsWith(`${parent}.`))
  return documented.filter((path) => {
    const parts = path.split('.')
    for (let i = 1; i < parts.length; i++)
      if (!nests(parts.slice(0, i).join('.'))) return false
    return true
  })
}

/**
 * Every `const { … } = [await] action(config …)` on a page, by the keys it
 * reads. This is the shape the `getBalance` defect reached a reader through, so
 * it is checked separately from the `### field` sections: a page can carry a
 * correct `## Return Type` block and still hand out an example that binds
 * `undefined`.
 */
function destructuredCalls(
  page: string,
): { action: string; names: string[] }[] {
  return Array.from(
    page.matchAll(
      /const\s*\{([^{}]*)\}\s*=\s*(?:await\s+)?([a-z][A-Za-z0-9]*)\s*\(\s*config\s*[,)]/g,
    ),
    (match) => ({ action: match[2]!, names: destructuredNames(match[1]!) }),
  )
}

describe('action API pages', () => {
  it.each(actionPages)('$name documents the shape $action returns', (page) => {
    const section = sectionOf(page.source, 'Return Type')
    const shapes = declaredShapes(section)
    const documented = [
      ...new Set([
        ...documentedNames(section),
        ...shapes.flatMap((shape) => shape.paths),
      ]),
    ]
    const returned = returns(page.action)

    // A block that declares a shape must declare the action's own return
    // type, not some neighbouring one.
    expect(shapes.map((shape) => shape.typeName)).toEqual(
      shapes.map(() => returnTypeOf(page.action)),
    )

    if (!returned) {
      // No return type declared, or one that accepts any name. A page for an
      // action with no `*ReturnType` at all has nothing to document fields
      // against.
      if (!declarations.has(returnTypeOf(page.action)))
        expect(documented).toEqual([])
      return
    }

    // A non-object return type first: `string` has no fields, so documenting
    // any is wrong before the question of which ones arises.
    if (!returned.objectLike) {
      expect({
        returnType: returnTypeOf(page.action),
        objectLike: returned.objectLike,
        documented,
      }).toEqual({
        returnType: returnTypeOf(page.action),
        objectLike: false,
        documented: [],
      })
      return
    }

    const invented = comparablePaths(documented, returned.paths)
      .filter((path) => !returned.paths.has(path))
      .sort()
    expect(invented).toEqual([])
  })

  it.each(actionPages)('$name destructures fields that exist', (page) => {
    const invented = destructuredCalls(page.source).flatMap(
      ({ action, names }) => {
        const returned = returns(action)
        if (!returned) return []
        if (!returned.objectLike)
          return names.map((name) => `${action}: ${name} (not an object)`)
        return names
          .filter((name) => !returned.paths.has(name))
          .map((name) => `${action}: ${name}`)
      },
    )
    expect([...new Set(invented)].sort()).toEqual([])
  })

  it('reads pages and declarations that are actually there', () => {
    expect(actionPages.length).toBeGreaterThan(15)
    expect(declarations.size).toBeGreaterThan(15)
    // Worthless if the pages resolve to nothing: most must reach a real
    // `*ReturnType`, and the four readings this guard depends on must hold.
    const resolved = actionPages.filter((page) => returns(page.action))
    expect(resolved.length).toBeGreaterThan(12)
    // An object type's fields are read.
    expect(returns('callContract')?.paths).toContain('decodedResult')
    expect(returns('callContract')?.objectLike).toBe(true)
    // A union of object branches contributes every branch's fields.
    expect(returns('getActiveAccount')?.paths).toContain('isConnected')
    // An alias resolves through to the type it names.
    expect(returns('readContract')?.paths).toContain('decodedResult')
    // And a non-object return type is seen as one.
    expect(returns('getBalance')?.objectLike).toBe(false)
    expect(returns('waitForTransactionConfirm')?.objectLike).toBe(false)
  })
})
