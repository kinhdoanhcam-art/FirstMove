import { abi, createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { getAddress } from 'viem'
import {
  CONTRACT_ADDRESS,
  STUDIO_CHAIN_HEX,
  rpcUrl,
} from './config'
import { normalizeError } from './errors'
import { pyNormalizeWhitespace, pyStrip } from './pytext.mjs'

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<any>
  on?: (event: string, listener: (...args: any[]) => void) => void
  removeListener?: (event: string, listener: (...args: any[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export type ArrangementOrder = 'AUTHOR_FIRST' | 'OTHER_FIRST'
export type ArrangementStatus = 'OPEN' | 'HALF_DONE' | 'COMPLETE' | 'WITHDRAWN'

export type Arrangement = {
  arrangement_id: string
  author: string
  other_wallet: string
  other_label: string
  text: string
  outcome: ArrangementOrder
  order: ArrangementOrder
  state: ArrangementStatus
  author_confirmed: boolean
  other_confirmed: boolean
  first_mover: '' | 'AUTHOR' | 'OTHER'
}

export type WriteOutcome =
  | { status: 'SUCCESS'; arrangement: Arrangement }
  | { status: 'DELAYED' }

type TransactionOutcome =
  | { status: 'PENDING' }
  | { status: 'SUCCESS' }
  | { status: 'ERROR'; reason: string }

const proxiedChain = () => ({
  ...studionet,
  rpcUrls: { default: { http: [rpcUrl()] } },
})

const readClient = () => createClient({ chain: proxiedChain() } as any)

const writeClient = (account: string) =>
  createClient({
    chain: proxiedChain(),
    account: getAddress(account) as any,
    provider: window.ethereum as any,
  } as any)

function requireContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address is not configured. Set VITE_CONTRACT_ADDRESS.')
  }
  return CONTRACT_ADDRESS
}

async function ensureStudioNet() {
  const ethereum = window.ethereum
  if (!ethereum) throw new Error('No browser wallet detected.')

  const current = String(await ethereum.request({ method: 'eth_chainId' })).toLowerCase()
  if (current === STUDIO_CHAIN_HEX) return

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIO_CHAIN_HEX }],
    })
    return
  } catch (error: any) {
    if (error?.code !== 4902 && error?.data?.originalError?.code !== 4902) throw error
  }

  await ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: STUDIO_CHAIN_HEX,
        chainName: 'GenLayer StudioNet',
        rpcUrls: [rpcUrl()],
        nativeCurrency: { name: 'GEN Token', symbol: 'GEN', decimals: 18 },
      },
    ],
  })
  await ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: STUDIO_CHAIN_HEX }],
  })
}

const unpack = <T,>(raw: unknown): T => {
  if (raw && typeof raw === 'object' && 'result' in (raw as any)) {
    return unpack<T>((raw as any).result)
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw.trim()) as T
    } catch {
      return raw as T
    }
  }
  return raw as T
}

const isId = (value: unknown) =>
  typeof value === 'string' && /^[a-fA-F0-9]{64}$/.test(value)

const isAddress = (value: unknown) =>
  typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)

function validateArrangement(value: any): Arrangement {
  if (
    !value ||
    !isId(value.arrangement_id) ||
    !isAddress(value.author) ||
    !isAddress(value.other_wallet) ||
    typeof value.other_label !== 'string' ||
    typeof value.text !== 'string' ||
    !['AUTHOR_FIRST', 'OTHER_FIRST'].includes(value.outcome) ||
    !['AUTHOR_FIRST', 'OTHER_FIRST'].includes(value.order) ||
    !['OPEN', 'HALF_DONE', 'COMPLETE', 'WITHDRAWN'].includes(value.state) ||
    typeof value.author_confirmed !== 'boolean' ||
    typeof value.other_confirmed !== 'boolean' ||
    !['', 'AUTHOR', 'OTHER'].includes(value.first_mover)
  ) {
    throw new Error('Malformed get_arrangement response from RPC.')
  }
  return value as Arrangement
}

async function read(functionName: string, args: string[] = []) {
  return readClient().readContract({
    address: requireContract(),
    functionName,
    args,
    stateStatus: 'accepted',
  } as any)
}

async function submit(account: string, functionName: string, args: string[]) {
  if (!window.ethereum) throw new Error('No browser wallet detected.')
  await ensureStudioNet()
  const hash = await writeClient(account).writeContract({
    address: requireContract(),
    functionName,
    args,
    value: 0n,
  } as any)
  return String(hash)
}

async function rpc(method: string, params: unknown[]) {
  const response = await fetch(rpcUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  })
  const body = await response.json()
  if (!response.ok || body.error) throw new Error(body?.error?.message || `RPC ${response.status}`)
  return body.result
}

function leaderReceipt(transaction: any) {
  const consensus = transaction?.consensus_data ?? transaction?.consensusData
  const raw = consensus?.leader_receipt ?? consensus?.leaderReceipt
  if (!Array.isArray(raw)) return raw
  return raw.find((item: any) => String(item?.mode || '').toLowerCase() === 'leader') ?? raw[0]
}

async function transactionOutcome(hash: string): Promise<TransactionOutcome> {
  try {
    const transaction = await rpc('eth_getTransactionByHash', [hash])
    if (!transaction) return { status: 'PENDING' }
    const receipt = leaderReceipt(transaction)
    if (!receipt) return { status: 'PENDING' }
    const result = String(receipt.execution_result ?? receipt.executionResult ?? '').toUpperCase()
    if (result === 'SUCCESS' || result === 'FINISHED_WITH_RETURN') return { status: 'SUCCESS' }
    if (result === 'ERROR' || result === 'FINISHED_WITH_ERROR') {
      const reason = normalizeError(
        receipt.error ?? receipt.message ?? receipt.return_data ?? receipt.returnData ?? receipt,
      )
      return { status: 'ERROR', reason }
    }
    return { status: 'PENDING' }
  } catch {
    return { status: 'PENDING' }
  }
}

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export async function settleWrite(
  hash: string,
  arrangementId: string,
  accepted: (value: Arrangement) => boolean,
): Promise<WriteOutcome> {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    try {
      const arrangement = await stepOrder.getArrangement(arrangementId)
      if (accepted(arrangement)) return { status: 'SUCCESS', arrangement }
    } catch {
      // Open writes legitimately remain absent until accepted state advances.
    }

    const outcome = await transactionOutcome(hash)
    if (outcome.status === 'ERROR') throw new Error(outcome.reason)
    await delay(3_000)
  }

  const outcome = await transactionOutcome(hash)
  if (outcome.status === 'ERROR') throw new Error(outcome.reason)
  return { status: 'DELAYED' }
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('No browser wallet detected. Install MetaMask or a compatible wallet.')
  }
  const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[]
  if (!accounts?.[0]) throw new Error('Wallet connection was not approved.')
  await ensureStudioNet()
  return getAddress(accounts[0])
}

export async function passiveWallet() {
  if (!window.ethereum) return ''
  const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[]
  return accounts?.[0] ? getAddress(accounts[0]) : ''
}

export const stepOrder = {
  openArrangement: (account: string, otherWallet: string, otherLabel: string, text: string) =>
    submit(account, 'open_arrangement', [
      getAddress(otherWallet.trim()),
      pyNormalizeWhitespace(otherLabel),
      pyStrip(text),
    ]),
  confirmAuthor: (account: string, id: string, note: string) =>
    submit(account, 'confirm_author', [id.trim().toLowerCase(), pyStrip(note)]),
  confirmOther: (account: string, id: string, note: string) =>
    submit(account, 'confirm_other', [id.trim().toLowerCase(), pyStrip(note)]),
  withdraw: (account: string, id: string) =>
    submit(account, 'withdraw_before_first_move', [id.trim().toLowerCase()]),
  getArrangement: async (id: string) => {
    try {
      return validateArrangement(
        unpack(await read('get_arrangement', [id.trim().toLowerCase()])),
      )
    } catch (error) {
      const message = normalizeError(error)
      if (/Arrangement not found/i.test(message)) {
        const tagged = new Error('Arrangement not found') as Error & { code?: string }
        tagged.code = 'ARRANGEMENT_NOT_FOUND'
        throw tagged
      }
      throw error
    }
  },
  getAuthorNote: async (id: string) => String(unpack(await read('get_author_note', [id])) || ''),
  getOtherNote: async (id: string) => String(unpack(await read('get_other_note', [id])) || ''),
  getLimits: async () => unpack<Record<string, unknown>>(await read('get_limits')),
}

export function openArrangementCalldataBytes(
  otherWallet: string,
  otherLabel: string,
  text: string,
) {
  const call = abi.calldata.encode({
    method: 'open_arrangement',
    args: [
      otherWallet.trim(),
      pyNormalizeWhitespace(otherLabel),
      pyStrip(text),
    ],
  })
  const serialized = abi.transactions.serialize([call, false])
  return (serialized.length - 2) / 2
}

export { normalizeError }
