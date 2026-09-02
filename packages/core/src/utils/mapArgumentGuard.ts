/**
 * Locating the `map` arguments of a contract call, so that
 * `detectMapKeyOrderDisagreement` can be asked about the keys actually present.
 *
 * The key type cannot be read off the JavaScript values: a `bits` key and an
 * `int` key are both a `bigint`, and `int` keys order identically in both
 * implementations, so refusing on the value alone would refuse working calls.
 * The ACI is what distinguishes them, and it is already a required parameter of
 * `callContract`.
 *
 * This walk mirrors `TypeResolver` and the data factories of
 * `@aeternity/aepp-calldata` 1.9.1 — the same last-ACI-entry contract the sdk
 * picks in `Contract.initialize`, the same typedef resolution, the same
 * singleton tuple/record unboxing — because the question is what *that* encoder
 * will be handed, not what the ACI means in the abstract.
 *
 * It is deliberately incomplete and deliberately asymmetric. Anything it cannot
 * resolve confidently — a variant, a type it does not know, a value whose shape
 * does not match its type — it stops descending into. A miss costs today's
 * behaviour, which is the defect this guard exists to name; a false positive
 * would refuse a call the node accepts, which is a regression shipped to fix a
 * defect. Every branch below is written to fail towards the miss.
 */

import {
  detectMapKeyOrderDisagreement,
  type FateMapKey,
  type FateMapKeyType,
  type MapKeyOrderDisagreement,
} from './fateMapKeyOrder'

export type MapKeyOrderDefect = MapKeyOrderDisagreement & {
  /** Where in the call's arguments the map sits, e.g. `entries` or `rows[0].tags`. */
  path: string
}

/** Cycles are impossible in an ACI, but a hostile or generated one is not our problem to prove. */
const MAX_TYPE_DEPTH = 32
/** A caller's argument can be cyclic; the `seen` set catches that, this catches depth. */
const MAX_VALUE_DEPTH = 32

type ResolvedType =
  | { kind: 'primitive'; name: string }
  | { kind: 'map'; key: ResolvedType; value: ResolvedType }
  | { kind: 'set'; item: ResolvedType }
  | { kind: 'list'; item: ResolvedType }
  | { kind: 'tuple'; items: ResolvedType[] }
  | { kind: 'record'; fields: { name: string; type: ResolvedType }[] }
  | { kind: 'option'; value: ResolvedType }
  /** Resolvable in principle, not resolved here — descent stops. */
  | { kind: 'opaque' }

const OPAQUE: ResolvedType = { kind: 'opaque' }

type Vars = Record<string, unknown>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The single `{ key: value }` pair an ACI compound type is written as. */
function unwrapCompound(
  type: unknown,
): { key: string; valueTypes: unknown } | undefined {
  if (!isPlainObject(type)) return undefined
  const entries = Object.entries(type)
  if (entries.length !== 1) return undefined
  const [key, valueTypes] = entries[0]!
  return { key, valueTypes }
}

/** `AciTypeResolver.getNamespaceAci` — a contract or namespace entry by name. */
function namespaceAci(aci: unknown[], name: string): any {
  for (const entry of aci) {
    if (!isPlainObject(entry)) continue
    const values = Object.values(entry)
    if (values.length !== 1) continue
    const data = values[0]
    if (isPlainObject(data) && data.name === name) return data
  }
  return undefined
}

/**
 * `AciTypeResolver.resolveTypeDef` — a named type to the type it stands for,
 * with its type variables bound. Returns `undefined` where the reference would
 * throw, so an ACI this walk does not understand degrades to a miss.
 */
function resolveTypeDef(
  aci: unknown[],
  type: string,
  params: unknown,
): { typedef: unknown; vars: Vars } | undefined {
  const [namespace, localType] = type.split('.')
  const data = namespaceAci(aci, namespace!)
  if (!data) return undefined
  // A bare contract name is an address, not a type definition.
  if (data.name === type) return { typedef: 'contract_pubkey', vars: {} }
  if (localType === undefined) return undefined

  const definitions = [
    ...(data.typedefs ?? data.type_defs ?? []),
    ...(data.state ? [{ name: 'state', typedef: data.state, vars: [] }] : []),
  ]
  const definition = definitions.find((e: any) => e?.name === localType)
  if (!definition) return undefined

  const vars: Vars = {}
  const params_ = Array.isArray(params) ? params : []
  for (const [i, entry] of (definition.vars ?? []).entries()) {
    if (!isPlainObject(entry)) continue
    const name = Object.values(entry)[0]
    if (typeof name === 'string') vars[name] = params_[i]
  }

  const typedef =
    typeof definition.typedef === 'string' &&
    Object.hasOwn(vars, definition.typedef)
      ? vars[definition.typedef]
      : definition.typedef
  return { typedef, vars }
}

function isStdType(type: string): boolean {
  return type === 'Set.set'
}

function isCustomType(aci: unknown[], type: unknown): type is string {
  if (typeof type !== 'string' || isStdType(type)) return false
  const [namespace] = type.split('.')
  return namespaceAci(aci, namespace!) !== undefined
}

function resolveValueTypes(
  aci: unknown[],
  valueTypes: unknown,
  vars: Vars,
  depth: number,
): ResolvedType[] {
  if (!Array.isArray(valueTypes)) return []
  return valueTypes.map((entry) => {
    const template =
      isPlainObject(entry) && Object.hasOwn(entry, 'type') ? entry.type : entry
    const bound =
      typeof template === 'string' && Object.hasOwn(vars, template)
        ? vars[template]
        : template
    return resolveType(aci, bound, vars, depth + 1)
  })
}

/** `TypeResolver.resolveType`, reduced to what this walk needs to descend. */
function resolveType(
  aci: unknown[],
  type: unknown,
  vars: Vars = {},
  depth = 0,
): ResolvedType {
  if (depth > MAX_TYPE_DEPTH) return OPAQUE

  const compound = unwrapCompound(type)
  const key = compound ? compound.key : type
  const valueTypes = compound ? compound.valueTypes : []

  if (isCustomType(aci, key)) {
    const resolved = resolveTypeDef(aci, key, valueTypes)
    if (!resolved) return OPAQUE
    return resolveType(aci, resolved.typedef, resolved.vars, depth + 1)
  }

  if (typeof key !== 'string') return OPAQUE

  // A variant's JavaScript shape is not fixed by the ACI, so descending into
  // one risks reading a caller's object as something it is not. `option` is
  // handled below because its shape *is* fixed.
  if (key === 'variant') return OPAQUE

  if (key === 'map') {
    const [k, v] = resolveValueTypes(aci, valueTypes, vars, depth)
    if (!k || !v) return OPAQUE
    return { kind: 'map', key: k, value: v }
  }

  // `Set.set(t)` is serialised as `map(t, unit)` by the same map serialiser and
  // sorted by the same comparator, so it reaches the defect by the same route.
  if (key === 'Set.set') {
    const [item] = resolveValueTypes(aci, valueTypes, vars, depth)
    return item ? { kind: 'set', item } : OPAQUE
  }

  if (key === 'list') {
    const [item] = resolveValueTypes(aci, valueTypes, vars, depth)
    return item ? { kind: 'list', item } : OPAQUE
  }

  if (key === 'option') {
    const [value] = resolveValueTypes(aci, valueTypes, vars, depth)
    return value ? { kind: 'option', value } : OPAQUE
  }

  if (key === 'tuple' || key === 'record') {
    const resolved = resolveValueTypes(aci, valueTypes, vars, depth)
    // Singleton tuples and records are unboxed by the reference resolver, so
    // the caller passes the inner value directly rather than a container.
    // https://github.com/aeternity/aesophia/pull/205
    if (resolved.length === 1) return resolved[0]!
    if (key === 'tuple') return { kind: 'tuple', items: resolved }
    const names = Array.isArray(valueTypes)
      ? valueTypes.map((e) => (isPlainObject(e) ? e.name : undefined))
      : []
    const fields = resolved.map((fieldType, i) => ({
      name: names[i],
      type: fieldType,
    }))
    if (fields.some((f) => typeof f.name !== 'string')) return OPAQUE
    return {
      kind: 'record',
      fields: fields as { name: string; type: ResolvedType }[],
    }
  }

  return { kind: 'primitive', name: key }
}

/** The key type of a map, when it is one of the two this guard covers. */
function guardedKeyType(type: ResolvedType): FateMapKeyType | undefined {
  if (type.kind !== 'primitive') return undefined
  return type.name === 'string' || type.name === 'bits' ? type.name : undefined
}

/**
 * The caller's keys as the detector wants them, or `undefined` when they are
 * not the shape the resolved key type says they are — a mismatch here means
 * the ACI and the argument disagree, and this guard is not the place that
 * reports that.
 */
function asKeys(
  keys: readonly unknown[],
  keyType: FateMapKeyType,
): FateMapKey[] | undefined {
  const out: FateMapKey[] = []
  for (const key of keys) {
    if (keyType === 'string') {
      if (typeof key !== 'string') return undefined
      out.push(key)
      continue
    }
    if (typeof key === 'bigint') out.push(key)
    else if (typeof key === 'number' && Number.isSafeInteger(key))
      out.push(BigInt(key))
    else return undefined
  }
  return out
}

/** A `Map`, or the array of `[key, value]` pairs the encoder equally accepts. */
function mapEntries(value: unknown): [unknown, unknown][] | undefined {
  if (value instanceof Map) return [...value.entries()]
  if (
    Array.isArray(value) &&
    value.every((entry) => Array.isArray(entry) && entry.length === 2)
  )
    return value.map((entry) => [entry[0], entry[1]] as [unknown, unknown])
  return undefined
}

type Walk = {
  aci: unknown[]
  defects: MapKeyOrderDefect[]
  seen: Set<object>
}

function walkValue(
  walk: Walk,
  type: ResolvedType,
  value: unknown,
  path: string,
  depth: number,
): void {
  if (depth > MAX_VALUE_DEPTH) return

  // An `option` is unwrapped in the type, not in the value, so it re-enters
  // with the same value and must not trip the cycle guard below.
  if (type.kind === 'option') {
    if (value === undefined || value === null) return
    walkValue(walk, type.value, value, path, depth + 1)
    return
  }

  if (typeof value === 'object' && value !== null) {
    if (walk.seen.has(value)) return
    walk.seen.add(value)
  }

  switch (type.kind) {
    case 'map': {
      const entries = mapEntries(value)
      if (!entries) return
      const keyType = guardedKeyType(type.key)
      if (keyType) {
        const keys = asKeys(
          entries.map(([key]) => key),
          keyType,
        )
        const disagreement =
          keys && detectMapKeyOrderDisagreement(keys, keyType)
        if (disagreement) walk.defects.push({ ...disagreement, path })
      }
      for (const [, entryValue] of entries) {
        walkValue(walk, type.value, entryValue, `${path}[…]`, depth + 1)
      }
      return
    }
    case 'set': {
      const items =
        value instanceof Set
          ? [...value]
          : Array.isArray(value)
            ? value
            : undefined
      if (!items) return
      const keyType = guardedKeyType(type.item)
      if (!keyType) return
      const keys = asKeys(items, keyType)
      const disagreement = keys && detectMapKeyOrderDisagreement(keys, keyType)
      if (disagreement) walk.defects.push({ ...disagreement, path })
      return
    }
    case 'list': {
      if (!Array.isArray(value)) return
      value.forEach((item, i) => {
        walkValue(walk, type.item, item, `${path}[${i}]`, depth + 1)
      })
      return
    }
    case 'tuple': {
      if (!Array.isArray(value)) return
      type.items.forEach((itemType, i) => {
        walkValue(walk, itemType, value[i], `${path}.${i}`, depth + 1)
      })
      return
    }
    case 'record': {
      if (!isPlainObject(value)) return
      for (const field of type.fields) {
        if (!Object.hasOwn(value, field.name)) continue
        walkValue(
          walk,
          field.type,
          value[field.name],
          `${path}.${field.name}`,
          depth + 1,
        )
      }
      return
    }
    default:
      return
  }
}

/**
 * Every `map` (or `Set.set`) argument of this call whose keys the encoder will
 * order in a way the node's decoder refuses.
 *
 * Empty for anything this walk cannot read — an ACI that is not an array, a
 * method the last contract entry does not declare, an argument whose shape does
 * not match its type. That is the intended behaviour: see the module header.
 */
export function findMapKeyOrderDefects(
  aci: unknown,
  method: string,
  args: readonly unknown[],
): MapKeyOrderDefect[] {
  if (!Array.isArray(aci) || aci.length === 0) return []

  // `Contract.initialize` takes the last ACI entry's contract and nothing else,
  // so the encoder that will be handed these arguments reads exactly this one.
  const last = aci[aci.length - 1]
  const contract = isPlainObject(last) ? last.contract : undefined
  if (!isPlainObject(contract) || !Array.isArray(contract.functions)) return []

  const fn = contract.functions.find(
    (e: unknown) => isPlainObject(e) && e.name === method,
  )
  if (!isPlainObject(fn) || !Array.isArray(fn.arguments)) return []

  const walk: Walk = { aci, defects: [], seen: new Set() }
  fn.arguments.forEach((argument: unknown, i: number) => {
    if (!isPlainObject(argument)) return
    if (i >= args.length) return
    const name = typeof argument.name === 'string' ? argument.name : `${i}`
    walkValue(walk, resolveType(aci, argument.type), args[i], name, 0)
  })
  return walk.defects
}

function renderKey(key: FateMapKey): string {
  return typeof key === 'string' ? JSON.stringify(key) : `${key}`
}

/**
 * The two orders of every defect, rendered for an error's `metaMessages`.
 *
 * `callContract`, `deployContract` and `simulateContract` refuse on the same
 * predicate and have to say the same thing about it, so the wording is written
 * once here: messages a reader compares are then describing the same defect in
 * the same words, and none can drift while the others do not.
 */
export function describeMapKeyOrderDefects(
  defects: readonly MapKeyOrderDefect[],
): string[] {
  return defects.flatMap((defect) => [
    `Argument "${defect.path}" — map(${defect.keyType}, _):`,
    `  the node accepts    ${defect.nodeOrder.map(renderKey).join(', ')}`,
    `  the encoder writes  ${defect.encoderOrder.map(renderKey).join(', ')}`,
  ])
}
