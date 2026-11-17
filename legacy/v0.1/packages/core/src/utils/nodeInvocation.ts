/**
 * Recovering what the node actually said out of `NodeInvocationError`.
 *
 * `@aeternity/aepp-sdk` reports a contract the node executed and refused as
 * `NodeInvocationError`, whose message is the node's reason — empty on a
 * devnet, `bad_call_data` on `ae_uat` — and whose `transaction` property is set
 * only on the static path. On the on-chain path it reads the call result back
 * by hash inside itself and throws with neither the reason legible nor a hash
 * to look the call up by.
 *
 * `callContract` and `deployContract` both reach that error, through the same
 * `Contract` instance and the same code inside the sdk, so the recovery is
 * written once here instead of once per action.
 */

import { buildTxHash, NodeInvocationError } from '@aeternity/aepp-sdk'

/**
 * The message format the reason is read out of. `NodeInvocationError` stores
 * the node's reason nowhere but its own message. Pinned to the constructor of
 * `@aeternity/aepp-sdk` 14.1.1 by `callContract.test.ts`, so a change upstream
 * fails a test rather than silently emptying the field.
 */
const INVOCATION_MESSAGE = /^Invocation failed(?:: "([\s\S]*)")?$/

/**
 * Two copies of the sdk in one dependency tree defeat `instanceof`, and a
 * misidentified error here would be re-thrown unwrapped rather than swallowed,
 * so the name is accepted as well.
 */
export function isNodeInvocationError(
  error: unknown,
): error is NodeInvocationError {
  return (
    error instanceof NodeInvocationError ||
    (error instanceof Error && error.name === 'NodeInvocationError')
  )
}

export function invocationReason(error: Error): string | undefined {
  const reason = INVOCATION_MESSAGE.exec(error.message)?.[1]
  return reason ? reason : undefined
}

export function transactionHashOf(
  transaction: string | undefined,
): string | undefined {
  if (transaction == null) return undefined
  try {
    return buildTxHash(transaction as `tx_${string}`)
  } catch {
    return undefined
  }
}

/**
 * The account, plus the last transaction it signed.
 *
 * `NodeInvocationError.transaction` is populated only on the static path — the
 * on-chain path throws without it — so the signed transaction is observed on
 * the way past instead. Reads go to the real account so that a connector
 * holding private state is unaffected.
 */
export function observeSigning<account extends object>(
  account: account,
): { account: account; signed: () => string | undefined } {
  let last: string | undefined
  const proxy = new Proxy(account, {
    get(target, property) {
      const value = Reflect.get(target, property, target)
      if (property === 'signTransaction' && typeof value === 'function') {
        return async (...args: unknown[]) => {
          const signed = await value.apply(target, args)
          if (typeof signed === 'string') last = signed
          return signed
        }
      }
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
  return { account: proxy, signed: () => last }
}
