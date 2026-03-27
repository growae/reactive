import { isRef, unref } from 'vue'

import type { DeepMaybeRef, DeepUnwrapRef } from '../types/ref'

function cloneDeep<value>(
  value: DeepMaybeRef<value>,
  customize?: (val: DeepMaybeRef<value>) => value | undefined,
): value {
  if (customize) {
    const result = customize(value)
    if (result === undefined && isRef(value)) return result as value
    if (result !== undefined) return result
  }

  if (Array.isArray(value))
    return value.map((val) => cloneDeep(val, customize)) as unknown as value

  if (typeof value === 'object' && isPlainObject(value)) {
    const entries = Object.entries(value).map(([key, val]) => [
      key,
      cloneDeep(val, customize),
    ])
    return Object.fromEntries(entries)
  }

  return value as value
}

export function deepUnref<value>(value: value): DeepUnwrapRef<value> {
  return cloneDeep(value as any, (val) => {
    if (isRef(val)) return deepUnref(unref(val))
    return undefined
  })
}

// biome-ignore lint/complexity/noBannedTypes: allowed
function isPlainObject(value: unknown): value is Object {
  if (Object.prototype.toString.call(value) !== '[object Object]') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}
