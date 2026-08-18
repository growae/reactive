import 'dart:io';

import 'package:ae_dart_probe/src/rust/api.dart';
import 'package:ae_dart_probe/src/rust/frb_generated.dart';
import 'package:flutter_rust_bridge/flutter_rust_bridge_for_generated.dart';

String hex(List<int> b) =>
    b.map((x) => x.toRadixString(16).padLeft(2, '0')).join(' ');

Future<void> main() async {
  final lib = ExternalLibrary.open(
    '${Directory.current.parent.path}/target/debug/libae_dart.dylib',
  );
  await RustLib.init(externalLibrary: lib);

  final framed = await transform(input: [0xde, 0xad, 0xbe, 0xef]);
  print('transform: ${hex(framed)}');
  if (hex(framed) != '00 00 00 04 de ad be ef 04 5d 4b b3') {
    print('FAIL transform');
    exit(1);
  }

  final frame = await decode(input: framed);
  print('decode   : len=${frame.len} checksum=0x${frame.checksum.toRadixString(16)} payload=${hex(frame.payload)}');
  if (frame.len != 4 || frame.checksum != 0x045d4bb3 || hex(frame.payload) != 'de ad be ef') {
    print('FAIL decode');
    exit(1);
  }

  Object? threw;
  try {
    await decode(input: [0, 0, 0]);
  } catch (e) {
    threw = e;
  }
  print('error    : $threw');
  if (threw == null) {
    print('FAIL: short input should have thrown');
    exit(1);
  }

  print('PASS: Dart <- flutter_rust_bridge native, both signatures + error channel');
}
