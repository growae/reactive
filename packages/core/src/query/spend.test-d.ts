import { expectTypeOf, test } from 'vitest'
import type { Config } from '../createConfig.js'
import { spendMutationOptions } from './spend.js'

test('spendMutationOptions returns object with mutationFn', () => {
  const options = spendMutationOptions({} as Config)
  expectTypeOf(options).toHaveProperty('mutationFn')
  expectTypeOf(options.mutationFn).toBeFunction()
})

test('spendMutationOptions returns object with mutationKey', () => {
  const options = spendMutationOptions({} as Config)
  expectTypeOf(options).toHaveProperty('mutationKey')
})
