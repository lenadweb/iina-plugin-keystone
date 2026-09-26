"use strict";

const MODIFIERS = [
  ["Ctrl", "⌃"],
  ["Alt", "⌥"],
  ["Shift", "⇧"],
  ["Meta", "⌘"],
];

const KEYS = {
  UP: "↑",
  DOWN: "↓",
  LEFT: "←",
  RIGHT: "→",
  SPACE: "Space",
  ENTER: "↩",
  ESC: "⎋",
};

function formatShortcut(code) {
  if (!code) return "";
  const parts = code.split("+");
  const key = parts.pop();
  const symbols = MODIFIERS.filter(([name]) => parts.includes(name)).map(([, symbol]) => symbol);
  return symbols.join("") + (KEYS[key] || key.toUpperCase());
}

module.exports = { formatShortcut };
