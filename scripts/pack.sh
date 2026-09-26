#!/bin/sh
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
VERSION=$(sed -n 's/^ *"version": *"\([^"]*\)".*/\1/p' "$ROOT/Info.json" | head -n 1)
OUT="$ROOT/build/Keystone-$VERSION.iinaplgz"

rm -rf "$ROOT/build"
mkdir -p "$ROOT/build"

cd "$ROOT"
zip -qrX "$OUT" Info.json LICENSE src ui -x "*.DS_Store"

echo "$OUT"
