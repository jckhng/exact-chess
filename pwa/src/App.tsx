import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, Move, Square } from "chess.js";
import { BrowserStockfish, EngineStatus, createBrowserStockfish } from "./stockfishEngine";

type Mode = "white" | "black" | "two" | "demo";
type Difficulty = "easy" | "medium" | "hard";
type PieceTheme = "simple" | "fancy" | "unicode";
type Promotion = "q" | "r" | "b" | "n";

type PersistedState = {
  pgn: string;
  savedPgn: string;
  mode: Mode;
  difficulty: Difficulty;
  pieceTheme: PieceTheme;
  promotion: Promotion;
  flipped: boolean;
};

const STORAGE_KEY = "exact-chess-pwa-state-v1";
const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ranks = [8, 7, 6, 5, 4, 3, 2, 1] as const;
const pieceValues: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const unicodePieces: Record<string, string> = {
  wp: "♙", wr: "♖", wn: "♘", wb: "♗", wq: "♕", wk: "♔",
  bp: "♟", br: "♜", bn: "♞", bb: "♝", bq: "♛", bk: "♚"
};
const svgNames: Record<string, string> = {
  wp: "whitePawn.svg", wr: "whiteRook.svg", wn: "whiteKnight.svg",
  wb: "whiteBishop.svg", wq: "whiteQueen.svg", wk: "whiteKing.svg",
  bp: "blackPawn.svg", br: "blackRook.svg", bn: "blackKnight.svg",
  bb: "blackBishop.svg", bq: "blackQueen.svg", bk: "blackKing.svg"
};

function createGame(pgn?: string): Chess {
  const game = new Chess();
  if (pgn && pgn.trim()) {
    try { game.loadPgn(pgn); } catch { return new Chess(); }
  }
  return game;
}

function cloneGame(game: Chess): Chess { return createGame(game.pgn()); }

function loadState(): PersistedState {
  const fallback: PersistedState = {
    pgn: "", savedPgn: "", mode: "white", difficulty: "medium",
    pieceTheme: "simple", promotion: "q", flipped: false
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch { return fallback; }
}

function gameStatus(game: Chess, mode: Mode, engineThinking: boolean): string {
  if (game.isCheckmate()) return `Checkmate. ${game.turn() === "w" ? "Black" : "White"} wins.`;
  if (game.isStalemate()) return "Stalemate.";
  if (game.isDraw()) return "Draw.";
  if (game.isCheck()) return `${game.turn() === "w" ? "White" : "Black"} to move. Check.`;
  if (engineThinking) return "Opponent is thinking...";
  if (mode === "demo") return "AI demo running.";
  return `${game.turn() === "w" ? "White" : "Black"} to move.`;
}

function difficultyMovetime(difficulty: Difficulty): number {
  if (difficulty === "easy") return 120;
  if (difficulty === "medium") return 350;
  return 850;
}

function uciHistory(game: Chess): string[] {
  return (game.history({ verbose: true }) as Move[]).map((m) => `${m.from}${m.to}${m.promotion || ""}`);
}

function moveScore(move: Move, difficulty: Difficulty): number {
  let score = Math.random() * (difficulty === "easy" ? 250 : difficulty === "medium" ? 90 : 25);
  if (move.captured) score += pieceValues[move.captured] - pieceValues[move.piece] * 0.08;
  if (move.promotion) score += pieceValues[move.promotion];
  if (move.san.includes("+")) score += difficulty === "easy" ? 20 : 80;
  if (move.san.includes("#")) score += 100000;
  if (difficulty === "hard" && (move.flags.includes("k") || move.flags.includes("q"))) score += 40;
  return score;
}

function chooseAiMove(game: Chess, difficulty: Difficulty): Move | null {
  const moves = game.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;
  if (difficulty === "easy" && Math.random() < 0.55) return moves[Math.floor(Math.random() * moves.length)];
  return moves.reduce((best, move) => (moveScore(move, difficulty) > moveScore(best, difficulty) ? move : best), moves[0]);
}

function App() {
  const initial = useMemo(loadState, []);
  const [game, setGame] = useState(() => createGame(initial.pgn));
  const [savedPgn, setSavedPgn] = useState(initial.savedPgn);
  const [selected, setSelected] = useState<Square | null>(null);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [pieceTheme, setPieceTheme] = useState<PieceTheme>(initial.pieceTheme);
  const [promotion, setPromotion] = useState<Promotion>(initial.promotion);
  const [flipped, setFlipped] = useState(initial.flipped);
  const [engineThinking, setEngineThinking] = useState(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("starting");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState<"game" | "about">("game");
  const [showHistory, setShowHistory] = useState(true);
  const [reviewIdx, setReviewIdx] = useState<number | null>(null);
  const engineRef = useRef<BrowserStockfish | null>(null);

  const moves = useMemo(() => game.history(), [game]);
  const allMovesVerbose = useMemo(() => game.history({ verbose: true }) as Move[], [game]);
  const totalMoves = moves.length;
  const isReviewing = reviewIdx !== null;
  const displayIdx = reviewIdx ?? totalMoves;

  const displayGame = useMemo(() => {
    if (reviewIdx === null) return game;
    const g = new Chess();
    const lim = Math.min(reviewIdx, allMovesVerbose.length);
    for (let i = 0; i < lim; i++) {
      const m = allMovesVerbose[i];
      g.move({ from: m.from, to: m.to, promotion: m.promotion });
    }
    return g;
  }, [reviewIdx, allMovesVerbose, game]);

  const legalTargets = useMemo(() => {
    if (reviewIdx !== null || !selected) return new Set<string>();
    return new Set((game.moves({ square: selected, verbose: true }) as Move[]).map((m) => m.to));
  }, [game, selected, reviewIdx]);

  const lastMove = useMemo(() => {
    const history = displayGame.history({ verbose: true }) as Move[];
    return history.length ? history[history.length - 1] : null;
  }, [displayGame]);

  const humanTurn = !isReviewing && (
    mode === "two" || (mode === "white" && game.turn() === "w") || (mode === "black" && game.turn() === "b")
  );

  const boardSquares = useMemo(() => {
    const orderedRanks = flipped ? [...ranks].reverse() : ranks;
    const orderedFiles = flipped ? [...files].reverse() : files;
    return orderedRanks.flatMap((rank) => orderedFiles.map((file) => `${file}${rank}` as Square));
  }, [flipped]);

  function goReview(idx: number | null) {
    setReviewIdx(idx);
    if (idx !== null) setSelected(null);
  }

  useEffect(() => {
    const state: PersistedState = { pgn: game.pgn(), savedPgn, mode, difficulty, pieceTheme, promotion, flipped };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [game, savedPgn, mode, difficulty, pieceTheme, promotion, flipped]);

  useEffect(() => {
    const engine = createBrowserStockfish({
      onReady: () => { setEngineStatus("ready"); setMessage("Stockfish WASM ready."); },
      onBestMove: (bestMove) => {
        setGame((current) => {
          const next = cloneGame(current);
          const move = next.move({
            from: bestMove.slice(0, 2) as Square,
            to: bestMove.slice(2, 4) as Square,
            promotion: (bestMove[4] as Promotion | undefined) || promotion
          });
          setMessage(move ? `Stockfish: ${move.san}` : "Stockfish returned an invalid move.");
          return next;
        });
        setSelected(null);
        setEngineThinking(false);
      },
      onError: (error) => {
        setEngineStatus("failed");
        setMessage(`Stockfish unavailable. Using built-in fallback. ${error}`);
        setEngineThinking(false);
      }
    });
    engineRef.current = engine;
    setEngineStatus(engine.status());
    return () => engine.dispose();
  }, [promotion]);

  useEffect(() => {
    if (game.isGameOver()) { setEngineThinking(false); return; }
    const shouldAiMove = mode === "demo" || (mode === "white" && game.turn() === "b") || (mode === "black" && game.turn() === "w");
    if (!shouldAiMove) return;
    setEngineThinking(true);
    const id = window.setTimeout(() => {
      const stockfishStarted = engineRef.current?.requestMove(uciHistory(game), difficultyMovetime(difficulty)) || false;
      if (stockfishStarted) return;
      const next = cloneGame(game);
      const move = chooseAiMove(next, difficulty);
      if (move) next.move({ from: move.from, to: move.to, promotion });
      setGame(next);
      setSelected(null);
      setEngineThinking(false);
    }, mode === "demo" ? 180 : 280);
    return () => window.clearTimeout(id);
  }, [difficulty, game, mode, promotion]);

  function commitMove(from: Square, to: Square) {
    const next = cloneGame(game);
    const move = next.move({ from, to, promotion });
    if (!move) { setMessage("Illegal move."); return; }
    setMessage(`${move.color === "w" ? "White" : "Black"}: ${move.san}`);
    setSelected(null);
    setReviewIdx(null);
    setGame(next);
  }

  function tapSquare(square: Square) {
    if (!humanTurn || engineThinking || game.isGameOver()) return;
    const piece = game.get(square);
    if (selected && legalTargets.has(square)) { commitMove(selected, square); return; }
    if (piece && piece.color === game.turn()) { setSelected(square); setMessage(`${square} selected.`); return; }
    setSelected(null);
  }

  function newGame() {
    engineRef.current?.newGame();
    setGame(new Chess());
    setSelected(null);
    setMessage("New game.");
    setReviewIdx(null);
  }

  function undoMove() {
    engineRef.current?.stop();
    const next = cloneGame(game);
    next.undo();
    if (mode !== "two" && next.history().length > 0) next.undo();
    setSelected(null);
    setEngineThinking(false);
    setGame(next);
    setMessage("Move undone.");
    setReviewIdx(null);
  }

  function resetSavedGame() { localStorage.removeItem(STORAGE_KEY); newGame(); }

  function saveGame() { setSavedPgn(game.pgn()); setMessage("Saved game in this browser."); }

  function loadGame() {
    if (!savedPgn.trim()) { setMessage("No saved game yet."); return; }
    engineRef.current?.newGame();
    setGame(createGame(savedPgn));
    setSelected(null);
    setEngineThinking(false);
    setMessage("Loaded saved game.");
    setReviewIdx(null);
  }

  return (
    <main className="app">
      <header className="hero">
        <h1>Exact Chess</h1>
        <p>{message || gameStatus(game, mode, engineThinking)}</p>
      </header>

      <section className="toolbar" aria-label="Game controls">
        <button onClick={newGame}>New</button>
        <button onClick={undoMove} disabled={moves.length === 0 || engineThinking}>Undo</button>
        <button onClick={saveGame}>Save</button>
        <button onClick={loadGame}>Load</button>
        <button onClick={() => setFlipped((v) => !v)}>Flip</button>
        <button onClick={() => setShowHistory((v) => !v)} aria-pressed={showHistory}>
          {showHistory ? "Hide Moves" : "Show Moves"}
        </button>
        <button onClick={() => setPage((v) => (v === "game" ? "about" : "game"))}>{page === "game" ? "About" : "Game"}</button>
      </section>

      <section className="settings" aria-label="Settings">
        <label>Mode
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="white">Play White</option>
            <option value="black">Play Black</option>
            <option value="two">2 Player</option>
            <option value="demo">AI Demo</option>
          </select>
        </label>
        <label>Level
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label>Promotion
          <select value={promotion} onChange={(e) => setPromotion(e.target.value as Promotion)}>
            <option value="q">Queen</option>
            <option value="r">Rook</option>
            <option value="b">Bishop</option>
            <option value="n">Knight</option>
          </select>
        </label>
        <label>Theme
          <select value={pieceTheme} onChange={(e) => setPieceTheme(e.target.value as PieceTheme)}>
            <option value="simple">Simple SVG</option>
            <option value="fancy">Fancy SVG</option>
            <option value="unicode">Unicode</option>
          </select>
        </label>
      </section>

      {page === "about" ? (
        <section className="about-page">
          <h2>About Exact Chess PWA</h2>
          <p>
            This is an installable browser version of Exact Chess. It keeps the e-ink app's grayscale, high-contrast
            visual direction and uses GNOME Chess-derived piece artwork from the parent project.
          </p>
          <p>
            Rules are provided by <code>chess.js</code>. Engine play uses <code>stockfish.js</code> when the browser
            supports it; otherwise the app falls back to a lightweight built-in legal-move opponent.
          </p>
          <p>
            Attribution: GNOME Chess / GNOME Games authors for the original chess lineage and artwork, crazy-electron
            for the original GNOME Games e-ink/KUAL porting work, ThatPotatoDev and contributors for later porting
            lineage, Niklas Fiekas and the Stockfish team for <code>stockfish.js</code>, and the <code>chess.js</code>
            project for browser rules.
          </p>
          <p>
            Licenses: Exact Chess is GPL-family licensed in the parent project. <code>stockfish.js</code> is GPL-3.0.
            <code>chess.js</code> is BSD-2-Clause. See <code>pwa/THIRD_PARTY.md</code> and
            <code>public/licenses/stockfish.js-GPL-3.0.txt</code>.
          </p>
          <button onClick={resetSavedGame}>Clear Browser Save</button>
        </section>
      ) : (
        <section className={["play-area", showHistory ? "" : "history-hidden"].join(" ")}>
          <div className="board" aria-label="Chess board">
            {boardSquares.map((square) => {
              const piece = displayGame.get(square);
              const key = piece ? `${piece.color}${piece.type}` : "";
              const dark = (files.indexOf(square[0] as typeof files[number]) + Number(square[1])) % 2 === 0;
              const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
              return (
                <button
                  className={[
                    "square",
                    dark ? "dark" : "light",
                    !isReviewing && selected === square ? "selected" : "",
                    !isReviewing && legalTargets.has(square) ? "target" : "",
                    isLast ? "last" : ""
                  ].join(" ")}
                  key={square}
                  onClick={() => tapSquare(square)}
                  aria-label={square}
                >
                  {piece && pieceTheme !== "unicode" ? (
                    <img alt={`${piece.color}${piece.type}`} src={`pieces/${pieceTheme}/${svgNames[key]}`} draggable={false} />
                  ) : null}
                  {piece && pieceTheme === "unicode" ? <span className="unicode-piece">{unicodePieces[key]}</span> : null}
                </button>
              );
            })}
          </div>

          {showHistory && (
          <aside className="history">
            <h2>Moves</h2>
            <div className="review-nav">
              <button onClick={() => goReview(0)} disabled={displayIdx === 0} title="Start">◀◀</button>
              <button onClick={() => goReview(Math.max(0, displayIdx - 1))} disabled={displayIdx === 0} title="Previous">◀</button>
              <span className="review-label">{isReviewing ? `${displayIdx}/${totalMoves}` : "Live"}</span>
              <button onClick={() => displayIdx < totalMoves ? goReview(displayIdx + 1) : goReview(null)} disabled={displayIdx >= totalMoves} title="Next">▶</button>
              <button onClick={() => goReview(null)} disabled={!isReviewing} title="Live">▶▶</button>
            </div>
            <ol>
              {moves.map((move, index) => (
                <li
                  key={`${index}-${move}`}
                  className={displayIdx === index + 1 ? "active" : ""}
                  onClick={() => goReview(index + 1)}
                >{move}</li>
              ))}
            </ol>
          </aside>
          )}
        </section>
      )}

      <footer className="notes">
        <p>Auto-continue is always on. Use Save/Load for a manual restore point. Engine: {engineStatus === "ready" ? "Stockfish WASM" : "built-in fallback"}.</p>
      </footer>
    </main>
  );
}

export default App;
