import { abi } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { encodeFunctionData } from 'viem'

const RPC = process.env.STUDIONET_RPC || 'https://studio.genlayer.com/api'
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || '0xDC51b49aF143eFb6671b23C8a4860ab6F17DF72B'
const FROM_ADDRESS =
  process.env.FROM_ADDRESS || '0x1111111111111111111111111111111111111111'
const OTHER_WALLET =
  process.env.OTHER_WALLET || '0x2222222222222222222222222222222222222222'
const OTHER_LABEL = 'the Buyer'

const cases = [
  ['F4', 'AUTHOR_FIRST', 'Nothing is owed until the work is handed over.'],
  ['O4', 'OTHER_FIRST', 'We will not begin until we are paid.'],
  ['F1', 'AUTHOR_FIRST', 'The Buyer pays on delivery.'],
  ['O5', 'OTHER_FIRST', "The Buyer's confirmation opens the build window."],
  ['F2', 'AUTHOR_FIRST', 'We release the licence key, then invoice.'],
  ['O1', 'OTHER_FIRST', 'We ship on receipt of cleared funds.'],
  ['F3', 'AUTHOR_FIRST', 'Payment falls due thirty days after the report is sent.'],
  ['O3', 'OTHER_FIRST', 'Work starts once the purchase order is issued.'],
  ['F5', 'AUTHOR_FIRST', 'The Buyer has seven days to reject after taking possession.'],
  ['O2', 'OTHER_FIRST', 'The deposit secures the slot.'],
]

for (const [name, value] of [
  ['CONTRACT_ADDRESS', CONTRACT_ADDRESS],
  ['FROM_ADDRESS', FROM_ADDRESS],
  ['OTHER_WALLET', OTHER_WALLET],
]) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${name} must be a 20-byte 0x address.`)
  }
}
if (FROM_ADDRESS.toLowerCase() === OTHER_WALLET.toLowerCase()) {
  throw new Error('FROM_ADDRESS and OTHER_WALLET must differ.')
}

const addTransactionAbi = studionet.consensusMainContract.abi.filter(
  (entry) => entry.type === 'function' && entry.name === 'addTransaction',
)
if (addTransactionAbi.length !== 1) {
  throw new Error(`Expected one addTransaction ABI entry, found ${addTransactionAbi.length}.`)
}

const { calldata, transactions } = abi
let requestId = 0

async function rpc(method, params) {
  const response = await fetch(RPC, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      origin: 'https://studio.genlayer.com',
      referer: 'https://studio.genlayer.com/',
      'user-agent': 'FirstMove-Calldata-Probe/0.1',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }),
    signal: AbortSignal.timeout(12_000),
  })
  const body = await response.json()
  if (!response.ok || body.error) {
    const detail = body.error
      ? `${body.error.code}: ${body.error.message}`
      : `HTTP ${response.status}`
    throw new Error(`${method} failed: ${detail}`)
  }
  return body.result
}

const byteLength = (hex) => (hex.length - 2) / 2

async function probe([id, expected, text]) {
  const call = calldata.encode({
    method: 'open_arrangement',
    args: [OTHER_WALLET, OTHER_LABEL, text],
  })
  const txData = transactions.serialize([call, false])
  const wrapped = encodeFunctionData({
    abi: addTransactionAbi,
    functionName: 'addTransaction',
    args: [
      FROM_ADDRESS,
      CONTRACT_ADDRESS,
      BigInt(studionet.defaultNumberOfInitialValidators),
      BigInt(studionet.defaultConsensusMaxRotations),
      txData,
    ],
  })
  const gasHex = await rpc('eth_estimateGas', [
    {
      from: FROM_ADDRESS,
      to: studionet.consensusMainContract.address,
      data: wrapped,
      value: '0x0',
    },
  ])

  return {
    id,
    expected,
    textChars: [...text].length,
    textBytes: new TextEncoder().encode(text).length,
    genvmBytes: byteLength(txData),
    evmBytes: byteLength(wrapped),
    gas: BigInt(gasHex).toString(),
    result: 'PASS',
  }
}

const rows = await Promise.all(
  cases.map(async (item) => {
    try {
      return await probe(item)
    } catch (error) {
      return {
        id: item[0],
        expected: item[1],
        textChars: [...item[2]].length,
        textBytes: new TextEncoder().encode(item[2]).length,
        genvmBytes: '-',
        evmBytes: '-',
        gas: '-',
        result: `FAIL: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }),
)

console.log(`RPC ${RPC}`)
console.log(`CONTRACT_ADDRESS ${CONTRACT_ADDRESS}`)
console.log(`FROM_ADDRESS ${FROM_ADDRESS}`)
console.log(`OTHER_WALLET ${OTHER_WALLET}`)
console.log(`OTHER_LABEL ${JSON.stringify(OTHER_LABEL)}`)
console.table(rows)

const failures = rows.filter((row) => row.result !== 'PASS')
if (failures.length > 0) {
  console.error(`CALLDATA_PROBE_FAIL ${failures.length}/${rows.length}`)
  process.exitCode = 1
} else {
  console.log(`CALLDATA_PROBE_PASS ${rows.length}/${rows.length}`)
}
