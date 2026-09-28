# StepOrder StudioNet runtime evidence

Contract address: [`0xDC51b49aF143eFb6671b23C8a4860ab6F17DF72B`](https://explorer-studio.genlayer.com/address/0xDC51b49aF143eFb6671b23C8a4860ab6F17DF72B)

Deployment transaction: [`0x79797ea8eb614468a4fadb872f09abadade73df7b8c6d1938d857a7a71d5c095`](https://explorer-studio.genlayer.com/tx/0x79797ea8eb614468a4fadb872f09abadade73df7b8c6d1938d857a7a71d5c095)

Deployment result: `FINALIZED`, GenVM `SUCCESS`, consensus `Accepted`.

Network: GenLayer StudioNet, chain ID `61999`

Runtime date: `2026-09-28`

Author wallet: `0x3065E31B1D993d7C0D59E6786844cBa56780B2d3`

Named other wallet: `0xdaE8968571C6E84f44F86d06F1071bbc8F807500`

Every completed write below is backed by an accepted Studio transaction screenshot. `HASH NOT CAPTURED` means the write succeeded and the accepted state was read, but the supplied screenshot did not expose the full write transaction hash.

## Highest-value comparison

Rows 2 and 6 use the same contract and the same two wallets. Only the arrangement language changes. The expected revert must switch from `The author moves first` to `The other side moves first`.

## Required transactions

| # | Wallet | Method and exact fields | Expected result | Transaction hash | Execution result | Accepted post-state |
|---:|---|---|---|---|---|---|
| 1 | author | `open_arrangement(other_wallet, "the Buyer", "Nothing is owed until the work is handed over.")` | `AUTHOR_FIRST`, `OPEN`; record ID | `HASH NOT CAPTURED` | Accepted response observed | `AUTHOR_FIRST`, `OPEN`, both confirmations `false` |
| 2 | other | `confirm_other(F4_ID, "Buyer attempted to confirm before the author.")` | Revert `The author moves first` | [`0x4ba9...f797`](https://explorer-studio.genlayer.com/tx/0x4ba9f3c7aaa9e5a563c8ae8982691cef080bc18ebf829683fec05604c82ff797) | `ACCEPTED`, `ERROR`; expected rollback | Write rolled back |
| 3 | author | `confirm_author(F4_ID, "Author confirmed the first move.")` | Success; `first_mover=AUTHOR`, `HALF_DONE` | [`0xa568...9d0d`](https://explorer-studio.genlayer.com/tx/0xa5685407eaf49e90c186c7c0282a5338f88e716119619f04108edc47f68c9d0d) | `ACCEPTED`, `SUCCESS` | `HALF_DONE` implied by accepted deterministic write |
| 4 | other | `confirm_other(F4_ID, "Buyer completed the second move.")` | Success; `COMPLETE` | [`0x751c...4814`](https://explorer-studio.genlayer.com/tx/0x751c0c8dd01919c5f85862bd09753ad1d02193d6bdacf5d871c5b755b3ec4814) | `ACCEPTED`, `SUCCESS` | `COMPLETE`; `first_mover=AUTHOR`; both confirmations `true` |
| 5 | author | `open_arrangement(other_wallet, "the Buyer", "We will not begin until we are paid.")` | `OTHER_FIRST`, `OPEN`; record ID | `HASH NOT CAPTURED` | Accepted response observed | `OTHER_FIRST`, `OPEN`, both confirmations `false` |
| 6 | author | `confirm_author(O4_ID, "Author attempted to confirm before the other side.")` | Revert `The other side moves first` | [`0xc1b6...3d39`](https://explorer-studio.genlayer.com/tx/0xc1b604ba23bfc68258f577894b373397e90e9a1fc004619b4c183d69df333d39) | `ACCEPTED`, `ERROR`; expected rollback | Write rolled back |
| 7 | other | `confirm_other(O4_ID, "Buyer confirmed the first move.")` | Success; `first_mover=OTHER`, `HALF_DONE` | [`0x2a00...6ee1`](https://explorer-studio.genlayer.com/tx/0x2a0058fc8cd8b712ac6ace10c8e2669d93ad536dc691c3305069e9466406ee1) | `ACCEPTED`, `SUCCESS` | `HALF_DONE` implied by accepted deterministic write |
| 8 | author | `withdraw_before_first_move(O4_ID)` | Revert `The first move has already been made` | [`0xe01a...e1c4`](https://explorer-studio.genlayer.com/tx/0xe01a5582ed67a403b61d5c983798b34d3100dd9f7dbcf69dba2afcca61afe1c4) | `ACCEPTED`, `ERROR`; expected rollback | Write rolled back |
| 9 | author | `confirm_author(O4_ID, "Author completed the second move.")` | Success; `COMPLETE` | [`0x1b6a...6b5f`](https://explorer-studio.genlayer.com/tx/0x1b6a4d48fbc78c2c444187ea62690d5a8e84fb164554afa5b07f4fca10ef6b5f) | `ACCEPTED`, `SUCCESS` | `COMPLETE`; `first_mover=OTHER`; both confirmations `true` |
| 10 | author | `open_arrangement(other_wallet, "the Buyer", "The Buyer pays on delivery.")` | `AUTHOR_FIRST`, `OPEN` | [`0x4b44...8dfc`](https://explorer-studio.genlayer.com/tx/0x4b44027588d320009f16e034a871e8c32cdb8ce62177e2c848836bcbbbac8dfc) | `ACCEPTED`, `SUCCESS`; semantic output `AUTHOR_FIRST` | `AUTHOR_FIRST`, `OPEN`, both confirmations `false` |
| 11 | author | `open_arrangement(other_wallet, "the Buyer", "The Buyer's confirmation opens the build window.")` | `OTHER_FIRST`, `OPEN` | [`0x21ae...4c25`](https://explorer-studio.genlayer.com/tx/0x21aefa56936f8533487e7f84efa1a70c157325b45dc82aab51c73bb21e364c25) | `ACCEPTED`, `SUCCESS`; semantic output `OTHER_FIRST` | `OTHER_FIRST`, `OPEN`, both confirmations `false` |

## Arrangement IDs

- F4: `e157499136170fe3c10db66e637db19946b07dfab0c3b524bc1252b7f4900a19`
- O4: `b0338276f2a7789ef9b4a8565ff315ee58cc3d6dfb3b18015c46b061fcec41c0`
- F1: `f235981d08f9d1fc86095b37c11ff6c5ed3950dd03c1f2b1d346cb9d0c4b7e85`
- O5: `e766213562200b04a62783070b4a81bc43b95fa65c0359941307f67741bc6428`

## Must-verify decision

- MV-1, F4 versus O4: `PASS` — opposite live verdicts were returned by the same deployed contract for the same two wallets
- MV-2, F1 versus O5: `PASS` — opposite semantic outputs and accepted states confirmed
- Frontend authoring gate: `OPEN`; both hard-gate pairs passed

## Supplemental permission check

The author wallet intentionally called `confirm_other` on O4. Transaction [`0xecdbaa...03993`](https://explorer-studio.genlayer.com/tx/0xecdbaa21885d62f76d033d0179f501d007a7c03247e1a6cbbc4b3c9263803993) was accepted with an expected rollback: `Only the named other side may confirm`.

## FirstMove Project deployment

- Project contract: [`0x1d9d229ba1Ff0b0ef6A0aFcAdAD6dFd08Db6ee26`](https://explorer-studio.genlayer.com/address/0x1d9d229ba1Ff0b0ef6A0aFcAdAD6dFd08Db6ee26)
- Deployment transaction: [`0x41d035...067f0`](https://explorer-studio.genlayer.com/tx/0x41d035e2287e9720a47083193cd9bdd3946555ffe9c1983eabe9ee9f368067f0)
- Observed result: `FINALIZED`, GenVM `SUCCESS`, consensus `Accepted`
- Address separation: PASS — it differs from the StepOrder IC address `0xDC51b49aF143eFb6671b23C8a4860ab6F17DF72B`
- Project interaction testing: `NOT RUN` until completed through the frontend.

Run through the frontend: branch A steps 1–4 and branch B steps 5–6 from the table
above. Record each new Project transaction hash and accepted post-state here. Capture exactly three
screenshots: the disabled wrong-order button for each opposite order, and one `COMPLETE` arrangement
with `first_mover` visible.
