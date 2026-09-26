"use strict";

const LIMIT = 20;
const ASPECT_RATIO = 16 / 9;
const BORDER = 2;

function round(value) {
  return Math.round(value * 100) / 100;
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return round(Math.max(-LIMIT, Math.min(LIMIT, number)));
}

function formatPercent(value) {
  const magnitude = Math.abs(clampPercent(value));
  const digits = Number.isInteger(Math.round(magnitude * 100) / 10) ? 1 : 2;
  return `${magnitude.toFixed(digits)}%`;
}

function corners(vertical, horizontal) {
  const v = clampPercent(vertical) / 100;
  const h = clampPercent(horizontal) / 100;
  const topLeft = [0, 0];
  const topRight = [1, 0];
  const bottomLeft = [0, 1];
  const bottomRight = [1, 1];

  if (v > 0) {
    topLeft[0] += v;
    topRight[0] -= v;
  } else if (v < 0) {
    bottomLeft[0] -= v;
    bottomRight[0] += v;
  }

  if (h > 0) {
    topRight[1] += h;
    bottomRight[1] -= h;
  } else if (h < 0) {
    topLeft[1] -= h;
    bottomLeft[1] += h;
  }

  return [topLeft, topRight, bottomLeft, bottomRight];
}

function buildFilter(vertical, horizontal) {
  if (clampPercent(vertical) === 0 && clampPercent(horizontal) === 0) return null;

  const points = corners(vertical, horizontal)
    .map(([x, y], i) => `x${i}=W*${x.toFixed(4)}:y${i}=H*${y.toFixed(4)}`)
    .join(":");

  return [
    `pad=iw+${BORDER * 2}:ih+${BORDER * 2}:${BORDER}:${BORDER}:black`,
    `perspective=${points}:sense=destination`,
    `crop=iw-${BORDER * 2}:ih-${BORDER * 2}`,
  ].join(",");
}

function tiltAngle(percent, halfFieldTangent) {
  const k = Math.abs(clampPercent(percent)) / 100;
  if (k === 0 || !(halfFieldTangent > 0)) return 0;
  return round((Math.atan(k / ((1 - k) * halfFieldTangent)) * 180) / Math.PI);
}

function verticalTilt(percent, throwRatio) {
  return tiltAngle(percent, 1 / (2 * throwRatio * ASPECT_RATIO));
}

function horizontalTilt(percent, throwRatio) {
  return tiltAngle(percent, 1 / (2 * throwRatio));
}

module.exports = {
  LIMIT,
  clampPercent,
  formatPercent,
  corners,
  buildFilter,
  verticalTilt,
  horizontalTilt,
};
