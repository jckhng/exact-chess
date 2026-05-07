CC ?= gcc
PKG_CONFIG ?= pkg-config

CFLAGS += -Wall -Wextra -O2 $(shell $(PKG_CONFIG) --cflags gtk+-2.0 cairo librsvg-2.0)
LDLIBS += $(shell $(PKG_CONFIG) --libs gtk+-2.0 cairo librsvg-2.0)

OBJS = main.o board.o engine_uci.o exact_chess_backend.o vendor/chess-game.o vendor/chess-bitboard.o vendor/chess-stubs.o
BACKEND_OBJS = exact_chess_backend.o vendor/chess-game.o vendor/chess-bitboard.o vendor/chess-stubs.o
TEST_OBJS = smoke_test.o $(BACKEND_OBJS)

.PHONY: all clean

all: exact-chess

exact-chess: $(OBJS)
	$(CC) $(CFLAGS) -o $@ $(OBJS) $(LDLIBS)

smoke-test: $(TEST_OBJS)
	$(CC) $(CFLAGS) -o $@ $(TEST_OBJS) $(LDLIBS)

clean:
	rm -f $(OBJS) $(TEST_OBJS) exact-chess smoke-test
