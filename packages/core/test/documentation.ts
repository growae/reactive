import { readdirSync, readFileSync } from 'node:fs'

/**
 * The source-text reader the documentation guards share.
 *
 * `documentedParameters.test.ts` asks whether a `## Parameters` table names a
 * parameter the action's `*Parameters` type declares;
 * `documentedReturnTypes.test.ts` asks the same of a `## Return Type` block and
 * the action's `*ReturnType`. Both questions are about names TypeScript erases
 * before either test runs, so neither can ask a runtime export the way
 * `documentedErrors.test.ts` does — both read the declaration's source text,
 * and this is the one copy of that reading.
 *
 * It is deliberately loose wherever being loose only lets something through: a
 * declaration referencing another type of the same family unions that type's
 * paths in, because an `Omit` cannot be subtracted from source text, and a type
 * carrying an index signature accepts any name and is skipped.
 */

export type ActionPage = {
  /** File name, e.g. `getBalance.md`. */
  name: string
  /** Action name, e.g. `getBalance`. */
  action: string
  source: string
}

/** Every `*.md` page in a directory, as `{ name, action, source }`. */
export function readActionPages(dir: URL): ActionPage[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({
      name,
      action: name.replace(/\.md$/, ''),
      source: readFileSync(new URL(name, dir), 'utf8'),
    }))
}

/** Every non-test `.ts` file under a directory, recursively, as source text. */
export function readActionSources(dir: URL): string[] {
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((name) => name.endsWith('.ts') && !/\.test(-d)?\.ts$/.test(name))
    .map((name) => readFileSync(new URL(name, dir), 'utf8'))
}

/**
 * The dotted paths a braced body writes, for a TypeScript object type and a
 * JavaScript object literal alike — both are `key: value` with `{}` for
 * nesting, which is all this reads. String literals and comments are skipped
 * so that a `'Active account:'` inside an example is not mistaken for a key.
 *
 * A key written in shorthand (`{ sourceCode, onCompiler: compiler }`) has no
 * `:` and is not seen, which is why the example checks built on this are a
 * floor on the examples rather than a census of them. A destructuring pattern
 * is shorthand by definition and is read by `destructuredNames` instead.
 */
export function objectPaths(text: string): string[] {
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
export function declarationOf(
  source: string,
  typeName: string,
): string | undefined {
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

export const hasIndexSignature = (declaration: string) =>
  /\[\s*\w+\s*:\s*(string|number)\s*\]\s*\??:/.test(declaration)

/**
 * Every `export type <Name><suffix>` declaration in the sources, keyed by type
 * name. Two files can declare the same name — `claimName.ts` and
 * `aens/claimName.ts` do — so the declarations are kept together and their
 * paths unioned rather than one of them silently winning.
 */
export function collectDeclarations(
  sources: string[],
  suffix: string,
): Map<string, string[]> {
  const declarations = new Map<string, string[]>()
  const pattern = new RegExp(String.raw`^export type (\w+${suffix})\s*=`, 'gm')
  for (const source of sources) {
    for (const [, typeName] of source.matchAll(pattern)) {
      const text = declarationOf(source, typeName!)
      if (!text) continue
      declarations.set(typeName!, [
        ...(declarations.get(typeName!) ?? []),
        text,
      ])
    }
  }
  return declarations
}

export type ResolvedType = {
  /** The dotted field paths the type declares, across every union branch. */
  paths: Set<string>
  /**
   * Whether the type has an object shape at all, after aliases are followed.
   * `GetBalanceReturnType = string` does not; `ReadContractReturnType =
   * CallContractReturnType` does, through the alias. A page that documents
   * fields under a type that is not object-like is documenting a shape the
   * action cannot return, whatever the field names are.
   */
  objectLike: boolean
}

/**
 * The paths a type accepts, or `undefined` when it is not declared at all or
 * accepts anything through an index signature. Referenced types of the same
 * family — another `*Parameters`, another `*ReturnType` — are resolved to a
 * fixed point.
 */
export function resolveType(
  typeName: string,
  declarations: Map<string, string[]>,
  suffix: string,
): ResolvedType | undefined {
  if (!declarations.has(typeName)) return undefined

  const paths = new Set<string>()
  const seen = new Set<string>()
  const queue = [typeName]
  const reference = new RegExp(String.raw`\b(\w+${suffix})\b`, 'g')
  let objectLike = false

  while (queue.length > 0) {
    const current = queue.shift()!
    if (seen.has(current)) continue
    seen.add(current)
    for (const declaration of declarations.get(current) ?? []) {
      if (hasIndexSignature(declaration)) return undefined
      // The declaration's own body, not its name — `export type XReturnType =`
      // is dropped so the `=` right-hand side decides the shape.
      const body = declaration.slice(declaration.indexOf('=') + 1)
      if (body.includes('{')) objectLike = true
      for (const path of objectPaths(declaration)) paths.add(path)
      for (const [, referenced] of body.matchAll(reference))
        queue.push(referenced!)
    }
  }
  return { paths, objectLike }
}

/** A page's `## <heading>` section, up to the next level-2 heading. */
export function sectionOf(page: string, heading: string): string {
  const match = page.match(new RegExp(String.raw`^## ${heading}\s*$`, 'm'))
  if (!match) return ''
  const body = page.slice(match.index! + match[0].length)
  const next = body.match(/^## /m)
  return next ? body.slice(0, next.index) : body
}

/**
 * Every field a section names, from both shapes the pages use: a `### name`
 * heading and the first cell of a table row. A nested field is written as the
 * path it sits at — `options.ttl`, not `ttl`.
 */
export function documentedNames(section: string): string[] {
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

/**
 * The names a destructuring pattern binds, by the key each one reads —
 * `{ decodedResult: balance }` reads `decodedResult`, and a rest element binds
 * no key and is skipped.
 */
export function destructuredNames(pattern: string): string[] {
  return pattern
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.startsWith('...'))
    .map((part) => /^([A-Za-z_$][\w$]*)/.exec(part)?.[1])
    .filter((name): name is string => name !== undefined)
}
