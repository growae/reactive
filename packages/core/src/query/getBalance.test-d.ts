import { expectTypeOf, test } from 'vitest'
import {
  getBalanceQueryOptions,
  getBalanceQueryKey,
  type GetBalanceQueryKey,
} from './getBalance.js'
import type { Config } from '../createConfig.js'

test('getBalanceQueryOptions returns object with queryFn', () => {
  const options = getBalanceQueryOptions({} as Config)
  expectTypeOf(options).toHaveProperty('queryFn')
  expectTypeOf(options.queryFn).toBeFunction()
})

test('getBalanceQueryOptions returns object with queryKey', () => {
  const options = getBalanceQueryOptions({} as Config)
  expectTypeOf(options).toHaveProperty('queryKey')
})

test('getBalanceQueryOptions returns object with enabled', () => {
  const options = getBalanceQueryOptions({} as Config)
  expectTypeOf(options).toHaveProperty('enabled')
  expectTypeOf(options.enabled).toBeBoolean()
})

test('getBalanceQueryKey returns readonly tuple', () => {
  const key = getBalanceQueryKey()
  expectTypeOf(key).toMatchTypeOf<readonly ['getBalance', unknown]>()
})

test('GetBalanceQueryKey type matches return type', () => {
  expectTypeOf<GetBalanceQueryKey>().toEqualTypeOf<ReturnType<typeof getBalanceQueryKey>>()
})
