# Installing On e-ink reader

## Prerequisites

This package targets jailbroken KUAL-capable e-ink reader devices that can run native KUAL
extensions.

You need:

- Jailbreak for your exact e-ink reader model and firmware.
- KUAL.
- MRPI if your setup uses MobileRead package installation.
- Enough free USB-storage space for the extension and runtime libraries.

Use the current jailbreak, KUAL, and MRPI documentation for your exact device
model and firmware. Compatibility changes over time, so do not rely on old
instructions without checking that they still apply.

## Install

Copy `release/exact-chess-extension.zip` to your computer and unzip it at the
USB storage root.

Expected resulting paths:

```text
/mnt/us/extensions/exact-chess
/mnt/us/documents/shortcut_exact_chess.sh
```

Over SSH, fix executable bits if needed:

```sh
chmod 755 /mnt/us/extensions/exact-chess/*.sh
chmod 755 /mnt/us/extensions/exact-chess/bin/stockfish.sh
chmod 755 /mnt/us/extensions/exact-chess/bin/armhf/exact-chess
chmod 755 /mnt/us/documents/shortcut_exact_chess.sh
```

Launch from:

```text
KUAL -> Exact Chess -> Launch
```

## Restart Or Stop

From KUAL:

```text
Exact Chess -> Restart
Exact Chess -> Stop
```

Over SSH:

```sh
/mnt/us/extensions/exact-chess/launch_exact_chess.sh --restart
/mnt/us/extensions/exact-chess/stop_exact_chess.sh
```

## Logs

```sh
tail -n 120 /mnt/us/exact-chess.log
tail -n 120 /mnt/us/exact-chess-shortcut.log
```

If KUAL works but tapping the document shortcut does nothing, that is expected
on many e-ink readers. The stock home screen usually does not execute `.sh` files
without an additional script launcher/file association.
