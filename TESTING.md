# StepOrder verification status

## ĐÃ TỰ CHẠY

All results below were measured against the exact `contracts/StepOrder.py` included with this package.

| Check | Result | Measured detail |
|---|---|---|
| Kill-set feature gate | PASS, return code 0 | No token or bigram separates `AUTHOR_FIRST` from `OTHER_FIRST` |
| Rubric overlap gate | PASS, return code 0 | Zero content words shared with the ten semantic cases |
| Manual rubric read | PASS | The rubric does not name negation, temporal conjunctions, grammatical subject, or event-anchored timing categories used by the case set |
| `genvm-linter lint` | PASS, return code 0 | 3 checks passed, 0 warnings |
| JavaScript utility/package tests | PASS, return code 0 | 11 tests passed |
| Python deterministic and source tests | PASS, return code 0 | 15 tests passed: 9 state-machine negative tests and 6 static contract gates |
| Python text parity coverage | PASS | 12 strip cases plus normalization and Unicode code-point length; includes U+001C–U+001F and U+0085 |
| HTML escape test | PASS | Contract-provided tag, quote, apostrophe, and ampersand characters are escaped |
| Accepted-state preflight tests | PASS | Existing arrangement blocked; explicit not-found allowed; RPC error propagated |
| Source SHA-256 | PASS | `612bf869931b37751eee5b69bea85506eb2828a0a41c50aeed6ec8334c22a167` |
| Calldata probe | PASS, return code 0 | 10/10 `eth_estimateGas` calls accepted; GenVM payloads 120–152 bytes |
| Production frontend build | PASS, return code 0 | `tsc -b && vite build`; 481 modules transformed |

Total automated test functions: **26 passed**. The 12 parity vectors are assertions inside the measured parity test, not inflated into twelve separate test-function claims.

Commands:

```bash
python3 STEPORDER_KILLSET_CHECK.py contracts/StepOrder.py
python3 -m genvm_linter.cli lint contracts/StepOrder.py
npm test
npm run verify:source
```

## Calldata measurements

| Case | Expected | Text chars | GenVM bytes | Wrapped EVM bytes | Estimated gas |
|---|---|---:|---:|---:|---:|
| F4 | `AUTHOR_FIRST` | 46 | 139 | 356 | 500000 |
| O4 | `OTHER_FIRST` | 36 | 129 | 356 | 500000 |
| F1 | `AUTHOR_FIRST` | 27 | 120 | 324 | 500000 |
| O5 | `OTHER_FIRST` | 48 | 141 | 356 | 500000 |
| F2 | `AUTHOR_FIRST` | 41 | 134 | 356 | 500000 |
| O1 | `OTHER_FIRST` | 36 | 129 | 356 | 500000 |
| F3 | `AUTHOR_FIRST` | 55 | 148 | 356 | 500000 |
| O3 | `OTHER_FIRST` | 46 | 139 | 356 | 500000 |
| F5 | `AUTHOR_FIRST` | 59 | 152 | 356 | 500000 |
| O2 | `OTHER_FIRST` | 29 | 122 | 324 | 500000 |

## STUDIO NET RUNTIME — INTELLIGENT CONTRACT COMPLETE

- Deployment is finalized and accepted at `0xDC51b49aF143eFb6671b23C8a4860ab6F17DF72B`.
- MV-1 passed with the same deployed contract and the same two wallets: F4 returned `AUTHOR_FIRST`; O4 returned `OTHER_FIRST`.
- Both opposite order teeth produced their exact expected rollbacks.
- The permission guard rejected an author-wallet call to `confirm_other`.
- Both valid first moves and both valid second moves were accepted with `SUCCESS`.
- Withdrawal after the first move produced the expected rollback `The first move has already been made`.
- Final accepted-state reads confirm both arrangements are `COMPLETE`, both confirmation flags are `true`, and the recorded first movers are `AUTHOR` for F4 and `OTHER` for O4.
- MV-2 passed: F1 returned `AUTHOR_FIRST`; O5 returned `OTHER_FIRST`; both accepted-state reads match their transaction outputs.

## STUDIO NET RUNTIME — PROJECT COMPLETE

The separate Project deployment is finalized at `0x1d9d229ba1Ff0b0ef6A0aFcAdAD6dFd08Db6ee26`, which is different from the Intelligent Contract submission address. The six-step frontend review path passed on `2026-09-28` with author wallet `0x3065E31B1D993d7C0D59E6786844cBa56780B2d3` and named other wallet `0x5a52d040581A76e2C032542855D31480f2ea7097`:

- F4 opened as `AUTHOR_FIRST`; the named other's premature action was disabled with `The author moves first`.
- The author moved first, accepted state reached `HALF_DONE`, and `first_mover=AUTHOR` was displayed.
- The named other completed the arrangement; accepted state reached `COMPLETE` with both confirmations true.
- O4 opened as `OTHER_FIRST`; the author's premature action was disabled with `The other side moves first`.

The successful accepted states and both exact UI guards are recorded in `RUNTIME_EVIDENCE.md`. Full Project write hashes were not visible in the supplied screenshots and are explicitly marked `HASH NOT CAPTURED`; no hash has been inferred or invented.

Stop immediately and report the observed result if either F4/O4 or F1/O5 receives the same verdict. Do not edit the rubric to make a failed case pass.

## What this run does NOT prove

The runtime evidence proves only the exact calls and states recorded in `RUNTIME_EVIDENCE.md`. It does not prove the remaining semantic cases, every possible arrangement text, external performance, or Studio RPC acceptance for every calldata size up to the 600-character contract limit.
