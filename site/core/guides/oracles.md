# Oracles

Aeternity oracles provide a first-class mechanism for bringing off-chain data on-chain. Unlike EVM oracles that rely on contract-based solutions, AE oracles are a protocol-level primitive.

## Overview

The oracle lifecycle:

1. **Register** — create an oracle with query/response formats
2. **Query** — anyone can query a registered oracle
3. **Respond** — the oracle operator responds to queries
4. **Extend** — extend the oracle's TTL before it expires

## Registering an Oracle

```typescript
import { registerOracle } from '@growae/reactive/actions'

const oracle = await registerOracle(config, {
  queryFormat: 'string',
  responseFormat: 'string',
})

console.log('Oracle ID:', oracle.id) // ok_...
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `queryFormat` | `string` | — | Required. Expected query format description. |
| `responseFormat` | `string` | — | Required. Expected response format description. |
| `queryFee` | `bigint` | `0n` | Fee required per query (in aettos). |
| `oracleTtlType` | `'delta' \| 'block'` | `'delta'` | TTL type for oracle registration. |
| `oracleTtlValue` | `number` | `500` | Oracle TTL value in blocks. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Querying an Oracle

```typescript
import { queryOracle } from '@growae/reactive/actions'

const query = await queryOracle(config, {
  oracleId: 'ok_2dA...',
  query: 'What is the AE/USD price?',
})

console.log('Query ID:', query.id) // oq_...
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `oracleId` | `string` | — | Required. Oracle address (`ok_...`). |
| `query` | `string` | — | Required. The query string. |
| `queryFee` | `bigint` | oracle's fee | Fee to pay the oracle. |
| `queryTtlType` | `'delta' \| 'block'` | `'delta'` | TTL type for the query. |
| `queryTtlValue` | `number` | `10` | Query TTL value in blocks. |
| `responseTtlType` | `'delta' \| 'block'` | `'delta'` | TTL type for the response. |
| `responseTtlValue` | `number` | `10` | Response TTL value in blocks. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

## Responding to a Query

```typescript
import { respondToQuery } from '@growae/reactive/actions'

await respondToQuery(config, {
  oracleId: 'ok_2dA...',
  queryId: 'oq_abc...',
  response: '0.045 USD',
})
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `oracleId` | `string` | — | Required. Oracle address (`ok_...`). |
| `queryId` | `string` | — | Required. Query ID (`oq_...`). |
| `response` | `string` | — | Required. The response string. |
| `responseTtlType` | `'delta' \| 'block'` | `'delta'` | TTL type for the response. |
| `responseTtlValue` | `number` | `10` | Response TTL value in blocks. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

## Extending an Oracle

```typescript
import { extendOracle } from '@growae/reactive/actions'

await extendOracle(config, {
  oracleId: 'ok_2dA...',
  oracleTtlType: 'delta',
  oracleTtlValue: 500,
})
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `oracleId` | `string` | — | Required. Oracle address (`ok_...`). |
| `oracleTtlType` | `'delta' \| 'block'` | `'delta'` | TTL type for extension. |
| `oracleTtlValue` | `number` | `500` | Additional blocks. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |
