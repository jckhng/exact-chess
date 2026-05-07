# Provenance And Licensing

Exact Chess is an unofficial e-ink-focused derivative application based in
part on GNOME Chess and GNOME Games rules code and artwork.

It also benefited from prior GNOME Games e-ink/KUAL porting and packaging work
by ThatPotatoDev and contributors. Original GNOME Chess code and artwork remain
credited to the GNOME Games authors. Prior e-ink/KUAL porting work is credited
for launch, runtime, and packaging ideas.

This repository is not an official GNOME project and is not affiliated with or
endorsed by GNOME, the GNOME Foundation, device manufacturers, or the prior
e-ink/KUAL porting projects it credits.

## What Comes From GNOME Chess

- Chess rule implementation and game-state logic, vendored as generated C in
  `vendor/`.
- Piece SVG artwork in `assets/pieces/simple` and `assets/pieces/fancy`.
- Project licensing basis in `licenses/`.

## What Is E-Ink Specific

- `main.c`, `board.c`, and related glue for a compact GTK2/Cairo e-ink UI.
- KUAL extension files in `extension/`.
- Docker ARM build and packaging scripts.
- Runtime-library bundling for easier KUAL installation.
- Release packaging and KUAL launch scripts maintained for this derivative.

## License Notes

The GNOME-derived code and assets keep their original GPL-family licensing.
The license texts included with this repository are in:

```text
licenses/
```

The release zip also bundles shared runtime libraries from Debian Bullseye ARM.
Those libraries keep their own upstream licenses. The generated extension
package includes:

```text
extensions/exact-chess/LICENSES/RUNTIME-LIBS.txt
extensions/exact-chess/LICENSES/THIRD-PARTY-NOTICE.txt
```

If publishing binary releases, keep the license files and runtime notices with
the package.
