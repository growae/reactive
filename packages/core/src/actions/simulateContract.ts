import type { Config } from '../createConfig.js'
import type { CallContractParameters } from './callContract.js'

export type SimulateContractParameters = Omit<
  CallContractParameters,
  'options'
> & {
  options?: Omit<NonNullable<CallContractParameters['options']>, 'callStatic'>
}

export type SimulateContractReturnType = {
  decodedResult: any
  gasUsed: number
  returnType: string
  returnValue: string
  rawTx: string
  hash: string
}

export async function simulateContract(
  config: Config,
  parameters: SimulateContractParameters,
): Promise<SimulateContractReturnType> {
  const {
    address,
    aci,
    method,
    args = [],
    options: txOptions = {},
    networkId,
  } = parameters

  const node = config.getNode({ networkId })
  const connection = config.state.current

  const { Contract } = await import('@aeternity/aepp-sdk')
  const contractInstance = await Contract.initialize({
    onNode: node,
    ...(connection ? { onAccount: connection.account } : {}),
    aci,
    address,
  })

  const result = await contractInstance.$call(method, args, {
    callStatic: true,
    amount: txOptions.amount != null ? Number(txOptions.amount) : undefined,
    gasLimit: txOptions.gasLimit,
    gasPrice:
      txOptions.gasPrice != null ? Number(txOptions.gasPrice) : undefined,
    fee: txOptions.fee != null ? Number(txOptions.fee) : undefined,
  })

  return {
    decodedResult: result.decodedResult,
    gasUsed: result.result?.gasUsed ?? 0,
    returnType: result.result?.returnType ?? '',
    returnValue: result.result?.returnValue ?? '',
    rawTx: result.rawTx,
    hash: result.hash,
  }
}
