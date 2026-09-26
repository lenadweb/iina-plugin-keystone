#!/bin/sh
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CLI=/Applications/IINA.app/Contents/MacOS/iina-plugin
STAGE="$ROOT/build/Keystone"

if [ ! -x "$CLI" ]; then
  echo "iina-plugin CLI not found at $CLI. Install IINA 1.4.0 or newer." >&2
  exit 1
fi

rm -rf "$ROOT/build"
mkdir -p "$STAGE"
cp -R "$ROOT/Info.json" "$ROOT/LICENSE" "$ROOT/src" "$ROOT/ui" "$STAGE/"

cd "$ROOT/build"
"$CLI" pack Keystone
