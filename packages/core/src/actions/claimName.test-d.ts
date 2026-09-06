import { expectTypeOf, test } from 'vitest'
import {
  type ClaimNameParameters,
  type ClaimNameReturnType,
  claimName,
} from './claimName.js'

test('claimName returns Promise<ClaimNameReturnType>', () => {
  expectTypeOf(claimName).returns.toEqualTypeOf<Promise<ClaimNameReturnType>>()
})

test('ClaimNameReturnType carries the transaction the sdk mined', () => {
  expectTypeOf<ClaimNameReturnType['txHash']>().toBeString()
  expectTypeOf<ClaimNameReturnType['rawTx']>().toBeString()
  expectTypeOf<ClaimNameReturnType['nameId']>().toBeString()
  expectTypeOf<ClaimNameReturnType>().toHaveProperty('blockHeight')
})

test('ClaimNameParameters has name field', () => {
  expectTypeOf<ClaimNameParameters['name']>().toBeString()
})

/**
 * The salt round-trips from `preclaimName`, which reports the sdk's own
 * `nameSalt` — a `number`. A `bigint` here would not survive that round trip.
 */
test('ClaimNameParameters.salt is an optional number', () => {
  expectTypeOf<ClaimNameParameters['salt']>().toEqualTypeOf<
    number | undefined
  >()
})
