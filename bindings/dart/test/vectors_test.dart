/// Byte-parity against the reference JavaScript SDK, through this binding.
///
/// Mirrors `crates/ae-core/tests/vectors.rs` and
/// `bindings/python/tests/test_vectors.py`: every case in
/// `vectors/transactions.json` was built by `@aeternity/aepp-sdk` and
/// carries the `tx_...` string it produced. This rebuilds each one through
/// the Dart binding and asserts the strings are identical, then unpacks and
/// rebuilds to prove the round trip does not lose a byte.
library;

import 'dart:convert';
import 'dart:io';

import 'package:ae_core/ae_core.dart' as core;
import 'package:test/test.dart';

// `dart test` runs with the package root (`bindings/dart`) as the working
// directory, same as `pytest` does for `bindings/python`'s equivalent path.
const corpusPath =
    '../../crates/ae-core/tests/vectors/transactions.json';

Map<String, dynamic> loadCorpus() =>
    jsonDecode(File(corpusPath).readAsStringSync()) as Map<String, dynamic>;

core.Value valueFromJson(Map<String, dynamic> spec) {
  final kind = spec['t'] as String;
  final raw = spec['v'];
  switch (kind) {
    case 'enc':
      return core.Value.encoded(value: raw as String);
    case 'text':
      return core.Value.text(value: raw as String);
    case 'uint':
      return core.Value.uintStr(value: raw as String);
    case 'bytes':
      final hex = raw as String;
      final bytes = <int>[
        for (var i = 0; i < hex.length; i += 2)
          int.parse(hex.substring(i, i + 2), radix: 16),
      ];
      return core.Value.bytes(value: bytes);
    case 'list':
      final items = raw as List<dynamic>;
      return core.Value.list(
          values: items
              .map((item) => valueFromJson(item as Map<String, dynamic>))
              .toList());
    case 'pointers':
      final items = raw as List<dynamic>;
      return core.Value.pointers(
          pointers: items
              .map((item) => (
                    (item as Map<String, dynamic>)['key'] as String,
                    item['id'] as String
                  ))
              .toList());
    case 'ctversion':
      final map = raw as Map<String, dynamic>;
      return core.Value.ctVersion(
          vmVersion: map['vm'] as int, abiVersion: map['abi'] as int);
    default:
      throw ArgumentError('unknown value type $kind');
  }
}

core.TxParams paramsFromCase(Map<String, dynamic> testCase) {
  final params =
      core.TxParams(tag: core.Tag.fromU32(value: testCase['tag'] as int));
  final version = testCase['version'];
  if (version != null) {
    params.setVersion(version: version as int);
  }
  final fields = testCase['params'] as Map<String, dynamic>;
  for (final entry in fields.entries) {
    params.set_(
        key: entry.key,
        value: valueFromJson(entry.value as Map<String, dynamic>));
  }
  return params;
}

void main() {
  setUpAll(() async {
    await core.RustLib.init();
  });

  final corpus = loadCorpus();
  final cases = corpus['cases'] as List<dynamic>;

  test('the corpus loaded, and loaded whole', () {
    // A floor, not an exact count — see
    // bindings/python/tests/test_vectors.py's `test_corpus_is_not_empty`
    // for why this is deliberately not pinned to the Rust side's count.
    expect(cases.length, greaterThanOrEqualTo(40));
  });

  for (final rawCase in cases) {
    final testCase = rawCase as Map<String, dynamic>;
    final name = testCase['name'] as String;
    final expectedTx = testCase['tx'] as String;

    test('$name builds to the same bytes as the reference', () {
      final built = core.buildTx(params: paramsFromCase(testCase));
      expect(built, expectedTx);
    });

    test('$name survives unpack then rebuild', () {
      final unpacked = core.unpackTx(encoded: expectedTx);
      final rebuilt = core.buildTx(params: unpacked);
      expect(rebuilt, expectedTx);
    });
  }
}
