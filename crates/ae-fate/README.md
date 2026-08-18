# ae-fate

FATE ABI encoding and decoding for the æternity protocol. Bytes in, bytes out.

This is the data-serialisation half of the VM's ABI: the format contract
calldata, call results, contract state and chain events are written in. It does
no I/O, no hashing, no base58/base64 address encoding and no async, and it has
no dependencies.

## The public surface

Everything below is stable for the framework bindings to mirror. Encoding and
decoding are symmetric: each takes or returns a `FateValue` and a byte slice.

| | |
|---|---|
| `serialize(&FateValue) -> Result<Vec<u8>>` | encode one value |
| `deserialize(&[u8]) -> Result<FateValue>` | decode one value, rejecting trailing bytes |
| `deserialize_one(&[u8]) -> Result<(FateValue, &[u8])>` | decode one value out of a stream |
| `serialize_type(&FateType) -> Result<Vec<u8>>` | encode a type |
| `deserialize_type(&[u8]) -> Result<FateType>` | decode a type |
| `deserialize_type_one(&[u8]) -> Result<(FateType, &[u8])>` | decode a type out of a stream |
| `encode_calldata(&[u8], &[FateValue]) -> Result<Vec<u8>>` | function id plus arguments |
| `decode_calldata(&[u8]) -> Result<Calldata>` | the inverse |

Types: `FateValue`, `FateType`, `FateInt`, `FateMap`, `FateVariant`,
`AddressKind`, `BytesSize`, `Calldata`, `Error`. The `tag` module exposes the
wire tags for anyone who needs to look at raw bytes.

Illegal values are unconstructible rather than rejected at encode time, with one
deliberate exception. A map sorts into the protocol's canonical key order in
`FateMap::new` and refuses a key containing a map; a variant checks its tag
against its arity list in `FateVariant::new`.

The exception is structural: `FateType::Tuple` and `FateType::Variant` hold
public `Vec`s, so a type with more than 255 members is constructible and is
caught only on the way out. **A binding therefore surfaces exactly one encode
error — `Error::TypeTooWide` — and it is reachable only through
`FateValue::Typerep`.** Model encode as fallible; do not model it as infallible
and grow a throw path later.

```rust
use ae_fate::{encode_calldata, FateValue};

let calldata = encode_calldata(
    &[0x9f, 0x03, 0x37, 0x36],
    &[FateValue::int(1_000_000i64), FateValue::string("hello")],
)
.expect("encodes");
```

## What is deliberately not here

- **The function id.** It is the first four bytes of the Blake2b hash of the
  function name — a hashing concern, and hashing belongs to the encoding
  substrate rather than to the ABI.
- **The `cb_…` envelope.** Base64check with a checksum, same reason.
- **Sophia types.** `FateValue` is the wire format, which does not distinguish a
  record from a tuple, a set from a map to unit, or a string from an unsized
  byte array. Mapping a decoded value back onto a contract's declared signature
  needs its interface and belongs a layer above.
- **Contract bytecode structure.** `FateValue::ContractBytearray` carries the
  bytes; parsing the code sections is separate work.

## Testing

`cargo test` runs three suites:

- `tests/vectors.rs` — 85 values, types and calls encoded by both this crate and
  `@aeternity/aepp-calldata` 1.9.1, asserted byte-identical. Regenerate the
  corpus with `tests/vectors/generate.mjs`.
- `tests/divergence.rs` — the four places the Erlang and JavaScript references
  disagree, with the measured behaviour of each and which one this crate
  follows.
- `tests/roundtrip.rs` — size boundaries either side of every inline length
  field, the two wire forms the JS library cannot write, and the malformed
  inputs the decoder has to refuse.

The corpus is not the differential harness. That one generates inputs and runs
both implementations on every change, and is separate work.
