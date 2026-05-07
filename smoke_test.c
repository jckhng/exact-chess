#include <glib.h>
#include <stdio.h>
#include <string.h>

#include "exact_chess_backend.h"

static void assert_piece(ExactChessBackend *backend, int row, int col, char expected, const char *label) {
    char actual = exact_chess_backend_piece_at(backend, row, col);
    if (actual != expected) {
        g_error("%s: expected '%c' but got '%c'", label, expected, actual);
    }
}

static void apply_move(ExactChessBackend *backend, const char *move) {
    char san[32];

    if (!exact_chess_backend_apply_uci(backend, move, san)) {
        g_error("Failed to apply move %s", move);
    }
}

static void expect_state(ExactChessBackend *backend, ExactChessGameState expected, const char *label) {
    ExactChessGameState actual = exact_chess_backend_state(backend);
    if (actual != expected) {
        g_error("%s: expected state %d but got %d", label, expected, actual);
    }
}

static void test_initial_position(void) {
    ExactChessBackend backend;

    g_assert(exact_chess_backend_init(&backend));
    assert_piece(&backend, 7, 4, 'K', "white king start");
    assert_piece(&backend, 0, 4, 'k', "black king start");
    assert_piece(&backend, 6, 4, 'P', "white pawn e2");
    assert_piece(&backend, 1, 4, 'p', "black pawn e7");
    g_assert(exact_chess_backend_white_to_move(&backend));
    expect_state(&backend, EXACT_CHESS_ONGOING, "initial state");
    exact_chess_backend_clear(&backend);
}

static void test_basic_legality(void) {
    ExactChessBackend backend;
    char move[6];
    char san[32];

    g_assert(exact_chess_backend_init(&backend));

    g_assert(!exact_chess_backend_try_move(&backend, 7, 3, 5, 3, 'q', move, san));
    g_assert(exact_chess_backend_try_move(&backend, 6, 4, 4, 4, 'q', move, san));
    g_assert_cmpstr(move, ==, "e2e4");
    g_assert_cmpstr(san, ==, "e4");
    g_assert(!exact_chess_backend_white_to_move(&backend));
    assert_piece(&backend, 4, 4, 'P', "white pawn e4");
    expect_state(&backend, EXACT_CHESS_ONGOING, "after e2e4");

    exact_chess_backend_clear(&backend);
}

static void test_promotion_and_san(void) {
    ExactChessBackend backend;
    char san[32];

    g_assert(exact_chess_backend_init(&backend));
    apply_move(&backend, "a2a4");
    apply_move(&backend, "h7h5");
    apply_move(&backend, "a4a5");
    apply_move(&backend, "h5h4");
    apply_move(&backend, "a5a6");
    apply_move(&backend, "h4h3");
    apply_move(&backend, "a6b7");
    apply_move(&backend, "h3g2");
    g_assert(exact_chess_backend_apply_uci(&backend, "b7a8n", san));
    assert_piece(&backend, 0, 0, 'N', "white knight promoted on a8");
    g_assert_cmpstr(san, ==, "bxa8=N");
    exact_chess_backend_clear(&backend);
}

static void test_fools_mate(void) {
    ExactChessBackend backend;

    g_assert(exact_chess_backend_init(&backend));
    apply_move(&backend, "f2f3");
    apply_move(&backend, "e7e5");
    apply_move(&backend, "g2g4");
    apply_move(&backend, "d8h4");
    expect_state(&backend, EXACT_CHESS_CHECKMATE, "fool's mate");
    exact_chess_backend_clear(&backend);
}

static void test_undo(void) {
    ExactChessBackend backend;

    g_assert(exact_chess_backend_init(&backend));
    apply_move(&backend, "e2e4");
    apply_move(&backend, "e7e5");
    exact_chess_backend_undo(&backend);
    assert_piece(&backend, 6, 4, 'P', "white pawn restored to e2");
    assert_piece(&backend, 1, 4, 'p', "black pawn restored to e7");
    assert_piece(&backend, 4, 4, '.', "white pawn removed from e4");
    assert_piece(&backend, 3, 4, '.', "black pawn removed from e5");
    g_assert(exact_chess_backend_white_to_move(&backend));
    exact_chess_backend_clear(&backend);
}

int main(void) {
    test_initial_position();
    test_basic_legality();
    test_promotion_and_san();
    test_fools_mate();
    test_undo();
    puts("smoke-test: ok");
    return 0;
}
