// Build, sign and serialise a SpendTx, then price a ContractCallTx —
// the same walkthrough as bindings/python/README.md's Usage section, in
// this binding's idiom. Run from `bindings/dart` after `cargo build
// --release` in `rust/`, so the default loader finds
// `rust/target/release/libae_core_dart.so` (or the platform equivalent):
//
//   dart run example/main.dart
import 'package:ae_core/ae_core.dart' as core;

Future<void> main() async {
  await core.RustLib.init();

  final key = core.SecretKey.generate();
  final recipient = core.SecretKey.generate().address();

  final params = core.TxParams(tag: core.Tag.spendTx);
  params.set_(key: 'senderId', value: core.Value.encoded(value: key.address()));
  params.set_(
      key: 'recipientId', value: core.Value.encoded(value: recipient));
  params.set_(
      key: 'amount',
      value: core.Value.uint(value: BigInt.parse('1000000000000000000')));
  params.set_(
      key: 'fee', value: core.Value.uint(value: BigInt.from(16660000000000)));
  params.set_(key: 'nonce', value: core.Value.uint(value: BigInt.one));

  final tx = core.buildTx(params: params);
  assert(tx.startsWith('tx_'));

  final rlp = core.buildTxRlp(params: params);
  final signature =
      key.signTransaction(
          transaction: rlp, networkId: core.networkIdTestnet(), inner: false);

  final signed = core.TxParams(tag: core.Tag.signedTx);
  signed.set_(
      key: 'signatures',
      value: core.Value.list(
          values: [core.Value.bytes(value: signature.toBytes())]));
  signed.set_(key: 'encodedTx', value: core.Value.encoded(value: tx));
  final signedTx = core.buildTx(params: signed);
  print('signed spend: $signedTx');

  // Price a ContractCallTx before setting its `fee` field — the same
  // pattern bindings/python/README.md documents, forwarded rather than
  // reimplemented: see `minimumTransactionFee`'s doc comment for why the
  // ABI byte is read off the wire rather than off the caller's params.
  final call = core.TxParams(tag: core.Tag.contractCallTx);
  call.set_(key: 'callerId', value: core.Value.encoded(value: key.address()));
  call.set_(key: 'nonce', value: core.Value.uint(value: BigInt.two));
  call.set_(
      key: 'contractId',
      value: core.Value.encoded(
          value: 'ct_2Kw2XL8QVSQHwJYKpWLktaxtwKuz7iYF5pqcauUHpmcvhHUVd'));
  call.set_(key: 'abiVersion', value: core.Value.uint(value: BigInt.from(3)));
  call.set_(key: 'amount', value: core.Value.uint(value: BigInt.zero));
  call.set_(
      key: 'gasLimit', value: core.Value.uint(value: BigInt.from(25000)));
  call.set_(
      key: 'gasPrice', value: core.Value.uint(value: BigInt.from(1000000000)));
  call.set_(key: 'callData', value: core.Value.encoded(value: 'cb_yv6aT3/a'));

  final fee = core.minimumTransactionFee(params: call);
  print('minimum fee for the contract call: $fee aettos');
}
