import { expectTypeOf, test } from 'vitest'
import {
  claimName,
  type ClaimNameParameters,
  type ClaimNameReturnType,
} from './claimName.js'
import type { Config } from '../../createConfig.js'

test('claimName returns Promise<ClaimNameReturnType>', () => {
  expectTypeOf(claimName).returns.toEqualTypeOf<Promise<ClaimNameReturnType>>()
})

test('ClaimNameReturnType has txHash', () => {
  expectTypeOf<ClaimNameReturnType>().toHaveProperty('txHash')
  expectTypeOf<ClaimNameReturnType['txHash']>().toBeString()
})

test('ClaimNameReturnType has nameId', () => {
  expectTypeOf<ClaimNameReturnType>().toHaveProperty('nameId')
  expectTypeOf<ClaimNameReturnType['nameId']>().toBeString()
})

test('ClaimNameParameters has name field', () => {
  expectTypeOf<ClaimNameParameters>().toHaveProperty('name')
  expectTypeOf<ClaimNameParameters['name']>().toBeString()
})

test('ClaimNameReturnType has optional blockHeight', () => {
  expectTypeOf<ClaimNameReturnType>().toHaveProperty('blockHeight')
})
