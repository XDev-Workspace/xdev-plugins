import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { agentDir } from "./core.js";

// Mode persistence follows each constituent's own on-disk contract:
//   caveman : $PI_CODING_AGENT_DIR|$XDG_CONFIG_HOME/pi/agent|~/.pi/agent → caveman.json { defaultLevel, showStatus }
//   ponytail: $XDG_CONFIG_HOME|~/.config/ponytail/config.json { defaultMode }
//   rtk     : omp agent dir/extensions/pi-rtk-optimizer/config.json { enabled }
// These set DEFAULTS; the in-session /xdev also appends pi session entries
// (caveman-level, ponytail-mode) so the live session adopts the mode too.

function readJson(p, fallback) {
  try {
    return { ...fallback, ...JSON.parse(readFileSync(p, "utf8")) };
  } catch {
    return fallback;
  }
}

function writeJson(p, data) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// Caveman's OWN resolution (extensions/caveman.ts getConfigDir):
//   $PI_CODING_AGENT_DIR → $XDG_CONFIG_HOME/pi/agent → ~/.pi/agent
// NOT ~/.omp/agent. Writes anywhere else are invisible to it.
function cavemanConfigPath() {
  const dir = process.env.PI_CODING_AGENT_DIR
    ?? (process.env.XDG_CONFIG_HOME ? join(process.env.XDG_CONFIG_HOME, "pi", "agent") : join(homedir(), ".pi", "agent"));
  return join(dir, "caveman.json");
}

const CAVEMAN_LEVELS = ["off", "lite", "full", "ultra", "wenyan-lite", "wenyan", "wenyan-ultra", "micro"];

export function setCavemanDefault(level) {
  if (!CAVEMAN_LEVELS.includes(level)) {
    throw new Error(`invalid caveman level: ${level}`);
  }
  const path = cavemanConfigPath();
  const cfg = readJson(path, { defaultLevel: "full", showStatus: true });
  cfg.defaultLevel = level;
  writeJson(path, cfg);
}

const PONYTAIL_MODES = ["off", "lite", "full", "ultra", "review"];

// Ponytail's own resolution (hooks/ponytail-config.js):
//   $XDG_CONFIG_HOME/ponytail/config.json → ~/.config/ponytail/config.json
function ponytailConfigPath() {
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(base, "ponytail", "config.json");
}

export function setPonytailDefault(mode) {
  if (!PONYTAIL_MODES.includes(mode)) {
    throw new Error(`invalid ponytail mode: ${mode}`);
  }
  const path = ponytailConfigPath();
  const cfg = readJson(path, {});
  cfg.defaultMode = mode;
  writeJson(path, cfg);
}

export function setRtkEnabled(enabled) {
  const path = join(agentDir(), "extensions", "pi-rtk-optimizer", "config.json");
  const cfg = readJson(path, { enabled });
  cfg.enabled = enabled;
  writeJson(path, cfg);
}

// -- Current mode readout (same sources the constituents honour) --
// Optional liveEntries (from ctx.sessionManager, in-session only) override
// config defaults — mirrors caveman/ponytail session_start precedence.

function rtkConfig() {
  return readJson(join(agentDir(), "extensions", "pi-rtk-optimizer", "config.json"), { enabled: false });
}

export function readModes(liveEntries = []) {
  const cavemanCfg = readJson(cavemanConfigPath(), { defaultLevel: "full", showStatus: true });
  const ponytailCfg = readJson(ponytailConfigPath(), { defaultMode: "off" });

  let caveman = cavemanCfg.defaultLevel;
  let ponytail = ponytailCfg.defaultMode;
  for (const entry of liveEntries) {
    if (entry?.type === "custom" && entry.customType === "caveman-level") caveman = entry.data?.level ?? caveman;
    if (entry?.customType === "ponytail-mode") ponytail = entry.data?.mode ?? ponytail;
  }

  // Mark values that live in a session entry rather than the config default.
  const overridden = (name) => liveEntries.some((e) => e.customType === name);
  return {
    caveman,
    ponytail,
    rtk: rtkConfig().enabled ? "on" : "off",
    sessionOverride: { caveman: overridden("caveman-level"), ponytail: overridden("ponytail-mode") },
  };
}