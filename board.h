#ifndef EXACT_CHESS_BOARD_H
#define EXACT_CHESS_BOARD_H

#include <gtk/gtk.h>
#include <librsvg/rsvg.h>

#include "exact_chess_backend.h"

typedef struct {
    int selected_row;
    int selected_col;
    int last_from_row;
    int last_from_col;
    int last_to_row;
    int last_to_col;
    char piece_theme[16];
    gchar *pieces_root;
    RsvgHandle *piece_handles[12];
    ExactChessBackend backend;
} BoardState;

void board_state_init(BoardState *state);
void board_state_clear(BoardState *state);
void board_state_reset(BoardState *state);
void board_set_piece_theme(BoardState *state, const char *theme_name);
gboolean board_draw(BoardState *state, GtkWidget *widget, cairo_t *cr);
gboolean board_handle_click(BoardState *state,
                            GtkWidget *widget,
                            gdouble x,
                            gdouble y,
                            char promotion_piece,
                            char move_out[6],
                            char san_out[32]);
gboolean board_apply_uci_move(BoardState *state, const char *move, char san_out[32]);
ExactChessGameState board_get_game_state(BoardState *state);
gboolean board_white_to_move(BoardState *state);
void board_undo(BoardState *state);

#endif
