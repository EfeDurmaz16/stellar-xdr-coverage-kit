# Stellar XDR coverage kit

One synthetic fixture captures how three releases of the Stellar JavaScript SDK sort two `ARST` assets. Their issuer keys sort one way as 32-byte values and the other way as encoded account strings. Comparing the strings can give a different asset order for the same liquidity pool.

## Run locally

With Node.js 22 and Bun 1.3.14:

```sh
bun install --frozen-lockfile
bun run test
```

Dependency installation needs registry access on a fresh machine. The tests run offline.

| JavaScript SDK | Compare first asset to second | Same order as issuer bytes |
| --- | ---: | --- |
| 13.3.0 | +1 | No |
| 16.2.0 | +1 | No |
| 17.2.1 | -1 | Yes |

The first test derives the expected order from raw public key bytes. The remaining tests verify both assets' decoded fields, byte-for-byte XDR round trips and each release's observed comparator result. Passing tests include the historical divergence in the two older releases.

The key pair of examples comes from [Ryang-21's upstream fix and regression test](https://github.com/stellar/js-stellar-sdk/pull/1766). The comparison fixture adds serialized XDR and expected decoded fields for reuse. This baseline covers one synthetic asset pair in the JavaScript SDK. Cross-language and indexer comparisons remain future work.
