# Stellar XDR Coverage Kit

[Download the illustrated two-page architecture](docs/architecture/stellar-xdr-coverage-kit.pdf). The [source directory](docs/architecture/) contains the LaTeX document and its editable Mermaid and Excalidraw diagrams. To rebuild the PDF, run `pdflatex stellar-xdr-coverage-kit.tex` twice from that directory.

## What a maintainer can check

A wallet maintainer upgrades an SDK. Can the wallet still read the same ledger and identify the same participants? Two tests answer different parts of that question. A codec test compares decoded values and re-encoded bytes with a fixture. A replay test compares the rows the wallet actually stores with changes in ledger meta. A decoder can pass the first test while the wallet silently loses a row in the second.

The review bundle contains the first two synthetic fixtures, a draft manifest schema and JavaScript tests. The generator, cross-language runners, indexer adapter, linter and guide described below are the proposed funded work.

## Corpus and reference values

The entry point is `manifest.json`. Its companion `manifest.schema.json` describes how to identify each case and interpret its entry. The ARST case contains two serialized assets because the result is their relative order. The second case contains one serialized muxed account. Each has explicit expected values, a source and a protocol context. Protocol-of-introduction and observed ledger protocol are separate facts. A synthetic object has no observed ledger height or network.

The funded Rust generator will use pinned XDR definitions. Its coverage index will enumerate relevant CAPs at the pinned protocol, give each applicable shape a fixture or a named gap, and distinguish synthetic objects, captures from public history and output from a local stellar-core. Captures will include network, protocol, ledger sequence, source revision and digest. Generation will support the public and test network passphrases wherever network identity is part of the result. The same generator inputs must produce identical bytes on a clean run.

For full ledgers, I will compare output with independent stellar-core LedgerCloseMeta goldens from its `--check-lcm` workflow. Standalone XDR values will be checked against typed expected values. Bytes are binary fixtures, opaque bytes in expected values use hex, and 64-bit IDs use decimal strings. A corpus test never computes its expected result with the same library call it is testing.

## Interfaces and outputs

| Component | Reads | Writes | How to verify |
| --- | --- | --- | --- |
| Conformance runners | The same checked-in XDR, typed expected values and pinned SDK versions | One record per fixture and SDK, with field equality and byte equality reported separately | Run JS, Go and Rust offline. Compare a current stable pin with the relevant historical pins. A missing result is visible in the matrix. |
| Reference adapter | Ordered LedgerCloseMeta fixtures served by a local RPC implementation of `getLedgers` | Wallet-backend ingestion results from an isolated database | Read the rows the real pinned pipeline produced. Compare participants, effects and counts with a reference derived from ledger meta. Record pass, wrong value or missing row for each expected item. |
| Go linter | Go indexer source and a versioned rule configuration | Findings with rule ID, path and source location | Check three rule families on small annotated Go examples and the pinned wallet-backend checkout. Review or correct any false positives before publishing the baseline. |
| Guide and findings register | Rule IDs, tested corpus entries, SDK/pipeline versions and upstream reports | A field guide and links from each divergence to its status | A maintainer can move from a report row to the exact bytes, expected fields, version and disposition. Each field-table example resolves to its fixture. |

The first SDK sweep covers issuer byte ordering, muxed source and destination, lossless account and offer IDs, legal vector limits, nested authorization data and map key identity. The release report will track the public JS cases #1766, #1785 and #1789 and wallet-backend #729, #731 and #716 by version. Each retired or inapplicable case will retain its reason. The reference indexer is wallet-backend. Other pipelines can implement the documented adapter interface.

## Threat model and monitoring

| What can go wrong | Control | Observable signal |
| --- | --- | --- |
| A fixture drifts, or its expected result repeats an SDK mistake | Pin source/version, check content digests and verify against an independent reference | CI reports the entry ID, expected value and first differing field or byte. |
| The indexer accepts a pass-through field as if core had validated it, handles a nested structure without a cap, or attributes a participant from the envelope | Three Go lint rules, a field-by-field validation table and an independent ledger-meta expectation | Lint results point to source lines. Replay reports distinguish incorrect attribution from a missing record. |
| A run skips ledgers, silently drops results, or exceeds its resource budget | Verify sequence ranges and expected row counts. Stream the corpus. Enforce a CI memory limit and per-job timeout. | Report includes protocol, last ledger, completed/expected cases, peak memory and failed step. A partial run fails. |
| A protocol upgrade makes the last passing output stale | Check public protocol/SDK releases, then validate a small, fixed public ledger window with pinned tooling | Publish the network, sequence range, release pins and outcome. Flag missing or out-of-date data. |

The live network signal is read-only. Periodic capture is separate from ordinary PR tests, which run offline after dependencies and build images have been fetched. No signing keys, deployed contract, production wallet access or user telemetry are needed. CI stores diagnostic results and fixture identifiers. Public history is limited to the ledger data needed to explain each case.

## Release and upkeep

I will publish MIT-licensed tagged releases, monthly progress notes and a one-command reviewer run. New ordinary compatibility findings will have an upstream issue or an existing issue link. I will coordinate privately with the affected maintainer if publishing the details could put users at risk. The public register can record disclosure status until the details can be shared.

The guide will cover validated and pass-through fields, recommended size and depth limits, participants from meta, muxed accounts and SEP-0023 signed-payload forms. I will request review from a Stellar core or platform engineer before claiming the guide is approved for publication. The release includes a versioned guide suitable for review even if upstream scheduling takes longer.

I will maintain the release through the first protocol upgrade following delivery. The release checklist pins the old and new versions, reruns the matrix and wallet replay, and records new gaps or a compatibility patch. Public work items and a reproducible checkout let another maintainer repeat the process.

## References

- [SCF request for proposals](https://github.com/stellar/scf-handbook/blob/cf94e3691faba4187b72c4d98cc4ff4a66c75fbc/scf-awards/build-award/rfp-track.md#L166)
- [Issuer ordering and original upstream fix](https://github.com/stellar/js-stellar-sdk/pull/1766)
- [Core golden ledger verification](https://github.com/stellar/stellar-core/pull/5435)
- [Reference pipeline](https://github.com/stellar/wallet-backend)
