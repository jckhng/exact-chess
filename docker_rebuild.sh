#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONTAINER="$("$ROOT/docker_start_builder.sh" | tail -n 1)"
UID_HOST="$(id -u)"
GID_HOST="$(id -g)"
MAKE_TARGETS="${EXACT_CHESS_MAKE_TARGETS:-exact-chess smoke-test}"
DO_PACKAGE="${EXACT_CHESS_PACKAGE:-1}"
DO_RELEASE="${EXACT_CHESS_RELEASE:-0}"

docker exec "$CONTAINER" chown -R "$UID_HOST:$GID_HOST" /src/exact-chess
docker exec --user "$UID_HOST:$GID_HOST" "$CONTAINER" /bin/sh -lc "make $MAKE_TARGETS && ./smoke-test"

if [ "$DO_PACKAGE" = "1" ]; then
    EXACT_CHESS_DOCKER_CONTAINER="$CONTAINER" "$ROOT/package_extension.sh"
    sha256sum "$ROOT/dist/exact-chess-extension.zip"
    if [ "$DO_RELEASE" = "1" ]; then
        mkdir -p "$ROOT/release"
        cp "$ROOT/dist/exact-chess-extension.zip" "$ROOT/release/exact-chess-extension.zip"
        (
            cd "$ROOT/release"
            sha256sum exact-chess-extension.zip > SHA256SUMS
        )
        echo "Release refreshed: $ROOT/release/exact-chess-extension.zip"
        cat "$ROOT/release/SHA256SUMS"
    fi
fi

echo "Builder container: $CONTAINER"
echo "Binary: $ROOT/exact-chess"
if [ "$DO_PACKAGE" = "1" ]; then
    echo "Package: $ROOT/dist/exact-chess-extension.zip"
    if [ "$DO_RELEASE" = "1" ]; then
        echo "Release: $ROOT/release/exact-chess-extension.zip"
    fi
fi
