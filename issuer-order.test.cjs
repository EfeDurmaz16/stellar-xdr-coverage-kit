const assert = require("node:assert/strict");
const test = require("node:test");
const fixture = require("./issuer-order.json");

const releases = [
  ["13.3.0", require("stellar-sdk-13"), 1],
  ["16.2.0", require("stellar-sdk-16"), 1],
  ["17.2.1", require("stellar-sdk-17"), -1],
];

test("raw issuer bytes and StrKey text sort in opposite directions", () => {
  const [left, right] = fixture.issuers;
  const order = Buffer.compare(Buffer.from(left.keyHex, "hex"), Buffer.from(right.keyHex, "hex"));
  assert.equal(order, fixture.expectedComparison);
  assert.ok(left.strKey > right.strKey);
});

for (const [version, { Asset, StrKey, xdr }, observedOrder] of releases) {
  test(`SDK ${version}: ARST round trip and observed issuer order ${observedOrder}`, () => {
    const assets = fixture.issuers.map(({ strKey, keyHex, assetXdrBase64 }) => {
      assert.deepEqual(Buffer.from(StrKey.decodeEd25519PublicKey(strKey)), Buffer.from(keyHex, "hex"));
      const asset = Asset.fromOperation(xdr.Asset.fromXDR(assetXdrBase64, "base64"));
      assert.equal(asset.getCode(), fixture.assetCode);
      assert.equal(asset.getIssuer(), strKey);
      assert.equal(asset.toXDRObject().toXDR("base64"), assetXdrBase64);
      return asset;
    });

    const [left, right] = assets;
    assert.equal(Asset.compare(left, right), observedOrder);
    assert.equal(Asset.compare(right, left), -observedOrder);
    assert.equal(Asset.compare(left, left), 0);
  });
}
