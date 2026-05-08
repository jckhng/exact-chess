#!/bin/bash
set -euo pipefail

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PKG_ROOT="$ROOT/dist"
EXT_ROOT="$PKG_ROOT/extensions/exact-chess"
DOC_ROOT="$PKG_ROOT/documents"
CONTAINER="${EXACT_CHESS_DOCKER_CONTAINER:-exact-chess-armhf-builder}"
STOCKFISH_BIN="${EXACT_CHESS_STOCKFISH_BIN:-}"

rm -rf "$PKG_ROOT"
mkdir -p "$EXT_ROOT/bin/armhf" \
         "$EXT_ROOT/lib/armhf" \
         "$EXT_ROOT/share/exact-chess/pieces/simple" \
         "$EXT_ROOT/share/exact-chess/pieces/fancy" \
         "$EXT_ROOT/saves" \
         "$EXT_ROOT/LICENSES" \
         "$DOC_ROOT"

cp "$ROOT/exact-chess" "$EXT_ROOT/bin/armhf/exact-chess"
cp "$ROOT/extension/config.xml" "$EXT_ROOT/config.xml"
cp "$ROOT/extension/menu.json" "$EXT_ROOT/menu.json"
cp "$ROOT/extension/launch_exact_chess.sh" "$EXT_ROOT/launch_exact_chess.sh"
cp "$ROOT/extension/stop_exact_chess.sh" "$EXT_ROOT/stop_exact_chess.sh"
cp "$ROOT/extension/tail_log_exact_chess.sh" "$EXT_ROOT/tail_log_exact_chess.sh"
cp "$ROOT/extension/bin_stockfish.sh" "$EXT_ROOT/bin/stockfish.sh"
cp "$ROOT/extension/shortcut_exact_chess.sh" "$DOC_ROOT/shortcut_exact_chess.sh"
cp "$ROOT/extension/NOTICE.txt" "$EXT_ROOT/NOTICE.txt"
cp "$ROOT/extension/README.md" "$EXT_ROOT/README-package.txt"
cp "$ROOT/extension/ENGINE.txt" "$EXT_ROOT/ENGINE.txt"

cp "$ROOT/licenses/COPYING" "$EXT_ROOT/LICENSES/COPYING"
cp "$ROOT/licenses/COPYING-DOCS" "$EXT_ROOT/LICENSES/COPYING-DOCS"
cp "$ROOT/licenses/COPYING.GPL3" "$EXT_ROOT/LICENSES/COPYING.GPL3"

cp "$ROOT/assets/pieces/simple/"*.svg "$EXT_ROOT/share/exact-chess/pieces/simple/"
cp "$ROOT/assets/pieces/fancy/"*.svg "$EXT_ROOT/share/exact-chess/pieces/fancy/"

if [ -n "$STOCKFISH_BIN" ] && [ -f "$STOCKFISH_BIN" ]; then
    cp "$STOCKFISH_BIN" "$EXT_ROOT/bin/armhf/stockfish"
    chmod 755 "$EXT_ROOT/bin/armhf/stockfish"
elif [ -f "$ROOT/bin/armhf/stockfish" ]; then
    cp "$ROOT/bin/armhf/stockfish" "$EXT_ROOT/bin/armhf/stockfish"
    chmod 755 "$EXT_ROOT/bin/armhf/stockfish"
fi

if docker exec "$CONTAINER" /bin/bash -lc 'test -f /src/exact-chess/exact-chess' >/dev/null 2>&1; then
    docker exec "$CONTAINER" /bin/bash -lc '
        {
            echo /lib/arm-linux-gnueabihf/ld-linux-armhf.so.3
            ldd /src/exact-chess/exact-chess | grep -oE "/[^[:space:]]+"
        } | sort -u
    ' > "$EXT_ROOT/LICENSES/RUNTIME-LIBS.txt"

    while IFS= read -r libpath; do
        [ -n "$libpath" ] || continue
        docker exec "$CONTAINER" /bin/bash -lc "cat '$libpath'" > "$EXT_ROOT/lib/armhf/$(basename "$libpath")"
    done < "$EXT_ROOT/LICENSES/RUNTIME-LIBS.txt"

    cat > "$EXT_ROOT/LICENSES/THIRD-PARTY-NOTICE.txt" <<EOF
This package bundles ARM shared libraries copied from the Docker build
container ($CONTAINER) to reduce e-ink reader-side external dependencies.

The exact bundled files are listed in:
  RUNTIME-LIBS.txt

These runtime libraries remain under their own upstream licenses
(for example LGPL, GPL-compatible free software licenses, MIT-style,
X11-style, ICU, and other licenses depending on each library).

If you redistribute this package publicly, you should review the bundled
runtime library set and include any additional third-party notices required
for your distribution context.
EOF
else
    cat > "$EXT_ROOT/LICENSES/RUNTIME-LIBS.txt" <<EOF
No bundled runtime library set was generated because the expected Docker
container '$CONTAINER' was not available at packaging time.
EOF
    cat > "$EXT_ROOT/LICENSES/THIRD-PARTY-NOTICE.txt" <<EOF
No runtime libraries were bundled at packaging time.
The launcher may fall back to runtime libraries provided by the e-ink reader
environment or another installed extension such as gnomegames.
EOF
fi

chmod 755 "$EXT_ROOT/launch_exact_chess.sh" \
          "$EXT_ROOT/stop_exact_chess.sh" \
          "$EXT_ROOT/tail_log_exact_chess.sh" \
          "$EXT_ROOT/bin/stockfish.sh" \
          "$DOC_ROOT/shortcut_exact_chess.sh" \
          "$EXT_ROOT/bin/armhf/exact-chess"

if [ -f "$EXT_ROOT/lib/armhf/ld-linux-armhf.so.3" ]; then
    chmod 755 "$EXT_ROOT/lib/armhf/ld-linux-armhf.so.3"
fi

if command -v zip >/dev/null 2>&1; then
    (
        cd "$PKG_ROOT"
        zip -qr exact-chess-extension.zip extensions documents
    )
elif command -v python3 >/dev/null 2>&1; then
    (
        cd "$PKG_ROOT"
        python3 - <<'PY'
import os
import stat
import zipfile

with zipfile.ZipFile("exact-chess-extension.zip", "w", zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk("extensions"):
        for name in files:
            path = os.path.join(root, name)
            info = zipfile.ZipInfo(path)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (os.stat(path).st_mode & 0o777) << 16
            with open(path, "rb") as fh:
                zf.writestr(info, fh.read())
    for root, _, files in os.walk("documents"):
        for name in files:
            path = os.path.join(root, name)
            info = zipfile.ZipInfo(path)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (os.stat(path).st_mode & 0o777) << 16
            with open(path, "rb") as fh:
                zf.writestr(info, fh.read())
PY
    )
else
    echo "Warning: neither zip nor python3 was found; package tree was created but no zip archive was generated." >&2
fi

echo "Package created:"
echo "  $PKG_ROOT/exact-chess-extension.zip"
echo
echo "Unzip this at /mnt/us so it creates:"
echo "  /mnt/us/extensions/exact-chess"
echo "  /mnt/us/documents/shortcut_exact_chess.sh"
