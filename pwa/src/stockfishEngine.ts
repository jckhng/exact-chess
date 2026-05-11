export type EngineStatus = "disabled" | "starting" | "ready" | "failed";

type EngineCallbacks = {
  onReady: () => void;
  onBestMove: (move: string) => void;
  onError: (message: string) => void;
};

export type BrowserStockfish = {
  status: () => EngineStatus;
  requestMove: (moves: string[], movetime: number) => boolean;
  newGame: () => void;
  stop: () => void;
  dispose: () => void;
};

export function createBrowserStockfish(callbacks: EngineCallbacks): BrowserStockfish {
  if (typeof Worker === "undefined") {
    callbacks.onError("Web Workers are not available.");
    return disabledEngine();
  }

  let state: EngineStatus = "starting";
  let worker: Worker | null = null;

  try {
    worker = new Worker(`${import.meta.env.BASE_URL}engine/stockfish.js`);
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : String(error));
    return disabledEngine("failed");
  }

  worker.onmessage = (event: MessageEvent) => {
    const line = String(event.data || "");
    if (line === "uciok") {
      worker?.postMessage("setoption name Skill Level value 8");
      worker?.postMessage("isready");
    } else if (line === "readyok") {
      state = "ready";
      callbacks.onReady();
    } else if (line.startsWith("bestmove ")) {
      callbacks.onBestMove(line.split(/\s+/)[1]);
    }
  };

  worker.onerror = (event) => {
    state = "failed";
    callbacks.onError(event.message || "Stockfish worker failed.");
  };

  worker.postMessage("uci");

  return {
    status: () => state,
    requestMove: (moves, movetime) => {
      if (!worker || state !== "ready") return false;
      worker.postMessage(`position startpos moves ${moves.join(" ")}`.trim());
      worker.postMessage(`go movetime ${movetime}`);
      return true;
    },
    newGame: () => {
      worker?.postMessage("ucinewgame");
      worker?.postMessage("isready");
    },
    stop: () => worker?.postMessage("stop"),
    dispose: () => {
      worker?.postMessage("quit");
      worker?.terminate();
      worker = null;
    }
  };
}

function disabledEngine(status: EngineStatus = "disabled"): BrowserStockfish {
  return {
    status: () => status,
    requestMove: () => false,
    newGame: () => {},
    stop: () => {},
    dispose: () => {}
  };
}
