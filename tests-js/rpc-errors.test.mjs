import test from 'node:test'
import assert from 'node:assert/strict'
import { contractReceiptMessage } from '../src/rpc-errors.mjs'

test('decodes a GenLayer UserError hidden in an InvalidInputRpcError receipt', () => {
  const error = {
    shortMessage: 'Missing or invalid parameters.',
    cause: {
      data: {
        receipt: {
          execution_result: 'ERROR',
          result: 'AUFycmFuZ2VtZW50IG5vdCBmb3VuZA==',
        },
      },
    },
  }

  assert.equal(contractReceiptMessage(error), 'Arrangement not found')
})

test('does not treat a transport error as an absent arrangement', () => {
  assert.equal(contractReceiptMessage(new Error('RPC unavailable')), '')
})
