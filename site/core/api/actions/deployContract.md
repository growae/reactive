# deployContract

Deploys a Sophia smart contract to the Aeternity blockchain.

## Import

```typescript
import { deployContract } from '@reactive/core/actions'
```

## Usage

```typescript
import { deployContract } from '@reactive/core/actions'

const result = await deployContract(config, {
  aci: contractAci,
  bytecode: compiledBytecode,
  args: ['initial_value', 42n],
})
```

## Return Type

```typescript
type DeployContractReturnType = {
  address: string
  hash: string
  rawTx: string
  result: unknown
}
```

### address

- **Type:** `string`

The deployed contract address (`ct_...`).

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `aci` | `Aci` | — | Required. Contract ACI. |
| `bytecode` | `string` | — | Required. Compiled contract bytecode. |
| `args` | `unknown[]` | `[]` | Arguments for the `init` function. |
| `amount` | `bigint` | `0n` | AE (in aettos) to send to the contract on deploy. |
| `gas` | `number` | auto | Gas limit for deployment. |
| `gasPrice` | `bigint` | auto | Gas price in aettos. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |
| `nonce` | `number` | auto | Account nonce. |
| `fee` | `bigint` | auto | Transaction fee in aettos. |

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Examples

### Deploy with initial funds

```typescript
const result = await deployContract(config, {
  aci: vaultAci,
  bytecode: vaultBytecode,
  args: [],
  amount: 10000000000000000000n, // 10 AE
})

console.log('Deployed at:', result.address)
```

## Error Types

```typescript
import type { DeployContractErrorType } from '@reactive/core'
```

- `ConnectorNotConnectedError` — no wallet connected
- `ContractDeployError` — deployment failed (init reverted, out of gas, etc.)
- `InsufficientBalanceError` — not enough AE for fee + amount
