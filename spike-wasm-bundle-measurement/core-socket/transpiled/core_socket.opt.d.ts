// world root:component/root
export type * as WasiHttpOutgoingHandler0212 from './interfaces/wasi-http-outgoing-handler.js'; // import wasi:http/outgoing-handler@0.2.12
export type * as WasiHttpTypes0212 from './interfaces/wasi-http-types.js'; // import wasi:http/types@0.2.12
export type * as WasiIoError0212 from './interfaces/wasi-io-error.js'; // import wasi:io/error@0.2.12
export type * as WasiIoPoll0212 from './interfaces/wasi-io-poll.js'; // import wasi:io/poll@0.2.12
export type * as WasiIoStreams0212 from './interfaces/wasi-io-streams.js'; // import wasi:io/streams@0.2.12
export function submitTransfer(payload: Uint8Array): Uint8Array;
export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
