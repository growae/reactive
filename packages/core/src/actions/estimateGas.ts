import type { Node } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig.js'
import type { BaseErrorType, ErrorType } from '../errors/base.js'

export type EstimateGasParameters = {
  tx: string
  accountAddress: string
  networkId?: string | undefined
  top?: string | number | undefined
}

export type EstimateGasReturnType = {
  gasUsed: number
  gasPrice: string
  result: string
}

export type EstimateGasErrorType = BaseErrorType | ErrorType

const DRY_RUN_ACCOUNT_AMOUNT = '100000000000000000000000000000'

export async function estimateGas(
  config: Config,
  parameters: EstimateGasParameters,
): Promise<EstimateGasReturnType> {
  const { tx, accountAddress } = parameters
  const node: Node = config.getNodeClient({ networkId: parameters.networkId })

  let top: string | undefined
  if (typeof parameters.top === 'number') {
    const block = await node.getKeyBlockByHeight(parameters.top)
    top = block.hash
  } else {
    top = parameters.top
  }

  const dryRunResult = await node.protectedDryRunTxs({
    top,
    txs: [{ tx }],
    accounts: [
      { pubKey: accountAddress, amount: BigInt(DRY_RUN_ACCOUNT_AMOUNT) },
    ],
  })

  const result = dryRunResult.results[0]
  if (!result || result.result !== 'ok') {
    const reason = result?.reason ?? 'Unknown dry-run error'
    throw new Error(`Dry-run failed: ${reason}`)
  }

  return {
    gasUsed: result.callObj?.gasUsed ?? 0,
    gasPrice: result.callObj?.gasPrice?.toString() ?? '0',
    result: result.result,
  }
}
