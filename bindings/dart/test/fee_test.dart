/// Per-parameter proof for `minimumTransactionFee` — the joined fee-model
/// mirror this binding forwards rather than reimplements.
///
/// A declared-but-unused parameter and a correctly threaded one produce the
/// same signature and the same green build; only a test that actually
/// varies the value and checks the resulting fee tells them apart. Each
/// test below exists for exactly one mirrored parameter and fails if that
/// parameter stops being threaded through to
/// `ae_core::fee::minimum_transaction_fee`.
///
/// The expected fees are computed independently of `minimumTransactionFee`
/// itself, from the published Ceres constants in
/// `crates/ae-core/src/protocol.rs` (`base_gas`, `gas_per_byte`,
/// `min_gas_price`) and this binding's own `buildTxRlp`, which measures real
/// serialised bytes rather than a guessed size — `referenceMinimumFee` below
/// runs the same fixed-point iteration the crate does, but against those
/// constants, not against the function under test. Mirrors
/// `bindings/python/tests/test_fee.py` shape-for-shape.
///
/// Two Dart-specific pins, per the Technical Lead's review note on the
/// Python mirror: the omitted-`abiVersion` case and the unrecognised-value
/// case are checked against their reference fees directly, not against a
/// sibling arm — an equality-with-a-sibling assertion moves when both arms
/// move together and is anchored only transitively.
library;

import 'package:ae_core/ae_core.dart' as core;
import 'package:test/test.dart';

const baseGas = 15000;
const gasPerByte = 20;
final minGasPrice = BigInt.from(1000000000);

const sender = 'ak_SeLqn3UAUoRymWmwW7axrzJK7JfNaBR2cHCryA6cFsgFkHEF';
const contract = 'ct_2Kw2XL8QVSQHwJYKpWLktaxtwKuz7iYF5pqcauUHpmcvhHUVd';
const bytearray = 'cb_yv6aT3/a';

// The reference fees on `develop` @ 5c3b97711c0fc4d98570f2d316a964be2a032adc,
// computed independently of the function under test.
final fateAndOmittedFee = BigInt.parse('181880000000000');
final nonFateAndUnrecognisedFee = BigInt.parse('451900000000000');
final contractCreateFee = BigInt.parse('76300000000000');
final gaAttachFee = BigInt.parse('77000000000000');

BigInt referenceMinimumFee(
  core.TxParams Function(BigInt fee) build, {
  required int multiplierNum,
  required int multiplierDen,
  int innerSize = 0,
}) {
  var fee = BigInt.zero;
  for (var i = 0; i < 64; i++) {
    final size = core.buildTxRlp(params: build(fee)).length;
    final gasSize = (size - innerSize > 0 ? size - innerSize : 0) * gasPerByte;
    final gas =
        BigInt.from((baseGas * multiplierNum) ~/ multiplierDen + gasSize);
    final nextFee = gas * minGasPrice;
    if (nextFee == fee) return fee;
    fee = nextFee;
  }
  throw StateError('reference fixed point did not converge');
}

core.TxParams contractCall({BigInt? fee, int abi = 3, bool omitAbi = false}) {
  final params = core.TxParams(tag: core.Tag.contractCallTx);
  params.set_(key: 'callerId', value: core.Value.encoded(value: sender));
  params.set_(key: 'nonce', value: core.Value.uint(value: BigInt.from(10)));
  params.set_(key: 'contractId', value: core.Value.encoded(value: contract));
  if (!omitAbi) {
    params.set_(
        key: 'abiVersion', value: core.Value.uint(value: BigInt.from(abi)));
  }
  params.set_(key: 'amount', value: core.Value.uint(value: BigInt.zero));
  params.set_(
      key: 'gasLimit', value: core.Value.uint(value: BigInt.from(25000)));
  params.set_(
      key: 'gasPrice', value: core.Value.uint(value: minGasPrice));
  params.set_(key: 'callData', value: core.Value.encoded(value: bytearray));
  if (fee != null) {
    params.set_(key: 'fee', value: core.Value.uint(value: fee));
  }
  return params;
}

core.TxParams contractCreate({BigInt? fee, int abi = 3}) {
  final params = core.TxParams(tag: core.Tag.contractCreateTx);
  params.set_(key: 'ownerId', value: core.Value.encoded(value: sender));
  params.set_(key: 'nonce', value: core.Value.uint(value: BigInt.from(9)));
  params.set_(key: 'code', value: core.Value.encoded(value: bytearray));
  params.set_(
      key: 'ctVersion',
      value: core.Value.ctVersion(vmVersion: 8, abiVersion: abi));
  params.set_(key: 'deposit', value: core.Value.uint(value: BigInt.zero));
  params.set_(key: 'amount', value: core.Value.uint(value: BigInt.zero));
  params.set_(key: 'gasLimit', value: core.Value.uint(value: BigInt.from(76)));
  params.set_(key: 'gasPrice', value: core.Value.uint(value: minGasPrice));
  params.set_(key: 'callData', value: core.Value.encoded(value: bytearray));
  if (fee != null) {
    params.set_(key: 'fee', value: core.Value.uint(value: fee));
  }
  return params;
}

core.TxParams gaAttach({BigInt? fee, int abi = 3}) {
  final params = core.TxParams(tag: core.Tag.gaAttachTx);
  params.set_(key: 'ownerId', value: core.Value.encoded(value: sender));
  params.set_(key: 'nonce', value: core.Value.uint(value: BigInt.one));
  params.set_(key: 'code', value: core.Value.encoded(value: bytearray));
  params.set_(
      key: 'authFun',
      value: core.Value.bytes(value: List<int>.filled(34, 0x09)));
  params.set_(
      key: 'ctVersion',
      value: core.Value.ctVersion(vmVersion: 8, abiVersion: abi));
  params.set_(
      key: 'gasLimit', value: core.Value.uint(value: BigInt.from(1000)));
  params.set_(key: 'gasPrice', value: core.Value.uint(value: minGasPrice));
  params.set_(key: 'callData', value: core.Value.encoded(value: bytearray));
  if (fee != null) {
    params.set_(key: 'fee', value: core.Value.uint(value: fee));
  }
  return params;
}

/// A minimal `SignedTx` wrapping a `SpendTx`, for `GaMetaTx.tx`. The
/// signature never has to verify against anything on chain here — the fee
/// model prices bytes, not validity.
(core.TxParams, core.SecretKey) signedSpend() {
  final senderKey = core.SecretKey.generate();
  final recipientKey = core.SecretKey.generate();
  final spend = core.TxParams(tag: core.Tag.spendTx);
  spend.set_(
      key: 'senderId',
      value: core.Value.encoded(value: senderKey.address()));
  spend.set_(
      key: 'recipientId',
      value: core.Value.encoded(value: recipientKey.address()));
  spend.set_(key: 'amount', value: core.Value.uint(value: BigInt.one));
  spend.set_(
      key: 'fee', value: core.Value.uint(value: BigInt.from(16660000000000)));
  spend.set_(key: 'nonce', value: core.Value.uint(value: BigInt.one));
  final tx = core.buildTx(params: spend);
  final signature = senderKey.signTransaction(
      transaction: core.buildTxRlp(params: spend),
      networkId: core.networkIdTestnet(),
      inner: false);
  final signed = core.TxParams(tag: core.Tag.signedTx);
  signed.set_(
      key: 'signatures',
      value: core.Value.list(
          values: [core.Value.bytes(value: signature.toBytes())]));
  signed.set_(key: 'encodedTx', value: core.Value.encoded(value: tx));
  return (signed, senderKey);
}

core.TxParams gaMeta(
  core.TxParams signed,
  core.SecretKey sender, {
  BigInt? fee,
  int abi = 3,
  bool omitAbi = false,
}) {
  final params = core.TxParams(tag: core.Tag.gaMetaTx);
  params.set_(
      key: 'gaId', value: core.Value.encoded(value: sender.address()));
  params.set_(key: 'authData', value: core.Value.encoded(value: bytearray));
  if (!omitAbi) {
    params.set_(
        key: 'abiVersion', value: core.Value.uint(value: BigInt.from(abi)));
  }
  params.set_(
      key: 'gasLimit', value: core.Value.uint(value: BigInt.from(1000)));
  params.set_(key: 'gasPrice', value: core.Value.uint(value: minGasPrice));
  params.set_(key: 'tx', value: core.Value.tx(params: signed));
  if (fee != null) {
    params.set_(key: 'fee', value: core.Value.uint(value: fee));
  }
  return params;
}

BigInt fee(core.TxParams params) =>
    BigInt.parse(core.minimumTransactionFee(params: params));

void main() {
  setUpAll(() async {
    await core.RustLib.init();
  });

  group('ContractCallTx — the one tag whose multiplier moves with the ABI',
      () {
    test('prices the FATE ABI at 12x base gas', () {
      final expected = referenceMinimumFee(
          (f) => contractCall(fee: f, abi: 3),
          multiplierNum: 12,
          multiplierDen: 1);
      expect(fee(contractCall(abi: 3)), expected);
    });

    test('prices a non-FATE ABI at 30x base gas', () {
      final expected = referenceMinimumFee(
          (f) => contractCall(fee: f, abi: 1),
          multiplierNum: 30,
          multiplierDen: 1);
      expect(fee(contractCall(abi: 1)), expected);
    });

    test(
        'an omitted abiVersion defaults to the wire byte, not the dear arm — '
        'pinned to its own reference fee, not to the FATE arm', () {
      expect(fee(contractCall(omitAbi: true)), fateAndOmittedFee);
    });

    test(
        'an unrecognised abiVersion takes the dear arm — pinned to its own '
        'reference fee, not to the non-FATE arm', () {
      expect(fee(contractCall(abi: 99)), nonFateAndUnrecognisedFee);
    });
  });

  group('ContractCreateTx, GaAttachTx, GaMetaTx: 5x on every arm, unmoved '
      'by the ABI', () {
    test('ContractCreateTx is priced flat at 5x base gas regardless of ABI',
        () {
      final expected = referenceMinimumFee(
          (f) => contractCreate(fee: f, abi: 3),
          multiplierNum: 5,
          multiplierDen: 1);
      expect(expected, contractCreateFee);
      for (final abi in [3, 1, 99, 0]) {
        expect(fee(contractCreate(abi: abi)), expected);
      }
    });

    test('GaAttachTx is priced flat at 5x base gas regardless of ABI', () {
      final expected = referenceMinimumFee((f) => gaAttach(fee: f, abi: 3),
          multiplierNum: 5, multiplierDen: 1);
      expect(expected, gaAttachFee);
      for (final abi in [3, 1, 99, 0]) {
        expect(fee(gaAttach(abi: abi)), expected);
      }
    });

    test('GaMetaTx is priced flat at 5x base gas regardless of ABI', () {
      // One fixed wrapped tx shared across every arm below: the wrapper's
      // own bytes must stay identical so a fee difference could only come
      // from the multiplier this test is checking, not from re-randomised
      // key material.
      final (signed, sender) = signedSpend();
      final innerSize = core.buildTxRlp(params: signed).length;
      final expected = referenceMinimumFee(
          (f) => gaMeta(signed, sender, fee: f, abi: 3),
          multiplierNum: 5,
          multiplierDen: 1,
          innerSize: innerSize);
      for (final abi in [3, 1, 99]) {
        expect(fee(gaMeta(signed, sender, abi: abi)), expected);
      }
      expect(fee(gaMeta(signed, sender, omitAbi: true)), expected);
    });
  });

  group('errors the joined function surfaces rather than papering over', () {
    test('a missing gasLimit on a contract call errors rather than '
        'defaulting', () {
      final params = core.TxParams(tag: core.Tag.contractCallTx);
      params.set_(key: 'callerId', value: core.Value.encoded(value: sender));
      params.set_(key: 'nonce', value: core.Value.uint(value: BigInt.from(10)));
      params.set_(
          key: 'contractId', value: core.Value.encoded(value: contract));
      params.set_(
          key: 'abiVersion', value: core.Value.uint(value: BigInt.from(3)));
      params.set_(key: 'amount', value: core.Value.uint(value: BigInt.zero));
      params.set_(key: 'gasPrice', value: core.Value.uint(value: minGasPrice));
      params.set_(
          key: 'callData', value: core.Value.encoded(value: bytearray));
      expect(() => core.minimumTransactionFee(params: params),
          throwsA(anything));
    });

    test('an absolute oracle ttl errors rather than being priced wrong', () {
      final params = core.TxParams(tag: core.Tag.oracleRegisterTx);
      params.set_(key: 'accountId', value: core.Value.encoded(value: sender));
      params.set_(key: 'nonce', value: core.Value.uint(value: BigInt.one));
      params.set_(key: 'queryFormat', value: core.Value.text(value: 'string'));
      params.set_(
          key: 'responseFormat', value: core.Value.text(value: 'string'));
      params.set_(key: 'queryFee', value: core.Value.uint(value: BigInt.zero));
      // absolute (block) ttl
      params.set_(
          key: 'oracleTtlType', value: core.Value.uint(value: BigInt.one));
      params.set_(
          key: 'oracleTtlValue',
          value: core.Value.uint(value: BigInt.from(500)));
      params.set_(
          key: 'abiVersion', value: core.Value.uint(value: BigInt.zero));
      expect(() => core.minimumTransactionFee(params: params),
          throwsA(anything));
    });
  });
}
