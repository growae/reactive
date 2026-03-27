import { expectTypeOf, test } from 'vitest'
import {
  type CreateGeneralizedAccountParameters,
  type CreateGeneralizedAccountReturnType,
  createGeneralizedAccount,
} from './createGeneralizedAccount'

test('createGeneralizedAccount returns Promise<CreateGeneralizedAccountReturnType>', () => {
  expectTypeOf(createGeneralizedAccount).returns.toEqualTypeOf<
    Promise<CreateGeneralizedAccountReturnType>
  >()
})

test('CreateGeneralizedAccountReturnType has gaContractId', () => {
  expectTypeOf<CreateGeneralizedAccountReturnType>().toHaveProperty(
    'gaContractId',
  )
  expectTypeOf<
    CreateGeneralizedAccountReturnType['gaContractId']
  >().toBeString()
})

test('CreateGeneralizedAccountReturnType has owner and txHash', () => {
  expectTypeOf<CreateGeneralizedAccountReturnType>().toHaveProperty('owner')
  expectTypeOf<CreateGeneralizedAccountReturnType>().toHaveProperty('txHash')
  expectTypeOf<CreateGeneralizedAccountReturnType['owner']>().toBeString()
  expectTypeOf<CreateGeneralizedAccountReturnType['txHash']>().toBeString()
})

test('CreateGeneralizedAccountParameters has authFnName', () => {
  expectTypeOf<CreateGeneralizedAccountParameters>().toHaveProperty(
    'authFnName',
  )
  expectTypeOf<CreateGeneralizedAccountParameters['authFnName']>().toBeString()
})

test('CreateGeneralizedAccountParameters has args', () => {
  expectTypeOf<CreateGeneralizedAccountParameters>().toHaveProperty('args')
  expectTypeOf<CreateGeneralizedAccountParameters['args']>().toEqualTypeOf<
    unknown[]
  >()
})
