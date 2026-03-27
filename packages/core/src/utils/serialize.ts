function getReferenceKey(keys: string[], cutoff: number) {
  return keys.slice(0, cutoff).join('.') || '.'
}

function getCutoff(array: any[], value: any) {
  const { length } = array

  for (let index = 0; index < length; ++index) {
    if (array[index] === value) {
      return index + 1
    }
  }

  return 0
}

type StandardReplacer = (key: string, value: any) => any
type CircularReplacer = (key: string, value: any, referenceKey: string) => any

function createReplacer(
  replacer?: StandardReplacer | null | undefined,
  circularReplacer?: CircularReplacer | null | undefined,
): StandardReplacer {
  const hasReplacer = typeof replacer === 'function'
  const hasCircularReplacer = typeof circularReplacer === 'function'

  const cache: any[] = []
  const keys: string[] = []

  return function replace(this: any, key: string, value: any) {
    if (typeof value === 'object') {
      if (cache.length) {
        const thisCutoff = getCutoff(cache, this)

        if (thisCutoff === 0) {
          cache[cache.length] = this
        } else {
          cache.splice(thisCutoff)
          keys.splice(thisCutoff)
        }

        keys[keys.length] = key

        const valueCutoff = getCutoff(cache, value)

        if (valueCutoff !== 0) {
          return hasCircularReplacer
            ? circularReplacer.call(
                this,
                key,
                value,
                getReferenceKey(keys, valueCutoff),
              )
            : `[ref=${getReferenceKey(keys, valueCutoff)}]`
        }
      } else {
        cache[0] = value
        keys[0] = key
      }
    }

    return hasReplacer ? replacer.call(this, key, value) : value
  }
}

export function serialize(
  value: any,
  replacer?: StandardReplacer | null | undefined,
  indent?: number | null | undefined,
  circularReplacer?: CircularReplacer | null | undefined,
) {
  return JSON.stringify(
    value,
    createReplacer((key, value_) => {
      let value = value_
      if (typeof value === 'bigint')
        value = { __type: 'bigint', value: value_.toString() }
      if (value instanceof Map)
        value = { __type: 'Map', value: Array.from(value_.entries()) }
      return replacer?.(key, value) ?? value
    }, circularReplacer),
    indent ?? undefined,
  )
}
