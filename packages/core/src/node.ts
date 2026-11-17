import JSONBig from 'json-bigint'

const json = JSONBig({ storeAsString: true })

function camelCaseKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelCaseKeys)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      camelCaseKeys(item),
    ]),
  )
}

type Account = {
  id: string
  kind: string
  balance: string | number
  nonce: number
  payable?: boolean
}
type KeyBlock = {
  hash: string
  height: number
  prevHash: string
  prevKeyHash: string
  time: number
  miner: string
  beneficiary: string
  target: number
  nonce: string | number
}
type MicroBlock = {
  hash: string
  height: number
  prevHash: string
  prevKeyHash: string
  time: number
  pofHash: string
  stateHash: string
  txsHash: string
  version: number
}
export type NodeTransaction = {
  hash: string
  blockHeight: number
  blockHash: string
  signatures: string[]
  tx: Record<string, unknown>
}

export type GasPriceSample = {
  minGasPrice: string | number
  utilization: number
  minutes: number
}

export type ContractCallInfo = {
  callerId: string
  contractId: string
  height: number
  gasUsed: number
  gasPrice: string | number
  returnType: 'ok' | 'error' | 'revert'
  returnValue: string
  log: { address: string; topics: (string | number)[]; data: string }[]
}

export type DryRunItem =
  | { tx: string }
  | {
      call_req: {
        contract: string
        calldata: string
        abi_version: number
        caller?: string
        gas?: number
        amount?: bigint
      }
    }

export type DryRunResult = {
  result: string
  reason?: string
  callObj?: ContractCallInfo
}

export class NodeRequestError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export async function readNodeJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!response.ok)
    throw new NodeRequestError(
      response.status,
      `Node returned ${response.status}: ${text}`,
    )
  return camelCaseKeys(json.parse(text)) as T
}

/** Fetch-based client for the æternity v3 endpoints used by Reactive. */
export class NodeClient {
  constructor(readonly url: string) {}

  private async request<T>(
    path: string,
    body?: object,
    signal?: AbortSignal,
  ): Promise<T> {
    const response = await fetch(
      `${this.url.replace(/\/$/, '')}/v3/${path}`,
      body === undefined
        ? signal
          ? { signal }
          : {}
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: json.stringify(body),
          },
    )
    return readNodeJson<T>(response)
  }

  getStatus() {
    return this.request<{ topBlockHeight: number }>('status')
  }
  getCurrentKeyBlockHeight(signal?: AbortSignal) {
    return this.request<{ height: number }>(
      'key-blocks/current/height',
      undefined,
      signal,
    )
  }
  getKeyBlockByHeight(height: number) {
    return this.request<KeyBlock>(`key-blocks/height/${height}`)
  }
  getKeyBlockByHash(hash: string) {
    return this.request<KeyBlock>(`key-blocks/hash/${encodeURIComponent(hash)}`)
  }
  getAccountByPubkey(id: string) {
    return this.request<Account>(`accounts/${encodeURIComponent(id)}`)
  }
  getAccountByPubkeyAndHeight(id: string, height: number) {
    return this.request<Account>(
      `accounts/${encodeURIComponent(id)}/height/${height}`,
    )
  }
  getAccountByPubkeyAndHash(id: string, hash: string) {
    return this.request<Account>(
      `accounts/${encodeURIComponent(id)}/hash/${encodeURIComponent(hash)}`,
    )
  }
  getAccountNextNonce(id: string) {
    return this.request<{ nextNonce: number }>(
      `accounts/${encodeURIComponent(id)}/next-nonce`,
    )
  }
  getMicroBlockHeaderByHash(hash: string) {
    return this.request<MicroBlock>(
      `micro-blocks/hash/${encodeURIComponent(hash)}/header`,
    )
  }
  getMicroBlockTransactionsByHash(hash: string) {
    return this.request<{ transactions: NodeTransaction[] }>(
      `micro-blocks/hash/${encodeURIComponent(hash)}/transactions`,
    )
  }
  getMicroBlockTransactionsCountByHash(hash: string) {
    return this.request<{ count: number }>(
      `micro-blocks/hash/${encodeURIComponent(hash)}/transactions/count`,
    )
  }
  getTransactionByHash(hash: string, signal?: AbortSignal) {
    return this.request<NodeTransaction>(
      `transactions/${encodeURIComponent(hash)}`,
      undefined,
      signal,
    )
  }
  postTransaction(body: { tx: string }) {
    return this.request<{ txHash: string }>('transactions', body)
  }
  getContractCode(address: string) {
    return this.request<{ bytecode: string }>(
      `contracts/${encodeURIComponent(address)}/code`,
    )
  }
  getNameEntryByName(name: string) {
    return this.request<{
      id: string
      owner: string
      pointers: { key: string; id: string }[]
      ttl: number
    }>(`names/${encodeURIComponent(name)}`)
  }

  getCurrentKeyBlock() {
    return this.request<KeyBlock>('key-blocks/current')
  }
  getRecentGasPrices() {
    return this.request<GasPriceSample[]>('recent-gas-prices')
  }
  getPendingAccountTransactions(address: string) {
    return this.request<{ transactions: NodeTransaction[] }>(
      `accounts/${encodeURIComponent(address)}/transactions/pending`,
    )
  }
  getTransactionInfo(hash: string, signal?: AbortSignal) {
    return this.request<{
      callInfo?: ContractCallInfo
      gaInfo?: Record<string, unknown>
      txInfo?: string
    }>(`transactions/${encodeURIComponent(hash)}/info`, undefined, signal)
  }
  getContractProof(address: string) {
    return this.request<{ poi: string }>(
      `contracts/${encodeURIComponent(address)}/poi`,
    )
  }
  dryRun(body: {
    top?: string
    txs: DryRunItem[]
    accounts?: { pub_key: string; amount: bigint }[]
  }) {
    return this.request<{ results: DryRunResult[] }>('dry-run', body)
  }
}
