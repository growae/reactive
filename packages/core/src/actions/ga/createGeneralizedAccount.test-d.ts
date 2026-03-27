import { expectTypeOf, test } from 'vitest'
import {
  createGeneralizedAccount,
  type CreateGeneralizedAccountParameters,
  type CreateGeneralizedAccountReturnType,
} from './createGeneralizedAccount.js'
import type { Config } from '../../createConfig.js'

test('createGeneralizedAccount returns Promise<CreateGeneralizedAccountReturnType>', () => {
  expectTypeOf(createGeneralizedAccount).returns.toEqualTypeOf<
    Promise<CreateGeneralizedAccountReturnType>
  >()
})

test('CreateGeneralizedAccountReturnType has gaContractId', () => {
  expectTypeOf<CreateGeneralizedAccountReturnType>().toHaveProperty('gaContractId')
  expectTypeOf<CreateGeneralizedAccountReturnType['gaContractId']>().toBeString()
})

test('CreateGeneralizedAccountReturnType has owner and txHash', () => {
  expectTypeOf<CreateGeneralizedAccountReturnType>().toHaveProperty('owner')
  expectTypeOf<CreateGeneralizedAccountReturnType>().toHaveProperty('txHash')
  expectTypeOf<CreateGeneralizedAccountReturnType['owner']>().toBeString()
  expectTypeOf<CreateGeneralizedAccountReturnType['txHash']>().toBeString()
})

test('CreateGeneralizedAccountParameters has authFnName', () => {
  expectTypeOf<CreateGeneralizedAccountParameters>().toHaveProperty('authFnName')
  expectTypeOf<CreateGeneralizedAccountParameters['authFnName']>().toBeString()
})

test('CreateGeneralizedAccountParameters has args', () => {
  expectTypeOf<CreateGeneralizedAccountParameters>().toHaveProperty('args')
  expectTypeOf<CreateGeneralizedAccountParameters['args']>().toEqualTypeOf<any[]>()
})
