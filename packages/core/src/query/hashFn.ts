export function hashFn(queryKey: readonly unknown[]): string {
  return JSON.stringify(queryKey, (_, value) => {
    if (isPlainObject(value))
      return Object.keys(value)
        .sort()
        .reduce((result, key) => {
          result[key] = value[key]
          return result
        }, {} as any)
    if (typeof value === 'bigint') return value.toString()
    return value
  })
}

function isPlainObject(value: any): value is object {
  if (!hasObjectPrototype(value)) return false

  const ctor = value.constructor
  if (typeof ctor === 'undefined') return true

  const prot = ctor.prototype
  if (!hasObjectPrototype(prot)) return false

  if (!Object.prototype.hasOwnProperty.call(prot, 'isPrototypeOf')) return false

  return true
}

function hasObjectPrototype(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}
