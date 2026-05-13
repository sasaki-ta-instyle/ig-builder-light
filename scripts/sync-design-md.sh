#!/usr/bin/env bash
# Workspace 直下の design-system / design-system_liquid から design.md を
# このプロジェクトの src/lib/prompt/ に取り込むスクリプト。
# - 正本: Workspace の design.md（手元でのみ存在）
# - 取り込み先: src/lib/prompt/design-flat.md, design-liquid.md（git 管理）
# - CI / 本番ビルド時には Workspace パスが存在しないので no-op で抜ける
set -euo pipefail

PROJ_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WS_DIR="$(cd "$PROJ_DIR/.." && pwd)"

FLAT_SRC="$WS_DIR/design-system/design.md"
LIQUID_SRC="$WS_DIR/design-system_liquid/design.md"
DEST_DIR="$PROJ_DIR/src/lib/prompt"

mkdir -p "$DEST_DIR"

if [ -f "$FLAT_SRC" ]; then
  cp "$FLAT_SRC" "$DEST_DIR/design-flat.md"
  echo "[sync-design] flat   → $DEST_DIR/design-flat.md"
else
  echo "[sync-design] flat   skip (source not found: $FLAT_SRC)"
fi

if [ -f "$LIQUID_SRC" ]; then
  cp "$LIQUID_SRC" "$DEST_DIR/design-liquid.md"
  echo "[sync-design] liquid → $DEST_DIR/design-liquid.md"
else
  echo "[sync-design] liquid skip (source not found: $LIQUID_SRC)"
fi
