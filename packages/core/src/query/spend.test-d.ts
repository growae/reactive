import { expectTypeOf, test } from 'vitest'
import { spendMutationOptions } from './spend.js'
import type { Config } from '../createConfig.js'

test('spendMutationOptions returns object with mutationFn', () => {
  const options = spendMutationOptions({} as Config)
  expectTypeOf(options).toHaveProperty('mutationFn')
  expectTypeOf(options.mutationFn).toBeFunction()
})

test('spendMutationOptions returns object with mutationKey', () => {
  const options = spendMutationOptions({} as Config)
  expectTypeOf(options).toHaveProperty('mutationKey')
})
