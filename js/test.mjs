import { core } from './gen/ae_wasm.js';

const hex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join(' ');
const input = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
const expected = '00 00 00 04 de ad be ef 04 5d 4b b3';

const framed = core.transform(input);
console.log('transform:', hex(framed));
if (hex(framed) !== expected) { console.error('FAIL transform'); process.exit(1); }

const frame = core.decode(framed);
console.log('decode   :', JSON.stringify({ len: frame.len, checksum: frame.checksum, payload: hex(frame.payload) }));
if (frame.len !== 4 || frame.checksum !== 0x045d4bb3 || hex(frame.payload) !== 'de ad be ef') {
  console.error('FAIL decode'); process.exit(1);
}

let threw = null;
try { core.decode(new Uint8Array([0, 0, 0])); } catch (e) { threw = e; }
console.log('error    :', threw === null ? '(none)' : `${threw.payload ?? threw.message ?? threw}`);
if (threw === null) { console.error('FAIL: short input should have errored'); process.exit(1); }

console.log('PASS: JS <- WASM component, both signatures + error channel');
