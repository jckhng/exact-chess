# Exact Chess Extension Files

Copy these files into your e-ink reader extension folder:

- `config.xml` -> `/mnt/us/extensions/exact-chess/config.xml`
- `menu.json` -> `/mnt/us/extensions/exact-chess/menu.json`
- `launch_exact_chess.sh` -> `/mnt/us/extensions/exact-chess/launch_exact_chess.sh`
- `stop_exact_chess.sh` -> `/mnt/us/extensions/exact-chess/stop_exact_chess.sh`
- `tail_log_exact_chess.sh` -> `/mnt/us/extensions/exact-chess/tail_log_exact_chess.sh`

Optional document shortcut:

- `shortcut_exact_chess.sh` -> `/mnt/us/documents/shortcut_exact_chess.sh`

Make the scripts executable on the e-ink reader:

```sh
chmod 755 /mnt/us/extensions/exact-chess/*.sh
chmod 755 /mnt/us/documents/shortcut_exact_chess.sh
```

KUAL is the reliable tap-launch path. The document shortcut is only useful on
e-ink readers that have a shell-script document association installed; the stock
e-ink reader home screen normally does not execute `.sh` files directly.

If tapping does nothing, launch from KUAL or run this over SSH:

```sh
/mnt/us/extensions/exact-chess/launch_exact_chess.sh --restart
tail -n 80 /mnt/us/exact-chess-shortcut.log
tail -n 80 /mnt/us/exact-chess.log
```

The launcher expects the app binary at:

`/mnt/us/extensions/exact-chess/bin/armhf/exact-chess`

It will look for a Stockfish engine in this order:

1. `/mnt/us/extensions/exact-chess/bin/armhf/stockfish`
2. `/mnt/us/extensions/exact-chess/bin/stockfish.sh`
3. `/mnt/us/extensions/gnomegames/bin/stockfish.sh`

For a fully self-contained engine package, place a compatible ARM Stockfish
binary here:

`/mnt/us/extensions/exact-chess/bin/armhf/stockfish`
