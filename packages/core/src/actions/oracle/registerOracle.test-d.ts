import { expectTypeOf, test } from 'vitest'
import {
  type RegisterOracleParameters,
  type RegisterOracleReturnType,
  registerOracle,
} from './registerOracle.js'

test('registerOracle returns Promise<RegisterOracleReturnType>', () => {
  expectTypeOf(registerOracle).returns.toEqualTypeOf<
    Promise<RegisterOracleReturnType>
  >()
})

test('RegisterOracleReturnType has oracleId', () => {
  expectTypeOf<RegisterOracleReturnType>().toHaveProperty('oracleId')
  expectTypeOf<RegisterOracleReturnType['oracleId']>().toBeString()
})

test('RegisterOracleParameters has queryFormat', () => {
  expectTypeOf<RegisterOracleParameters>().toHaveProperty('queryFormat')
  expectTypeOf<RegisterOracleParameters['queryFormat']>().toBeString()
})

test('RegisterOracleParameters has responseFormat', () => {
  expectTypeOf<RegisterOracleParameters>().toHaveProperty('responseFormat')
  expectTypeOf<RegisterOracleParameters['responseFormat']>().toBeString()
})

test('RegisterOracleReturnType has txHash and rawTx', () => {
  expectTypeOf<RegisterOracleReturnType>().toHaveProperty('txHash')
  expectTypeOf<RegisterOracleReturnType>().toHaveProperty('rawTx')
})
