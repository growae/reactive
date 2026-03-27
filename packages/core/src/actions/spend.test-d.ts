import { expectTypeOf, test } from 'vitest'
import {
  spend,
  type SpendParameters,
  type SpendReturnType,
} from './spend.js'
import type { Config } from '../createConfig.js'

test('spend returns Promise<SpendReturnType>', () => {
  expectTypeOf(spend).returns.toEqualTypeOf<Promise<SpendReturnType>>()
})

test('SpendParameters has recipientId field', () => {
  expectTypeOf<SpendParameters>().toHaveProperty('recipientId')
  expectTypeOf<SpendParameters['recipientId']>().toBeString()
})

test('SpendParameters has amount field', () => {
  expectTypeOf<SpendParameters>().toHaveProperty('amount')
  expectTypeOf<SpendParameters['amount']>().toEqualTypeOf<bigint | string>()
})

test('SpendReturnType has hash field', () => {
  expectTypeOf<SpendReturnType>().toHaveProperty('hash')
  expectTypeOf<SpendReturnType['hash']>().toBeString()
})

test('SpendReturnType has rawTx field', () => {
  expectTypeOf<SpendReturnType>().toHaveProperty('rawTx')
  expectTypeOf<SpendReturnType['rawTx']>().toBeString()
})
