import type { Config } from '../../createConfig.js'

export type ChannelContractCreateParameters = {
  channel: any
  code: string
  callData: string
  deposit: bigint | number
  vmVersion: number
  abiVersion: number
  sign: (tx: string) => Promise<string>
}

export type ChannelContractCreateReturnType = {
  accepted: boolean
  address?: string
  signedTx?: string
}

export type ChannelContractCallParameters = {
  channel: any
  contract: string
  callData: string
  amount?: bigint | number
  abiVersion?: number
  sign: (tx: string, options?: any) => Promise<string>
}

export type ChannelContractCallReturnType = {
  accepted: boolean
  signedTx?: string
}

export type ChannelContractCallStaticParameters = {
  channel: any
  contract: string
  callData: string
  amount?: bigint | number
  abiVersion?: number
}

export type ChannelContractCallStaticReturnType = {
  returnValue: any
  returnType: string
  gasUsed: number
}

export async function channelContractCreate(
  _config: Config,
  parameters: ChannelContractCreateParameters,
): Promise<ChannelContractCreateReturnType> {
  const { channel, code, callData, deposit, vmVersion, abiVersion, sign } =
    parameters

  const result = await channel.createContract(
    {
      code,
      callData,
      deposit: Number(deposit),
      vmVersion,
      abiVersion,
    },
    sign,
  )

  return {
    accepted: result.accepted,
    address: result.address,
    signedTx: result.signedTx,
  }
}

export async function channelContractCall(
  _config: Config,
  parameters: ChannelContractCallParameters,
): Promise<ChannelContractCallReturnType> {
  const { channel, contract, callData, amount, abiVersion, sign } = parameters

  const result = await channel.callContract(
    {
      contract,
      callData,
      amount: amount != null ? Number(amount) : 0,
      abiVersion,
    },
    sign,
  )

  return {
    accepted: result.accepted,
    signedTx: result.signedTx,
  }
}

export async function channelContractCallStatic(
  _config: Config,
  parameters: ChannelContractCallStaticParameters,
): Promise<ChannelContractCallStaticReturnType> {
  const { channel, contract, callData, amount, abiVersion } = parameters

  const result = await channel.callContractStatic({
    contract,
    callData,
    amount: amount != null ? Number(amount) : 0,
    abiVersion,
  })

  return {
    returnValue: result.returnValue,
    returnType: result.returnType ?? '',
    gasUsed: result.gasUsed ?? 0,
  }
}
