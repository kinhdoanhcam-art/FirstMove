const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

const PROJECT_CONTRACT_ADDRESS = '0x1d9d229ba1Ff0b0ef6A0aFcAdAD6dFd08Db6ee26'
const configuredAddress = String(
  import.meta.env.VITE_CONTRACT_ADDRESS || PROJECT_CONTRACT_ADDRESS,
).trim()

export const CONTRACT_ADDRESS = ADDRESS_RE.test(configuredAddress)
  ? (configuredAddress as `0x${string}`)
  : undefined

export const STUDIO_CHAIN_ID = 61999
export const STUDIO_CHAIN_HEX = `0x${STUDIO_CHAIN_ID.toString(16)}`
export const EXPLORER_BASE = 'https://explorer-studio.genlayer.com'

export function rpcUrl() {
  if (typeof window === 'undefined') return '/genlayer-rpc'
  return `${window.location.origin}/genlayer-rpc`
}

export function contractExplorerUrl() {
  return CONTRACT_ADDRESS
    ? `${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`
    : EXPLORER_BASE
}

export function transactionExplorerUrl(hash: string) {
  return `${EXPLORER_BASE}/tx/${hash}`
}
