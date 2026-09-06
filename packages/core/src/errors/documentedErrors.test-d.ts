import {
  BaseError,
  type CallContractErrorType,
  CallContractInvocationError,
  CallContractMapKeyOrderError,
  CallContractNoAccountError,
  type Config,
  callContract,
  type DeployContractErrorType,
  type GetBalanceErrorType,
  type SpendErrorType,
} from '@growae/reactive'
import { expectTypeOf, test } from 'vitest'

/**
 * The examples in `site/core/guides/error-handling.md`, compiled.
 *
 * `documentedErrors.test.ts` checks that the names the guide prints exist;
 * this checks that the code it prints type-checks. The guide's previous
 * headline example imported five classes that were never exported, and nothing
 * in the repository would have caught it — a reader running `tsc` was the
 * first check that page had.
 */

declare const config: Config
declare const aci: unknown

test('the BaseError example', async () => {
  try {
    await callContract(config, { address: 'ct_...', aci, method: 'transfer' })
  } catch (error) {
    if (error instanceof BaseError) {
      expectTypeOf(error.shortMessage).toEqualTypeOf<string>()
      expectTypeOf(error.details).toEqualTypeOf<string>()
      expectTypeOf(error.metaMessages).toEqualTypeOf<string[] | undefined>()
    }
  }
})

test('the Catching Specific Errors example', async () => {
  try {
    await callContract(config, { address: 'ct_...', aci, method: 'transfer' })
  } catch (error) {
    if (error instanceof CallContractNoAccountError) {
      expectTypeOf(error.shortMessage).toEqualTypeOf<string>()
    } else if (error instanceof CallContractMapKeyOrderError) {
      expectTypeOf(error.defects).toBeArray
    } else if (error instanceof CallContractInvocationError) {
      expectTypeOf(error.reason).toEqualTypeOf<string | undefined>()
      expectTypeOf(error.transactionHash).toEqualTypeOf<string | undefined>()
    } else {
      throw error
    }
  }
})

test('the action error unions the guide names', () => {
  // Named unions: the concrete classes are assignable to them.
  const callError: CallContractErrorType = new CallContractNoAccountError()
  expectTypeOf(callError).not.toBeNever()
  expectTypeOf<DeployContractErrorType>().not.toBeNever()

  // The looser unions the guide warns about: `shortMessage` needs narrowing.
  expectTypeOf<GetBalanceErrorType>().not.toBeNever()
  expectTypeOf<SpendErrorType>().not.toBeNever()
})

test('the TanStack Query example', () => {
  const error = null as GetBalanceErrorType | null
  if (error instanceof BaseError) {
    expectTypeOf(error.shortMessage).toEqualTypeOf<string>()
  } else if (error) {
    expectTypeOf(error.message).toEqualTypeOf<string>()
  }
})
