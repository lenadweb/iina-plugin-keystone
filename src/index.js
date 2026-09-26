"use strict";

const {
  clampPercent,
  formatPercent,
  corners,
  buildFilter,
  verticalTilt,
  horizontalTilt,
} = require("./keystone.js");
const { formatShortcut } = require("./shortcut.js");

const { core, console, event, input, menu, mpv, preferences, sidebar } = iina;

const FILTER_LABEL = "@keystone";

const SHORTCUTS = {
  toggle: ["Meta+Shift+K", "Ctrl+Alt+Meta+K"],
  narrowTop: ["Alt+Meta+UP", "Ctrl+Alt+Meta+UP"],
  narrowBottom: ["Alt+Meta+DOWN", "Ctrl+Alt+Meta+DOWN"],
  narrowLeft: ["Alt+Meta+LEFT", "Ctrl+Alt+Meta+LEFT"],
  narrowRight: ["Alt+Meta+RIGHT", "Ctrl+Alt+Meta+RIGHT"],
  reset: ["Alt+Meta+0", "Ctrl+Alt+Meta+0"],
};

const DEFAULTS = {
  vertical: 0,
  horizontal: 0,
  enabled: true,
  step: 0.1,
  throwRatio: 1.2,
  manageHardwareDecoding: true,
};

function pref(key) {
  const value = preferences.get(key);
  return value === undefined || value === null || value === "" ? DEFAULTS[key] : value;
}

function numberPref(key) {
  const value = Number(pref(key));
  return Number.isFinite(value) && value > 0 ? value : DEFAULTS[key];
}

function boolPref(key) {
  const value = pref(key);
  return value === true || value === "true" || value === 1;
}

const state = {
  vertical: clampPercent(pref("vertical")),
  horizontal: clampPercent(pref("horizontal")),
  enabled: boolPref("enabled"),
};

let savedHwdec = null;
let takenKeys = null;
const shortcuts = {};
let toggleItem = null;
let menuReady = false;

function isZeroCopyHwdec(value) {
  return Boolean(value) && value !== "no" && !value.includes("copy");
}

function ensureCopyBackDecoding() {
  if (savedHwdec !== null || !boolPref("manageHardwareDecoding")) return;
  const current = mpv.getString("hwdec");
  if (!isZeroCopyHwdec(current)) return;
  savedHwdec = current;
  mpv.set("hwdec", "auto-copy");
}

function restoreDecoding() {
  if (savedHwdec === null) return;
  mpv.set("hwdec", savedHwdec);
  savedHwdec = null;
}

function applyFilter() {
  try {
    mpv.command("vf", ["remove", FILTER_LABEL]);
  } catch (error) {}

  const filter = state.enabled ? buildFilter(state.vertical, state.horizontal) : null;
  if (!filter) {
    restoreDecoding();
    return;
  }

  ensureCopyBackDecoding();
  mpv.command("vf", ["add", `${FILTER_LABEL}:lavfi=[${filter}]`]);
}

function describeAxis(value, tilt, positive, negative) {
  if (value === 0) return null;
  return `${formatPercent(value)} ${value > 0 ? positive : negative} (≈${tilt.toFixed(1)}°)`;
}

function summary() {
  if (!state.enabled) return "Keystone: Off";
  const throwRatio = numberPref("throwRatio");
  const parts = [
    describeAxis(state.vertical, verticalTilt(state.vertical, throwRatio), "top narrower", "bottom narrower"),
    describeAxis(state.horizontal, horizontalTilt(state.horizontal, throwRatio), "right narrower", "left narrower"),
  ].filter(Boolean);
  return parts.length ? `Keystone: ${parts.join(", ")}` : "Keystone: No correction";
}

function postState() {
  const throwRatio = numberPref("throwRatio");
  sidebar.postMessage("state", {
    vertical: state.vertical,
    horizontal: state.horizontal,
    enabled: state.enabled,
    step: numberPref("step"),
    verticalTilt: verticalTilt(state.vertical, throwRatio),
    horizontalTilt: horizontalTilt(state.horizontal, throwRatio),
    corners: corners(state.vertical, state.horizontal),
    shortcuts,
  });
}

function refreshMenu() {
  if (!menuReady || !toggleItem) return;
  toggleItem.selected = state.enabled;
  menu.forceUpdate();
}

function commit({ osd = true } = {}) {
  preferences.set("vertical", state.vertical);
  preferences.set("horizontal", state.horizontal);
  preferences.set("enabled", state.enabled);
  preferences.sync();
  applyFilter();
  postState();
  refreshMenu();
  if (osd) core.osd(summary());
}

function setAxis(axis, value, options) {
  state[axis] = clampPercent(value);
  commit(options);
}

function nudge(axis, direction) {
  setAxis(axis, state[axis] + direction * numberPref("step"));
}

function resetAll() {
  state.vertical = 0;
  state.horizontal = 0;
  commit();
}

function setEnabled(enabled) {
  state.enabled = enabled;
  commit();
}

function keyIsTaken(code) {
  try {
    if (takenKeys === null) takenKeys = input.getAllKeyBindings() || {};
    return Boolean(takenKeys[input.normalizeKeyCode(code)]);
  } catch (error) {
    return false;
  }
}

function shortcut(id) {
  const candidates = SHORTCUTS[id];
  const code = candidates.find((candidate) => !keyIsTaken(candidate));
  shortcuts[id] = formatShortcut(code);
  if (!code) {
    console.warn(`Keystone: no free shortcut for "${id}" (tried ${candidates.join(", ")})`);
    return {};
  }
  if (code !== candidates[0]) console.log(`Keystone: "${id}" uses fallback shortcut ${code}`);
  return { keyBinding: code };
}

function buildMenu() {
  toggleItem = menu.item("Keystone Correction", () => setEnabled(!state.enabled), {
    selected: state.enabled,
    ...shortcut("toggle"),
  });

  const vertical = menu.item("Vertical");
  vertical.addSubMenuItem(menu.item("Narrow Top", () => nudge("vertical", 1), shortcut("narrowTop")));
  vertical.addSubMenuItem(menu.item("Narrow Bottom", () => nudge("vertical", -1), shortcut("narrowBottom")));
  vertical.addSubMenuItem(menu.separator());
  vertical.addSubMenuItem(menu.item("Reset Vertical", () => setAxis("vertical", 0)));

  const horizontal = menu.item("Horizontal");
  horizontal.addSubMenuItem(menu.item("Narrow Left", () => nudge("horizontal", -1), shortcut("narrowLeft")));
  horizontal.addSubMenuItem(menu.item("Narrow Right", () => nudge("horizontal", 1), shortcut("narrowRight")));
  horizontal.addSubMenuItem(menu.separator());
  horizontal.addSubMenuItem(menu.item("Reset Horizontal", () => setAxis("horizontal", 0)));

  const reset = menu.item("Reset All", resetAll, shortcut("reset"));
  const panel = menu.item("Show Keystone Panel", () => sidebar.show());

  [toggleItem, vertical, horizontal, reset, panel].forEach((item) => menu.addItem(item));
  setTimeout(() => {
    menuReady = true;
  }, 0);
}

buildMenu();

event.on("iina.window-loaded", () => {
  sidebar.loadFile("ui/sidebar/index.html");
  sidebar.onMessage("ready", postState);
  sidebar.onMessage("set", ({ axis, value }) => {
    if (axis === "vertical" || axis === "horizontal") setAxis(axis, value, { osd: false });
  });
  sidebar.onMessage("reset", () => resetAll());
  sidebar.onMessage("enabled", ({ enabled }) => setEnabled(Boolean(enabled)));
});

event.on("iina.file-loaded", applyFilter);
