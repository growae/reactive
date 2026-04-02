import { expectTypeOf, test } from 'vitest'
import { type SpendParameters, type SpendReturnType, spend } from './spend'

test('spend returns Promise<SpendReturnType>', () => {
  expectTypeOf(spend).returns.toEqualTypeOf<Promise<SpendReturnType>>()
})

test('SpendParameters has recipient field', () => {
  expectTypeOf<SpendParameters>().toHaveProperty('recipient')
  expectTypeOf<SpendParameters['recipient']>().toBeString()
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
