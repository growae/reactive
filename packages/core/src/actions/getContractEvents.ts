import { Contract } from '@aeternity/aepp-sdk'
import type { Config } from '../createConfig'

export type GetContractEventsParameters = {
  address: string
  aci?: any
  fromHeight?: number
  toHeight?: number
  networkId?: string
}

export type ContractEvent = {
  address: string
  topics: string[]
  data: string
  name?: string
  decoded?: any
}

export type GetContractEventsReturnType = ContractEvent[]

export async function getContractEvents(
  config: Config,
  parameters: GetContractEventsParameters,
): Promise<GetContractEventsReturnType> {
  const { address, aci, fromHeight, toHeight, networkId } = parameters

  const node = config.getNodeClient({ networkId })

  const txs = (await node.getTransactionInfoByHash)
    ? await fetchContractEventsFromNode(node, address, fromHeight, toHeight)
    : []

  if (aci) {
    const contractInstance = await Contract.initialize({
      onNode: node,
      aci,
      address: address as `ct_${string}`,
    })

    return txs.map((event) => {
      try {
        const decoded = contractInstance.$decodeEvents([event])
        return {
          address: event.address ?? address,
          topics: event.topics?.map(String) ?? [],
          data: event.data ?? '',
          name: decoded[0]?.name,
          decoded: decoded[0]?.args,
        }
      } catch {
        return {
          address: event.address ?? address,
          topics: event.topics?.map(String) ?? [],
          data: event.data ?? '',
        }
      }
    })
  }

  return txs.map((event) => ({
    address: event.address ?? address,
    topics: event.topics?.map(String) ?? [],
    data: event.data ?? '',
  }))
}

async function fetchContractEventsFromNode(
  node: any,
  address: string,
  _fromHeight?: number,
  _toHeight?: number,
): Promise<any[]> {
  try {
    const contractInfo = await node.getContractByPubkey(address)
    if (!contractInfo) return []
    return contractInfo.log ?? []
  } catch {
    return []
  }
}
