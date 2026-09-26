"use strict";

(function () {
  const WIDTH = 160;
  const HEIGHT = 90;
  const LIMIT = 20;

  let step = 0.1;

  const body = document.body;
  const enabled = document.getElementById("enabled");
  const shape = document.getElementById("shape");
  const axes = {};

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  function clamp(value) {
    return round(Math.max(-LIMIT, Math.min(LIMIT, value)));
  }

  function formatPercent(value) {
    const magnitude = Math.abs(value);
    const digits = Number.isInteger(Math.round(magnitude * 100) / 10) ? 1 : 2;
    return `${magnitude.toFixed(digits)}%`;
  }

  function renderValue(axis, value) {
    const { slider, output, sides } = axes[axis];
    slider.value = value;
    output.textContent = formatPercent(value);
    sides.forEach((side) => {
      side.classList.toggle("active", Math.sign(value) === Number(side.dataset.side));
    });
  }

  function send(axis, value) {
    const next = clamp(value);
    renderValue(axis, next);
    iina.postMessage("set", { axis, value: next });
  }

  document.querySelectorAll(".axis").forEach((section) => {
    const axis = section.dataset.axis;
    const slider = section.querySelector('input[type="range"]');
    axes[axis] = {
      slider,
      output: section.querySelector(".value"),
      tilt: section.querySelector(".tilt"),
      sides: section.querySelectorAll("[data-side]"),
    };

    slider.addEventListener("input", () => send(axis, Number(slider.value)));

    section.querySelectorAll(".stepper button").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = Number(button.dataset.direction);
        send(axis, direction === 0 ? 0 : Number(slider.value) + direction * step);
      });
    });
  });

  enabled.addEventListener("change", () => {
    iina.postMessage("enabled", { enabled: enabled.checked });
  });

  document.getElementById("reset").addEventListener("click", () => {
    iina.postMessage("reset");
  });

  function renderAxis(axis, value, tilt) {
    renderValue(axis, value);
    axes[axis].tilt.textContent = value === 0 ? "" : `≈${tilt.toFixed(1)}°`;
  }

  function renderShape(corners) {
    const [topLeft, topRight, bottomLeft, bottomRight] = corners;
    shape.setAttribute(
      "points",
      [topLeft, topRight, bottomRight, bottomLeft]
        .map(([x, y]) => `${(x * WIDTH).toFixed(2)},${(y * HEIGHT).toFixed(2)}`)
        .join(" ")
    );
  }

  function renderShortcuts(shortcuts) {
    document.querySelectorAll("[data-shortcut]").forEach((element) => {
      const label = shortcuts[element.dataset.shortcut] || "";
      element.textContent = label;
      element.hidden = !label;
    });
  }

  iina.onMessage("state", (state) => {
    step = state.step;
    enabled.checked = state.enabled;
    body.classList.toggle("disabled", !state.enabled);
    renderAxis("vertical", state.vertical, state.verticalTilt);
    renderAxis("horizontal", state.horizontal, state.horizontalTilt);
    renderShape(state.corners);
    renderShortcuts(state.shortcuts || {});
  });

  iina.postMessage("ready");
})();
