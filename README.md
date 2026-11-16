# Stellar XDR coverage kit

Two synthetic examples pair raw Stellar XDR files with expected decoded values. The same files run against three pinned releases of the Stellar JavaScript SDK.

Read the [two-page technical architecture](docs/architecture/stellar-xdr-coverage-kit.pdf) for the proposed SDK and indexer checks. The [diagram sources](docs/architecture/) are available in Mermaid and editable Excalidraw formats.

## Run locally

With Node.js 22 or newer and Bun 1.3.14:

```sh
bun install --frozen-lockfile
bun run test
```

A fresh install needs registry access. The nine checks run offline.

## Read the examples from another language

Read the entry paths in [manifest.json](manifest.json). Each entry names its XDR type, records its source, and links to raw binary files relative to the repository root. [The draft JSON Schema](manifest.schema.json) describes the index and both entry shapes. The field `introducedBy` records the CAP and the network protocol version that introduced the feature. A null value means this example makes no CAP attribution.

| Entry | What the bytes represent | Expected result |
| --- | --- | --- |
| [ARST issuer order](issuer-order.json) | Two credit assets with the same code and different issuer keys | Comparing the first issuer's 32 bytes to the second gives -1. Comparing their encoded account strings gives +1. |
| [Muxed account](muxed-account.json) | A 4-byte type tag, 8-byte unsigned ID and 32-byte public key | The decimal ID is exactly `9007199254740993`. Keep this value as a decimal string or an unsigned 64-bit integer when comparing outputs. |

The ARST issuer bytes come from [Ryang-21's upstream fix and regression test](https://github.com/stellar/js-stellar-sdk/pull/1766). The fixture also retains the original base64 encodings. The muxed account is a local example of [CAP-0027](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0027.md), introduced in [Protocol 13](https://stellar.org/protocol-upgrades). Its ID is 2^53 + 1, beyond JavaScript’s safe integer range for `Number`.

## Observed SDK results

| JavaScript SDK | ARST comparator | Muxed ID preserved | All three XDR files round-trip |
| --- | ---: | --- | --- |
| 13.3.0 | +1 | Yes | Yes |
| 16.2.0 | +1 | Yes | Yes |
| 17.2.1 | -1 | Yes | Yes |

The suite validates the index and entries against the schema. It checks the asset order from raw issuer bytes and reads the muxed account fields directly from their wire offsets before comparing SDK results. A passing run includes the historical asset comparison difference. Coverage here is limited to these inputs and JavaScript releases. Go, Rust, Core and indexer adapters remain future work.
