import { DEFAULT_TTL, DEFAULT_WAIT_TIMEOUT } from '../constants.js'
import type { Config } from '../createConfig.js'
import { loadProtocol } from '../exports/protocol.js'
import type { DryRunItem, DryRunResult } from '../node.js'
import { buildTransaction, type TransactionField } from './buildTransaction.js'
import { type ContractInvocation, contractCalldata } from './calldata.js'
import { getGasPrice } from './fees.js'
import { sendTransaction } from './sendTransaction.js'
import { signTransaction } from './signTransaction.js'
import { waitForTransactionReceipt } from './transactionReceipt.js'

export type ContractRead = ContractInvocation & {
  address: string
  caller?: string | undefined
  amount?: bigint | undefined
  gas?: number | undefined
}
type Snapshot = { networkId?: string | undefined; top?: string | undefined }
export type ReadContractParameters = ContractRead & Snapshot

async function callItem(call: ContractRead): Promise<DryRunItem> {
  return {
    call_req: {
      contract: call.address,
      abi_version: 3,
      calldata: await contractCalldata(call),
      ...(call.caller !== undefined && { caller: call.caller }),
      ...(call.amount !== undefined && { amount: call.amount }),
      ...(call.gas !== undefined && { gas: call.gas }),
    },
  }
}

function execution(result: DryRunResult | undefined) {
  if (result?.result !== 'ok' || !result.callObj)
    throw new Error(result?.reason ?? 'Node did not execute the contract call')
  return result.callObj
}

export async function simulateContract(
  config: Config,
  parameters: ReadContractParameters,
) {
  const { results } = await config.getNodeClient(parameters).dryRun({
    ...(parameters.top && { top: parameters.top }),
    txs: [await callItem(parameters)],
  })
  return execution(results[0])
}

export async function readContract(
  config: Config,
  parameters: ReadContractParameters,
) {
  const call = await simulateContract(config, parameters)
  if (call.returnType !== 'ok')
    throw new Error(`Contract ${call.returnType}: ${call.returnValue}`)
  return call.returnValue
}

export type ReadContractsParameters = Snapshot & {
  contracts: readonly ContractRead[]
}
export async function readContracts(
  config: Config,
  { contracts, top, networkId }: ReadContractsParameters,
) {
  if (!contracts.length) return []
  const { results } = await config.getNodeClient({ networkId }).dryRun({
    ...(top && { top }),
    txs: await Promise.all(contracts.map(callItem)),
  })
  if (results.length !== contracts.length)
    throw new Error('Node returned an incomplete dry-run result')
  return results.map((result) => {
    const call = execution(result)
    if (call.returnType !== 'ok')
      throw new Error(`Contract ${call.returnType}: ${call.returnValue}`)
    return call.returnValue
  })
}

export type EstimateGasParameters = Snapshot & {
  tx: string
  accounts?: { address: string; amount: bigint }[] | undefined
}
export async function estimateGas(
  config: Config,
  { tx, top, networkId, accounts }: EstimateGasParameters,
) {
  const { results } = await config.getNodeClient({ networkId }).dryRun({
    ...(top && { top }),
    txs: [{ tx }],
    ...(accounts && {
      accounts: accounts.map(({ address, amount }) => ({
        pub_key: address,
        amount,
      })),
    }),
  })
  const call = execution(results[0])
  if (call.returnType !== 'ok')
    throw new Error(`Contract ${call.returnType}: ${call.returnValue}`)
  return { gasUsed: call.gasUsed, gasPrice: String(call.gasPrice) }
}

type ContractWrite = ContractInvocation & {
  gasLimit: number
  gasPrice?: bigint | undefined
  amount?: bigint | undefined
  nonce?: number | undefined
  ttl?: number | undefined
  fee?: bigint | undefined
  networkId?: string | undefined
  waitMined?: boolean | undefined
  timeout?: number | undefined
}
export type CallContractParameters = ContractWrite & { address: string }
export type DeployContractParameters = ContractWrite & { bytecode: string }

function uint(key: string, value: number | bigint): TransactionField {
  return { key, value: { tag: 'uint', val: value.toString() } }
}

async function writeContract(
  config: Config,
  parameters: CallContractParameters | DeployContractParameters,
) {
  const connection = config.state.connections.get(config.state.current ?? '')
  if (!connection) throw new Error('A connected account is required')
  const networkId = parameters.networkId ?? config.state.networkId
  if (connection.networkId !== networkId)
    throw new Error('Switch the wallet to the requested network first')
  const sender = connection.activeAccount
  const node = config.getNodeClient({ networkId })
  const nonce =
    parameters.nonce ?? (await node.getAccountNextNonce(sender)).nextNonce
  const ttl =
    parameters.ttl ??
    (await node.getCurrentKeyBlockHeight()).height + DEFAULT_TTL
  const gasPrice =
    parameters.gasPrice ??
    BigInt((await getGasPrice(config, { networkId })) ?? '1000000000')
  const price =
    parameters.gasPrice === undefined && gasPrice < 1000000000n
      ? 1000000000n
      : gasPrice
  const create = 'bytecode' in parameters
  const fields: TransactionField[] = [
    {
      key: create ? 'ownerId' : 'callerId',
      value: { tag: 'encoded', val: sender },
    },
    create
      ? { key: 'code', value: { tag: 'encoded', val: parameters.bytecode } }
      : {
          key: 'contractId',
          value: { tag: 'encoded', val: parameters.address },
        },
    {
      key: 'callData',
      value: { tag: 'encoded', val: await contractCalldata(parameters) },
    },
    uint('nonce', nonce),
    uint('ttl', ttl),
    uint('gasLimit', parameters.gasLimit),
    uint('gasPrice', price),
    uint('amount', parameters.amount ?? 0n),
  ]
  if (parameters.fee !== undefined) fields.push(uint('fee', parameters.fee))
  const tx = await buildTransaction(config, {
    tag: create ? 'ContractCreateTx' : 'ContractCallTx',
    fields,
  })
  const signed = await signTransaction(config, {
    tx,
    networkId,
    connector: connection.connector,
    onAccount: sender,
  })
  const submitted = await sendTransaction(config, { tx: signed, networkId })
  if (!parameters.waitMined) return { submitted, sender, nonce }
  const receipt = await waitForTransactionReceipt(config, {
    hash: submitted.hash,
    networkId,
    timeout: parameters.timeout ?? DEFAULT_WAIT_TIMEOUT,
  }).catch((cause: unknown) => {
    throw new ContractConfirmationError(
      submitted.hash,
      'Could not confirm contract execution',
      { cause },
    )
  })
  if (receipt.execution?.callInfo?.returnType !== 'ok') {
    throw new ContractConfirmationError(
      submitted.hash,
      `Contract execution: ${receipt.execution?.callInfo?.returnType ?? 'unknown'} ${receipt.execution?.callInfo?.returnValue ?? ''}`,
    )
  }
  return {
    submitted: {
      ...submitted,
      blockHash: receipt.blockHash,
      blockHeight: receipt.blockHeight,
      tx: receipt.tx,
      execution: receipt.execution.callInfo,
    },
    sender,
    nonce,
  }
}

export async function callContract(
  config: Config,
  parameters: CallContractParameters,
) {
  return (await writeContract(config, parameters)).submitted
}

export async function deployContract(
  config: Config,
  parameters: DeployContractParameters,
) {
  const { submitted, sender, nonce } = await writeContract(config, parameters)
  const { aens } = await loadProtocol()
  return { ...submitted, address: aens.buildContractId(sender, String(nonce)) }
}

export class ContractConfirmationError extends Error {
  constructor(
    readonly hash: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
  }
}
