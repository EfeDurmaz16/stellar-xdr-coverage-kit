const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const Ajv2020 = require("ajv/dist/2020");
const manifest = require("./manifest.json");
const schema = require("./manifest.schema.json");

const releases = [
  ["13.3.0", require("stellar-sdk-13"), 1],
  ["16.2.0", require("stellar-sdk-16"), 1],
  ["17.2.1", require("stellar-sdk-17"), -1],
];

function readFixture(relativePath) {
  return readFileSync(path.join(__dirname, relativePath));
}

const validator = new Ajv2020({ strict: true });
validator.addSchema(schema, "manifest");
const validateManifest = validator.getSchema("manifest");
const validateEntry = validator.getSchema("manifest#/$defs/entry");

assert.ok(validateManifest(manifest), validator.errorsText(validateManifest.errors));
const entries = manifest.entries.map((name) => JSON.parse(readFixture(name)));
test("manifest and every entry match the draft schema and have unique IDs", () => {
  for (const entry of entries) {
    assert.ok(validateEntry(entry), validator.errorsText(validateEntry.errors));
  }
  const ids = new Set(entries.map((entry) => entry.id));
  assert.equal(ids.size, entries.length);
  assert.ok(ids.has("asset-issuer-byte-order"));
  assert.ok(ids.has("muxed-account-uint64-id"));
});

function testAssetPair(entry) {
  test(entry.id + ": raw issuer keys and StrKey text sort in opposite directions", () => {
    const [left, right] = entry.issuers;
    const order = Buffer.compare(Buffer.from(left.keyHex, "hex"), Buffer.from(right.keyHex, "hex"));
    assert.equal(order, entry.expectedComparison);
    assert.ok(left.strKey > right.strKey);
  });

  for (const [version, { Asset, StrKey, xdr }, observedOrder] of releases) {
    test(entry.id + ": SDK " + version + " decodes both assets and returns " + observedOrder, () => {
      const assets = entry.issuers.map(({ strKey, keyHex, assetXdrBase64, xdrPath }) => {
        const bytes = readFixture(xdrPath);
        assert.equal(bytes.toString("base64"), assetXdrBase64);
        assert.deepEqual(Buffer.from(StrKey.decodeEd25519PublicKey(strKey)), Buffer.from(keyHex, "hex"));
        const asset = Asset.fromOperation(xdr.Asset.fromXDR(bytes));
        assert.equal(asset.getCode(), entry.assetCode);
        assert.equal(asset.getIssuer(), strKey);
        assert.deepEqual(Buffer.from(asset.toXDRObject().toXDR()), bytes);
        return asset;
      });
      const [left, right] = assets;
      assert.equal(Asset.compare(left, right), observedOrder);
      assert.equal(Asset.compare(right, left), -observedOrder);
      assert.equal(Asset.compare(left, left), 0);
    });
  }
}

function testMuxedAccount(entry) {
  const expected = entry.expected;
  const bytes = readFixture(entry.xdrPath);
  test(entry.id + ": XDR field widths and unsigned integer decoded without an SDK", () => {
    assert.equal(bytes.length, 44);
    assert.equal(bytes.readUInt32BE(0), expected.discriminant);
    assert.equal(bytes.readBigUInt64BE(4).toString(), expected.idDecimal);
    assert.equal(bytes.subarray(12).toString("hex"), expected.keyHex);
  });

  for (const [version, { MuxedAccount, encodeMuxedAccountToAddress, xdr }] of releases) {
    test(entry.id + ": SDK " + version + " preserves the uint64 ID and account bytes", () => {
      const account = xdr.MuxedAccount.fromXDR(bytes);
      const address = encodeMuxedAccountToAddress(account);
      const decoded = MuxedAccount.fromAddress(address, "0");
      assert.equal(decoded.id(), expected.idDecimal);
      assert.equal(decoded.baseAccount().accountId(), expected.baseAccount);
      assert.deepEqual(Buffer.from(account.toXDR()), bytes);
    });
  }
}

for (const entry of entries) {
  if (entry.xdrType === "Asset") testAssetPair(entry);
  if (entry.xdrType === "MuxedAccount") testMuxedAccount(entry);
}
