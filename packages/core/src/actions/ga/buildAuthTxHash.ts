import type { Config } from '../../createConfig.js'

export type BuildAuthTxHashParameters = {
  tx: string
  fee?: bigint | string
  gasLimit?: number
  gasPrice?: bigint | string
  networkId?: string
}

export type BuildAuthTxHashReturnType = {
  txHash: Buffer
}

export async function buildAuthTxHash(
  config: Config,
  parameters: BuildAuthTxHashParameters,
): Promise<BuildAuthTxHashReturnType> {
  const { tx, fee, gasPrice, networkId } = parameters

  const node = config.getNodeClient({ networkId })

  const sdk = await import('@aeternity/aepp-sdk')
  const hash = await sdk.buildAuthTxHash(tx as any, {
    onNode: node,
    ...(fee != null ? { fee: fee.toString() } : {}),
    ...(gasPrice != null ? { gasPrice: gasPrice.toString() } : {}),
  })

  return { txHash: hash }
}
