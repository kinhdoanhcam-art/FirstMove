import test from "node:test"
import assert from "node:assert/strict"
import { requireArrangementAbsent } from "../src/preflight.mjs"

test("preflight blocks a duplicate before any send", async () => {
  let sends = 0
  const read = async () => ({ arrangement_id: "a".repeat(64) })
  await assert.rejects(requireArrangementAbsent(read, "a".repeat(64)), /already exists/)
  assert.equal(sends, 0)
})

test("preflight permits only an explicit not-found result", async () => {
  const read = async () => {
    const error = new Error("missing")
    error.code = "ARRANGEMENT_NOT_FOUND"
    throw error
  }
  assert.equal(await requireArrangementAbsent(read, "b".repeat(64)), true)
})

test("preflight does not hide transport errors", async () => {
  const read = async () => { throw new Error("RPC unavailable") }
  await assert.rejects(requireArrangementAbsent(read, "c".repeat(64)), /RPC unavailable/)
})
