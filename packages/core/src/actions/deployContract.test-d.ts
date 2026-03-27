import { expectTypeOf, test } from 'vitest'
import type { Config } from '../createConfig.js'
import {
  type DeployContractParameters,
  type DeployContractReturnType,
  deployContract,
} from './deployContract.js'

test('deployContract returns Promise<DeployContractReturnType>', () => {
  expectTypeOf(deployContract).returns.toEqualTypeOf<
    Promise<DeployContractReturnType>
  >()
})

test('DeployContractParameters has optional sourceCode', () => {
  expectTypeOf<DeployContractParameters>().toHaveProperty('sourceCode')
})

test('DeployContractParameters has optional bytecode', () => {
  expectTypeOf<DeployContractParameters>().toHaveProperty('bytecode')
})

test('DeployContractReturnType has address and txHash', () => {
  expectTypeOf<DeployContractReturnType>().toHaveProperty('address')
  expectTypeOf<DeployContractReturnType['address']>().toBeString()
  expectTypeOf<DeployContractReturnType>().toHaveProperty('txHash')
  expectTypeOf<DeployContractReturnType['txHash']>().toBeString()
})

test('DeployContractReturnType has rawTx', () => {
  expectTypeOf<DeployContractReturnType>().toHaveProperty('rawTx')
  expectTypeOf<DeployContractReturnType['rawTx']>().toBeString()
})
