import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");

export const LEVELS = ["off", "lite", "full", "ultra"];

export function normalizeLevel(raw) {
  const v = String(raw || "").trim().toLowerCase();
  return LEVELS.includes(v) ? v : null;
}

/** Agent dir: $PI_CODING_AGENT_DIR → ~/.omp/agent → legacy ~/.pi/agent. */
export function agentDir() {
  if (process.env.PI_CODING_AGENT_DIR) return process.env.PI_CODING_AGENT_DIR;
  const modern = join(homedir(), ".omp", "agent");
  return existsSync(modern) ? modern : join(homedir(), ".pi", "agent");
}

export function pluginRoot() {
  return join(homedir(), ".omp", "plugins");
}

/** Owned state manifest: pins xdev manages, outside the npm package so `npm i -g` never clobbers it. */
export function stateManifestPath() {
  return join(agentDir(), "xdev-manifest.json");
}

export function loadManifest() {
  const state = stateManifestPath();
  if (existsSync(state)) {
    try {
      return JSON.parse(readFileSync(state, "utf8"));
    } catch {
      // corrupt state → reseed
    }
  }
  const seed = JSON.parse(readFileSync(join(PKG_ROOT, "manifest.json"), "utf8"));
  saveManifest(seed);
  return seed;
}

export function saveManifest(m) {
  const state = stateManifestPath();
  mkdirSync(dirname(state), { recursive: true });
  writeFileSync(state, JSON.stringify(m, null, 2) + "\n", "utf8");
}

/** Installed version of a constituent, or null when absent. */
export function installedVersion(name) {
  const pkgPath = join(pluginRoot(), "node_modules", name, "package.json");
  try {
    return JSON.parse(readFileSync(pkgPath, "utf8")).version ?? null;
  } catch {
    return null;
  }
}

export async function registryLatest(name) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`registry ${name}: HTTP ${res.status}`);
  }
  const data = await res.json();
  return typeof data?.version === "string" ? data.version : null;
}

/** Install a constituent via the pi CLI. Try `pi install`, fall back to `pi plugin install`. */
export function piInstall(spec, opts = {}) {
  if (opts.dryRun) return { ok: true, stderr: "" };
  for (const args of [["install", spec], ["plugin", "install", spec], ["plugin", "install", `npm:${spec}`]]) {
    const r = spawnSync("pi", args, { encoding: "utf8" });
    if (r.status === 0) return { ok: true, stderr: r.stderr };
  }
  const r = spawnSync("omp", ["plugin", "install", spec], { encoding: "utf8" });
  if (r.status === 0) return { ok: true, stderr: r.stderr };
  return { ok: false, stderr: `pi install failed for ${spec}` };
}