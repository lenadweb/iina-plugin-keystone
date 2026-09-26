# Changelog

## 1.0.1

- Declare the `file-system` permission, which upcoming IINA versions require for plugins that apply video filters. Keystone does not read or write any files.

## 1.0.0

- Vertical and horizontal keystone correction with perspective-correct warping.
- Sidebar tab with a live preview of the corrected shape, sliders and fine-step buttons.
- Keyboard shortcuts that fall back to free combinations when the defaults are taken.
- Tilt angle estimate based on the projector's throw ratio.
- Automatic copy-back hardware decoding while a correction is active.
- Settings persist across files, windows and restarts.
