// Generates the FATE encoding vectors in this directory from
// `@aeternity/aepp-calldata` (ISC), the JavaScript implementation the aeternity
// SDK ships.
//
// Do not run it directly — use the harness:
//
//   node ../../../ae-parity/regenerate.mjs           # check it still reproduces
//   node ../../../ae-parity/regenerate.mjs --write   # take new bytes, review the diff
//
// Node resolves a bare specifier from the importing *module's* directory rather
// than the working directory, so this file cannot see `@aeternity/aepp-calldata`
// wherever it is installed and running it in place always fails. The harness
// installs the version the corpus records for itself, copies this file next to
// that install, runs it, and diffs.
//
// Every case here has a hand-written twin in `tests/vectors.rs` that builds the
// same value through this crate. The test asserts the bytes match and that they
// decode back to the value, so the corpus is a cross-implementation check, not
// a snapshot of ourselves.
//
// This is the fixed-corpus half of the differential harness — see
// `crates/ae-parity` for the coverage matrix and the on-node exercise built on
// top of it.

// The package's `exports` map publishes only its high level encoders, so the
// serialiser and the data classes are reached through the resolved entry point
// rather than by subpath import.
const entry = import.meta.resolve('@aeternity/aepp-calldata')
const load = async (path) => import(new URL(path, entry).href)

const { default: Serializer } = await load('./Serializer.js')
const { default: TypeSerializer } = await load(
  './Serializers/TypeSerializer.js',
)
const { default: FateInt } = await load('./types/FateInt.js')
const { default: FateBool } = await load('./types/FateBool.js')
const { default: FateBits } = await load('./types/FateBits.js')
const { default: FateString } = await load('./types/FateString.js')
const { default: FateBytes } = await load('./types/FateBytes.js')
const { default: FateList } = await load('./types/FateList.js')
const { default: FateMap } = await load('./types/FateMap.js')
const { default: FateTuple } = await load('./types/FateTuple.js')
const { default: FateVariant } = await load('./types/FateVariant.js')
const { default: FateAccountAddress } = await load(
  './types/FateAccountAddress.js',
)
const { default: FateContractAddress } = await load(
  './types/FateContractAddress.js',
)
const { default: FateOracleAddress } = await load(
  './types/FateOracleAddress.js',
)
const { default: FateOracleQueryAddress } = await load(
  './types/FateOracleQueryAddress.js',
)
const { default: FateChannelAddress } = await load(
  './types/FateChannelAddress.js',
)
const { default: FateCalldata } = await load('./types/FateCalldata.js')
const {
  FateTypeInt,
  FateTypeBool,
  FateTypeBits,
  FateTypeString,
  FateTypeAny,
  FateTypeBytes,
  FateTypeList,
  FateTypeMap,
  FateTypeTuple,
  FateTypeVariant,
  FateTypeVar,
  FateTypeAccountAddress,
  FateTypeContractAddress,
  FateTypeOracleAddress,
  FateTypeOracleQueryAddress,
  FateTypeChannelAddress,
} = await load('./FateTypes.js')

const serializer = new Serializer()
const typeSerializer = new TypeSerializer()

const ADDRESS_A = new Uint8Array(32).fill(0xaa)
const ADDRESS_B = Uint8Array.from({ length: 32 }, (_, i) => i)

const hex = (bytes) =>
  [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
const repeat = (byte, count) => new Uint8Array(count).fill(byte)

const values = {
  'int/zero': new FateInt(0),
  'int/one': new FateInt(1),
  'int/minus-one': new FateInt(-1),
  'int/small-max': new FateInt(63),
  'int/small-min': new FateInt(-63),
  'int/small-boundary': new FateInt(64),
  'int/small-boundary-negative': new FateInt(-64),
  'int/byte-boundary': new FateInt(255),
  'int/two-bytes': new FateInt(256),
  'int/rlp-length-boundary': new FateInt(64n + 2n ** 440n),
  'int/u64-overflow': new FateInt(2n ** 64n),
  'int/u256-max': new FateInt(2n ** 256n - 1n),
  'int/negative-large': new FateInt(-(2n ** 128n)),

  'bool/true': new FateBool(true),
  'bool/false': new FateBool(false),

  'bits/zero': new FateBits(0),
  'bits/positive': new FateBits(0b1011),
  'bits/negative': new FateBits(-1),
  'bits/negative-large': new FateBits(-255),

  'string/empty': new FateString(''),
  'string/one-char': new FateString('a'),
  'string/short-max': new FateString('a'.repeat(63)),
  'string/long-boundary': new FateString('a'.repeat(64)),
  'string/long-127': new FateString('a'.repeat(127)),
  'string/long-boundary-plus-64': new FateString('a'.repeat(128)),
  'string/long-300': new FateString('b'.repeat(300)),
  'string/utf8': new FateString('æternity — ünïcode'),
  'string/embedded-nul': new FateString(new Uint8Array([0, 1, 0, 2])),

  'bytes/empty': new FateBytes(new Uint8Array(0)),
  'bytes/one': new FateBytes(new Uint8Array([0xff])),
  'bytes/thirty-two': new FateBytes(repeat(0x5a, 32)),
  'bytes/sixty-four': new FateBytes(repeat(0x5a, 64)),

  'address/account': new FateAccountAddress(ADDRESS_A),
  'address/account-counting': new FateAccountAddress(ADDRESS_B),
  'address/contract': new FateContractAddress(ADDRESS_A),
  'address/oracle': new FateOracleAddress(ADDRESS_A),
  'address/oracle-query': new FateOracleQueryAddress(ADDRESS_A),
  'address/channel': new FateChannelAddress(ADDRESS_A),

  'tuple/unit': new FateTuple(),
  'tuple/one': new FateTuple([FateTypeInt()], [new FateInt(1)]),
  'tuple/mixed': new FateTuple(
    [FateTypeInt(), FateTypeBool(), FateTypeString()],
    [new FateInt(-7), new FateBool(true), new FateString('ok')],
  ),
  'tuple/fifteen': new FateTuple(
    Array(15).fill(FateTypeInt()),
    Array.from({ length: 15 }, (_, i) => new FateInt(i)),
  ),
  'tuple/sixteen': new FateTuple(
    Array(16).fill(FateTypeInt()),
    Array.from({ length: 16 }, (_, i) => new FateInt(i)),
  ),
  'tuple/seventeen': new FateTuple(
    Array(17).fill(FateTypeInt()),
    Array.from({ length: 17 }, (_, i) => new FateInt(i)),
  ),
  'tuple/nested': new FateTuple(
    [FateTypeTuple([FateTypeInt()]), FateTypeInt()],
    [new FateTuple([FateTypeInt()], [new FateInt(1)]), new FateInt(2)],
  ),

  'list/empty': new FateList(FateTypeInt(), []),
  'list/one': new FateList(FateTypeInt(), [new FateInt(1)]),
  'list/fifteen': new FateList(
    FateTypeInt(),
    Array.from({ length: 15 }, (_, i) => new FateInt(i)),
  ),
  'list/sixteen': new FateList(
    FateTypeInt(),
    Array.from({ length: 16 }, (_, i) => new FateInt(i)),
  ),
  'list/two-hundred': new FateList(
    FateTypeInt(),
    Array.from({ length: 200 }, (_, i) => new FateInt(i)),
  ),
  'list/of-strings': new FateList(FateTypeString(), [
    new FateString('one'),
    new FateString('two'),
  ]),
  'list/nested': new FateList(FateTypeList(FateTypeInt()), [
    new FateList(FateTypeInt(), [new FateInt(1)]),
    new FateList(FateTypeInt(), []),
  ]),

  // Deliberately built out of key order: both implementations have to sort
  // into the protocol's canonical order before writing.
  'map/empty': new FateMap(FateTypeInt(), FateTypeInt(), []),
  'map/int-keys-unsorted': new FateMap(FateTypeInt(), FateTypeString(), [
    [new FateInt(10), new FateString('ten')],
    [new FateInt(-3), new FateString('minus three')],
    [new FateInt(2), new FateString('two')],
    [new FateInt(1000), new FateString('thousand')],
  ]),
  'map/string-keys-unsorted': new FateMap(FateTypeString(), FateTypeInt(), [
    [new FateString('bbb'), new FateInt(3)],
    [new FateString('a'), new FateInt(1)],
    [new FateString('zz'), new FateInt(2)],
    [new FateString(''), new FateInt(0)],
  ]),
  'map/address-keys': new FateMap(FateTypeAccountAddress(), FateTypeInt(), [
    [new FateAccountAddress(ADDRESS_A), new FateInt(1)],
    [new FateAccountAddress(ADDRESS_B), new FateInt(2)],
  ]),
  'map/set-shape': new FateMap(FateTypeInt(), FateTypeTuple(), [
    [new FateInt(3), new FateTuple()],
    [new FateInt(1), new FateTuple()],
  ]),
  'map/nested-values': new FateMap(FateTypeInt(), FateTypeList(FateTypeInt()), [
    [new FateInt(2), new FateList(FateTypeInt(), [new FateInt(20)])],
    [new FateInt(1), new FateList(FateTypeInt(), [])],
  ]),
  'map/eighteen-entries': new FateMap(
    FateTypeInt(),
    FateTypeInt(),
    Array.from({ length: 18 }, (_, i) => [new FateInt(17 - i), new FateInt(i)]),
  ),

  'variant/none': new FateVariant([0, 1], 0, [], []),
  'variant/some': new FateVariant(
    [0, 1],
    1,
    [new FateInt(42)],
    [FateTypeInt()],
  ),
  'variant/three-constructors': new FateVariant(
    [0, 2, 1],
    1,
    [new FateInt(1), new FateString('x')],
    [FateTypeInt(), FateTypeString()],
  ),
  'variant/wide-arities': new FateVariant(
    Array.from({ length: 20 }, (_, i) => i % 3),
    19,
    [new FateInt(9)],
    [FateTypeInt()],
  ),

  'calldata/no-args': new FateCalldata(
    new Uint8Array([0xb2, 0xba, 0x9d, 0x59]),
    [],
    [],
  ),
  'calldata/two-args': new FateCalldata(
    new Uint8Array([0x9f, 0x03, 0x37, 0x36]),
    [FateTypeInt(), FateTypeString()],
    [new FateInt(1000000), new FateString('hello')],
  ),
  'calldata/address-arg': new FateCalldata(
    new Uint8Array([0x00, 0x11, 0x22, 0x33]),
    [FateTypeAccountAddress()],
    [new FateAccountAddress(ADDRESS_A)],
  ),
}

const types = {
  'type/int': FateTypeInt(),
  'type/bool': FateTypeBool(),
  'type/bits': FateTypeBits(),
  'type/string': FateTypeString(),
  'type/any': FateTypeAny(),
  'type/bytes-32': FateTypeBytes(32),
  'type/bytes-1024': FateTypeBytes(1024),
  'type/tvar': FateTypeVar(3),
  'type/account-address': FateTypeAccountAddress(),
  'type/contract-address': FateTypeContractAddress(),
  'type/oracle-address': FateTypeOracleAddress(),
  'type/oracle-query-address': FateTypeOracleQueryAddress(),
  'type/channel-address': FateTypeChannelAddress(),
  'type/list-of-int': FateTypeList(FateTypeInt()),
  'type/map-string-to-list': FateTypeMap(
    FateTypeString(),
    FateTypeList(FateTypeInt()),
  ),
  'type/unit': FateTypeTuple(),
  'type/tuple': FateTypeTuple([FateTypeInt(), FateTypeBool()]),
  'type/option-int': FateTypeVariant([
    FateTypeTuple(),
    FateTypeTuple([FateTypeInt()]),
  ]),
  'type/nested-list': FateTypeList(FateTypeList(FateTypeString())),
}

const vectors = []
for (const [name, value] of Object.entries(values)) {
  vectors.push({ name, hex: hex(serializer.serialize(value)) })
}
for (const [name, type] of Object.entries(types)) {
  vectors.push({ name, hex: hex(typeSerializer.serialize(type)) })
}

const document = JSON.stringify(
  {
    source: '@aeternity/aepp-calldata',
    version: '1.9.1',
    license: 'ISC',
    vectors,
  },
  null,
  2,
)

process.stdout.write(`${document}\n`)
