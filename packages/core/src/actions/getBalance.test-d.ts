import { expectTypeOf, test } from 'vitest'
import type { Config } from '../createConfig.js'
import {
  type GetBalanceParameters,
  type GetBalanceReturnType,
  getBalance,
} from './getBalance.js'

test('getBalance returns Promise<GetBalanceReturnType>', () => {
  expectTypeOf(getBalance).returns.toEqualTypeOf<
    Promise<GetBalanceReturnType>
  >()
})

test('GetBalanceReturnType is string', () => {
  expectTypeOf<GetBalanceReturnType>().toBeString()
})

test('GetBalanceParameters has address field', () => {
  expectTypeOf<GetBalanceParameters>().toHaveProperty('address')
  expectTypeOf<GetBalanceParameters['address']>().toBeString()
})

test('GetBalanceParameters has optional format field', () => {
  expectTypeOf<GetBalanceParameters>().toHaveProperty('format')
})

test('GetBalanceParameters has optional networkId', () => {
  expectTypeOf<GetBalanceParameters>().toHaveProperty('networkId')
})
