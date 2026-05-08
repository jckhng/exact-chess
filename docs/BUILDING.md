# Building Exact Chess

## Requirements

- Docker.
- `make`, `sha256sum`, and a POSIX shell on the host.
- ARM binfmt support if your Docker setup does not already run ARM containers.

On Linux, ARM binfmt can usually be installed with:

```bash
docker run --privileged --rm tonistiigi/binfmt --install arm
```

Docker Desktop often already has this configured.

## Fast Rebuild

From the repository root:

```bash
./docker_rebuild.sh
```

This creates or reuses:

```text
image:     exact-chess-armhf-build:bullseye
container: exact-chess-armhf-builder
```

The build output is:

```text
exact-chess
dist/exact-chess-extension.zip
```

The script also runs:

```text
smoke-test
```

The rebuild prints the SHA256 for `dist/exact-chess-extension.zip`.

To also refresh `release/exact-chess-extension.zip` and
`release/SHA256SUMS`, run:

```bash
EXACT_CHESS_RELEASE=1 ./docker_rebuild.sh
```

## Build Without Packaging

```bash
EXACT_CHESS_PACKAGE=0 ./docker_rebuild.sh
```

## Shell Into The Builder

```bash
./docker_shell.sh
```

Inside the container:

```bash
make clean
make exact-chess smoke-test
./smoke-test
```

## Rebuild The Docker Image

```bash
./docker_build_image.sh
```

If you moved the repository and the persistent container still points at an old
checkout, recreate it:

```bash
docker rm -f exact-chess-armhf-builder
./docker_rebuild.sh
```

## Local Host Build

A local build is only useful if the host has GTK2, Cairo, and librsvg
development headers:

```bash
make
```

For actual e-ink releases, prefer the Docker ARM build so the binary ABI
matches the bundled runtime.

## Packaging Details

`package_extension.sh` creates:

```text
dist/extensions/exact-chess
dist/documents/shortcut_exact_chess.sh
dist/exact-chess-extension.zip
```

The package contains:

- ARM `exact-chess` executable.
- KUAL `config.xml` and `menu.json`.
- Launch/stop/log helper scripts.
- GNOME Chess piece SVG assets.
- Runtime libraries copied from the ARM Docker container.
- License and third-party runtime notices.

If you have a compatible ARM Stockfish binary, place it at:

```text
bin/armhf/stockfish
```

before packaging. Otherwise the package includes `stockfish.sh`, which can use
an engine provided by another extension if present.
