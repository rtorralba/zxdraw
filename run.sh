#!/bin/sh
# Simple launcher for the snap.
# Use the real Electron binary directly (not the npm wrapper which needs `node` in PATH).
# --no-sandbox is required in snap: chrome-sandbox cannot be setuid inside a snap package.

# Workaround for IBUS-WARNING: Failed to mkdir ...: Not a directory
if [ -f "$SNAP_USER_DATA/.config/ibus" ]; then
  rm -f "$SNAP_USER_DATA/.config/ibus"
fi
mkdir -p "$SNAP_USER_DATA/.config/ibus/bus" 2>/dev/null || true

cd "$SNAP/opt/zx-drawer"

ELECTRON_BIN="$SNAP/opt/zx-drawer/node_modules/electron/dist/electron"
NODE_BIN="$SNAP/opt/zx-drawer/usr/bin/node"

if [ -x "$ELECTRON_BIN" ]; then
  exec "$ELECTRON_BIN" --no-sandbox .
elif [ -x "$NODE_BIN" ]; then
  exec "$NODE_BIN" "$SNAP/opt/zx-drawer/node_modules/.bin/electron" --no-sandbox .
else
  exec electron --no-sandbox .
fi
