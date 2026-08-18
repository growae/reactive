import { core } from './gen-nowasi/nowasi.component.js';

const input = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
const expected = [0, 0, 0, 4, 0xde, 0xad, 0xbe, 0xef, 0x04, 0x5d, 0x4b, 0xb3];

const out = core.transform(input);
const got = Array.from(out);

console.log('in :', Array.from(input).map((b) => b.toString(16).padStart(2, '0')).join(' '));
console.log('out:', got.map((b) => b.toString(16).padStart(2, '0')).join(' '));

if (JSON.stringify(got) !== JSON.stringify(expected)) {
  console.error('FAIL: expected', expected);
  process.exit(1);
}
console.log('PASS: JS <- WASM component round trip matches the Rust core');
