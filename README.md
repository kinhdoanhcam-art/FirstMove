FirstMove does not ask whether one step is required for another, and it does not look for a deadlock. Both sides will act. It asks only which of them has to move while the other is still free to wait, and it makes the contract refuse the second move until the first one is on record.

# StepOrder

`StepOrder` is the GenLayer Intelligent Contract behind the `FirstMove` project. An author names another wallet, supplies a label for that side, and writes one arrangement. GenLayer consensus decides exactly one semantic question: whether the author or the named other side must act first under that text.

The verdict is an ordering mechanism, not a permanent gate. Both sides can ultimately confirm. The contract deterministically refuses the later side's confirmation until the required first move is recorded, stores the actual `first_mover`, and removes the author's withdrawal path as soon as either side makes the first move.

## How to try the Project

FirstMove needs a fresh deployment of the frozen source and two different wallets. The Project
address must not reuse the StepOrder Intelligent Contract submission address.

Final Project contract: [`0x1d9d229ba1Ff0b0ef6A0aFcAdAD6dFd08Db6ee26`](https://explorer-studio.genlayer.com/address/0x1d9d229ba1Ff0b0ef6A0aFcAdAD6dFd08Db6ee26)

Deployment transaction: [`0x41d035...067f0`](https://explorer-studio.genlayer.com/tx/0x41d035e2287e9720a47083193cd9bdd3946555ffe9c1983eabe9ee9f368067f0)

1. Copy `.env.example` to `.env`; it already contains the final Project address above.
2. Run `npm ci`, then `npm run dev`; connect the author wallet on StudioNet 61999.
3. Confirm the contract badge links to the Project address, not the IC address.
4. Open an arrangement. For the shortest one-wallet review path, use
   `Nothing is owed until the work is handed over.` and confirm as the author.
5. Switch to the named other wallet to finish that arrangement. To see the controls reverse,
   open a second arrangement with `We will not begin until we are paid.`

The UI reads only accepted state. A submitted hash is never presented as success until the expected
accepted post-state is observable. If confirmation is delayed, refresh the known arrangement ID
instead of resubmitting.

## How to try the contract directly

The Intelligent Contract evidence uses GenLayer Studio on StudioNet 61999:

1. Deploy `contracts/StepOrder.py` in Normal (Full Consensus) mode.
2. Use two wallets: one author and one named other side.
3. Follow the 11-transaction checklist in `RUNTIME_EVIDENCE.md` exactly.
4. Record every transaction hash, execution result, arrangement ID, and accepted post-state.
5. Stop if F4/O4 or F1/O5 do not produce opposite verdicts. Do not change the rubric to force a result.

MV-1 (F4 versus O4) and MV-2 (F1 versus O5) passed on StudioNet with opposite live verdicts. Both order teeth were enforced, so frontend authoring is unlocked.

## Contract behavior

- `open_arrangement` performs the only nondeterministic operation and fixes `order` once.
- `confirm_author` and `confirm_other` are symmetric deterministic writes with opposite order teeth.
- `withdraw_before_first_move` is available only to the author before any first move.
- `get_arrangement`, note views, `get_rubric`, and `get_limits` are deterministic reads.
- There is no preview, dry-run, or reclassification endpoint.

## Honest limitations

1. The contract holds no funds and enforces nothing off-chain. It only refuses to record the second move before the required first move.
2. Both confirmation calls are self-reports. A transaction does not prove that goods, payment, work, or any other external act occurred.
3. A wrong `OTHER_FIRST` verdict is the main external risk: it could make the named other side expose itself first. Malformed or unclear output therefore fails safely to `AUTHOR_FIRST`, and the other side still chooses whether to confirm.
4. A wrong `AUTHOR_FIRST` verdict can make the author go first even when the text did not require it. That burden intentionally falls on the party that supplied unclear text.
5. The author supplies the other wallet. Different addresses do not prove different people, although both addresses remain public in contract state.
6. The contract has no clock or deadline. A required first mover may never act. The author can withdraw only before any first move; the other side has no equivalent withdrawal call.

## No escrow

Example arrangements mention invoices, deposits, delivery, and payment only as text for semantic classification. `StepOrder` does not receive, custody, transfer, or verify money.

## Offline verification

```bash
python3 STEPORDER_KILLSET_CHECK.py contracts/StepOrder.py
python3 -m genvm_linter.cli lint contracts/StepOrder.py
npm test
npm run verify:source
```

See `RUNTIME_EVIDENCE.md` for transaction-level evidence and `TESTING.md` for measured build and test results.
