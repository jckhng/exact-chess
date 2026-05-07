# Release Notes

## Current Release

Artifact:

```text
release/exact-chess-extension.zip
```

Checksum:

```bash
cd release
sha256sum -c SHA256SUMS
```

Contents:

- ARM hard-float `exact-chess` executable.
- KUAL extension metadata and launch scripts.
- GNOME Chess simple/fancy SVG piece themes.
- Bundled GTK2/Cairo/librsvg runtime library set copied from the ARM Docker
  builder.
- License and third-party runtime notices.

Known constraints:

- This is an unofficial derivative release, not an official GNOME or
  prior e-ink/KUAL porting project release.
- Requires a jailbroken e-ink reader with KUAL.
- The bundled package does not include a Stockfish binary by default. It uses
  `stockfish.sh`, which first checks for a bundled engine and then for a
  compatible engine from another installed extension.
- e-ink reader home-screen `.sh` tapping is not reliable unless another launcher/file
  association is installed. Use KUAL.
