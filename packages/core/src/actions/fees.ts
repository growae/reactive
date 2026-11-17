import type { Config } from '../createConfig.js'
import { loadProtocol } from '../exports/protocol.js'
import type { BuildTransactionParameters } from './buildTransaction.js'

export type FeeHistoryParameters = { networkId?: string | undefined }
export async function getFeeHistory(
  config: Config,
  parameters: FeeHistoryParameters = {},
) {
  const rows = await config.getNodeClient(parameters).getRecentGasPrices()
  return rows.map(({ minutes, minGasPrice, utilization }) => ({
    minutes,
    minGasPrice: BigInt(minGasPrice).toString(),
    utilization,
  }))
}

export type GasPriceParameters = FeeHistoryParameters & {
  minutes?: number | undefined
}
export async function getGasPrice(
  config: Config,
  { minutes, networkId }: GasPriceParameters = {},
) {
  const samples = await getFeeHistory(config, { networkId })
  const sample =
    minutes === undefined
      ? samples.reduce<(typeof samples)[number] | undefined>(
          (best, row) => (!best || row.minutes < best.minutes ? row : best),
          undefined,
        )
      : samples.find((row) => row.minutes === minutes)
  return sample?.minGasPrice ?? null
}

export async function getMinimumFee(
  _config: Config,
  { tag, version, fields }: BuildTransactionParameters,
) {
  const { tx } = await loadProtocol()
  return tx.minimumFee(tag, version, fields)
}
