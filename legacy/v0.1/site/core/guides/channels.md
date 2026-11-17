# State Channels

Aeternity state channels enable off-chain transactions between two parties with on-chain dispute resolution. They provide instant finality and near-zero fees for off-chain operations.

## Overview

State channels work by:

1. **Opening** a channel with an on-chain deposit from both parties
2. **Transacting off-chain** — instant, free updates signed by both parties
3. **Closing cooperatively** — both parties agree to close and settle
4. **Dispute resolution** — if one party disappears, the other can force-close on-chain

## Opening a Channel

```typescript
import { openChannel } from '@growae/reactive/actions'

const channel = await openChannel(config, {
  initiatorId: 'ak_initiator...',
  responderId: 'ak_responder...',
  initiatorAmount: 5000000000000000000n, // 5 AE
  responderAmount: 5000000000000000000n, // 5 AE
  channelReserve: 1000000000000000000n, // 1 AE
  lockPeriod: 10,
  host: 'localhost',
  port: 3001,
})
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `initiatorId` | `string` | — | Required. Initiator account. |
| `responderId` | `string` | — | Required. Responder account. |
| `initiatorAmount` | `bigint` | — | Required. Initiator deposit (aettos). |
| `responderAmount` | `bigint` | — | Required. Responder deposit (aettos). |
| `channelReserve` | `bigint` | — | Required. Minimum balance each party must maintain. |
| `lockPeriod` | `number` | — | Required. Dispute period in blocks. |
| `host` | `string` | — | Required. WebSocket host for channel communication. |
| `port` | `number` | — | Required. WebSocket port. |
| `ttl` | `number` | `300` | Transaction TTL in blocks relative to current height. Set to `0` for no expiration. |

::: tip Default TTL
All transactions default to a TTL of 300 blocks (~15 hours). This prevents stale transactions from lingering indefinitely. Override with `ttl: 0` for no expiration.
:::

## Off-chain Updates

Once a channel is open, you can send AE between participants off-chain:

```typescript
await channel.update(
  'ak_initiator...', // from
  'ak_responder...', // to
  1000000000000000000n, // 1 AE
)
```

## In-channel Contracts

State channels support deploying and calling Sophia contracts off-chain:

```typescript
await channel.createContract({
  code: contractBytecode,
  aci: contractAci,
  callData: initCallData,
  deposit: 0n,
})
```

## Closing a Channel

### Cooperative Close

Both parties sign the closing transaction:

```typescript
await channel.shutdown()
```

### Solo Close (Dispute)

If the counterparty is unresponsive:

```typescript
await channel.closeSolo()
```

After the lock period expires, settle the channel:

```typescript
await channel.settle()
```

## Channel Events

```typescript
channel.on('statusChanged', (status) => {
  console.log('Channel status:', status)
})

channel.on('stateChanged', (state) => {
  console.log('New state:', state)
})

channel.on('error', (error) => {
  console.error('Channel error:', error)
})
```
