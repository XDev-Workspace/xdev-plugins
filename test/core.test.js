import { test, before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Isolate agent dir so tests never write into ~/.omp/agent.
const fakeAgent = mkdtempSync(join(tmpdir(), "xdev-test-"));
process.env.PI_CODING_AGENT_DIR = fakeAgent;

const { normalizeLevel, loadManifest, installedVersion } = await import("../lib/core.js");

test("normalizeLevel accepts off/lite/full/ultra, rejects junk", () => {
  assert.equal(normalizeLevel("full"), "full");
  assert.equal(normalizeLevel("ULTRA "), "ultra");
  assert.equal(normalizeLevel("off"), "off");
  assert.equal(normalizeLevel("max"), null);
  assert.equal(normalizeLevel(""), null);
});

test("state manifest seeds from packaged manifest.json", () => {
  const m = loadManifest();
  assert.equal(m.package, "xdev-plugins");
  assert.equal(m.plugins.length, 3);
  assert.deepEqual(
    m.plugins.map((p) => p.name),
    ["@dietrichgebert/ponytail", "pi-caveman", "pi-rtk-optimizer"],
  );
  for (const p of m.plugins) assert.match(p.pin, /^\d+\.\d+\.\d+$/);
});

test("installedVersion returns null for unknown package", () => {
  assert.equal(installedVersion("xdev-nope-package"), null);
});