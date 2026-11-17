# buildTransaction

Build an unsigned `tx_` transaction offline using the Rust protocol core. The builder accepts a schema tag name, an optional schema version, and typed fields. Supply the nonce and any height-dependent inputs. For a fee-bearing transaction, omitting the fee asks Rust to calculate the protocol minimum.

```ts
import { buildTransaction, type TransactionField } from '@growae/reactive/actions'

const fields: TransactionField[] = [
    { key: 'senderId', value: { tag: 'encoded', val: sender } },
    { key: 'recipientId', value: { tag: 'encoded', val: recipient } },
    { key: 'amount', value: { tag: 'uint', val: '1000000000000000000' } },
    { key: 'nonce', value: { tag: 'uint', val: '1' } },
 ]
const tx = await buildTransaction(config, { tag: 'SpendTx', fields })
```

Integer field values are decimal strings. The return value is an encoded transaction string. [Protocol types and migration](../../rust-protocol)
