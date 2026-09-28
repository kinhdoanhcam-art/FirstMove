# StepOrder test plan

## Semantic case set

Use `other_label = "the Buyer"`. The author is the other party in each sentence.

| Pair | Case | Expected | Text | Classification |
|---|---|---|---|---|
| F4/O4 | F4 | `AUTHOR_FIRST` | Nothing is owed until the work is handed over. | Kill test |
| F4/O4 | O4 | `OTHER_FIRST` | We will not begin until we are paid. | Kill test |
| F1/O5 | F1 | `AUTHOR_FIRST` | The Buyer pays on delivery. | Kill test |
| F1/O5 | O5 | `OTHER_FIRST` | The Buyer's confirmation opens the build window. | Kill test |
| F3/O3 | F3 | `AUTHOR_FIRST` | Payment falls due thirty days after the report is sent. | Kill test |
| F3/O3 | O3 | `OTHER_FIRST` | Work starts once the purchase order is issued. | Kill test |
| F5/O2 | F5 | `AUTHOR_FIRST` | The Buyer has seven days to reject after taking possession. | Kill test |
| F5/O2 | O2 | `OTHER_FIRST` | The deposit secures the slot. | Kill test |
| F2/O1 | F2 | `AUTHOR_FIRST` | We release the licence key, then invoice. | Definition compliance |
| F2/O1 | O1 | `OTHER_FIRST` | We ship on receipt of cleared funds. | Definition compliance |

F4/O4 must disagree despite sharing negation and `until`. F1/O5 must disagree despite both making the declared other side the grammatical subject. A shared verdict in either pair stops the project.

## Nine deterministic negative tests

These cases run offline and must not be delegated to a wallet operator:

1. Reject `other_wallet == author`.
2. Reject wrong-wallet calls to both confirmation methods.
3. Reject a repeated confirmation.
4. Reject both confirmations after `WITHDRAWN`.
5. Reject withdrawal by a non-author.
6. Reject reserved prompt tokens in either text or label.
7. Reject duplicate arrangements after text normalization.
8. Give internal Python whitespace variants the same arrangement ID.
9. Normalize mixed-case wallet text to one lowercase address.

## Static contract gates

- Exact v0.2.16 header and dependency.
- No v0.3 API, web call, clock, payment, or transfer primitive.
- Only `_classify_order` may call the model.
- No public preview, dry-run, reclassification, or order mutator.
- Withdrawal checks `first_mover` before the terminal-state fallback.
- Both order teeth and both first-mover assignments exist.

## Frontend utility gates before UI authoring

- Python-compatible strip, code-point length, and whitespace normalization across at least 12 edge cases, including U+001C–U+001F and U+0085.
- HTML escaping for all contract-provided text.
- Accepted-state duplicate preflight must block an existing arrangement, allow only explicit not-found, and propagate RPC errors.

## Live StudioNet gates

The only manual phase is the 11-transaction table in `RUNTIME_EVIDENCE.md`. It covers four semantic must-verifies and the two deterministic teeth with real hashes. No frontend is authored until those results are accepted and match their postconditions.
