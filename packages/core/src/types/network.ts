export type Network = {
  id: string
  name: string
  nodeUrl: string
  compilerUrl?: string | undefined
  middlewareUrl?: string | undefined
}

export const mainnet: Network = {
  id: 'ae_mainnet',
  name: 'Mainnet',
  nodeUrl: 'https://mainnet.aeternity.io',
  middlewareUrl: 'https://mainnet.aeternity.io/mdw',
}

export const testnet: Network = {
  id: 'ae_uat',
  name: 'Testnet',
  nodeUrl: 'https://testnet.aeternity.io',
  compilerUrl: 'https://v8.compiler.aepps.com',
  middlewareUrl: 'https://testnet.aeternity.io/mdw',
}
