#ifndef EXACT_CHESS_BACKEND_H
#define EXACT_CHESS_BACKEND_H

#include <glib.h>

typedef struct _ExactChessBackend {
    gpointer game;
} ExactChessBackend;

typedef enum {
    EXACT_CHESS_ONGOING,
    EXACT_CHESS_CHECK,
    EXACT_CHESS_CHECKMATE,
    EXACT_CHESS_STALEMATE,
    EXACT_CHESS_DRAW
} ExactChessGameState;

gboolean exact_chess_backend_init(ExactChessBackend *backend);
void exact_chess_backend_clear(ExactChessBackend *backend);
void exact_chess_backend_reset(ExactChessBackend *backend);
gboolean exact_chess_backend_white_to_move(ExactChessBackend *backend);
char exact_chess_backend_piece_at(ExactChessBackend *backend, int row, int col);
gboolean exact_chess_backend_try_move(ExactChessBackend *backend,
                                       int row0,
                                       int col0,
                                       int row1,
                                       int col1,
                                       char promotion_piece,
                                       char move_out[6],
                                       char san_out[32]);
gboolean exact_chess_backend_apply_uci(ExactChessBackend *backend, const char *move, char san_out[32]);
gboolean exact_chess_backend_apply_move_text(ExactChessBackend *backend, const char *move_text, char san_out[32], char uci_out[6]);
void exact_chess_backend_undo(ExactChessBackend *backend);
ExactChessGameState exact_chess_backend_state(ExactChessBackend *backend);
gboolean exact_chess_backend_get_last_san(ExactChessBackend *backend, char san_out[32]);
gboolean exact_chess_backend_get_last_uci(ExactChessBackend *backend, char uci_out[6]);

#endif
