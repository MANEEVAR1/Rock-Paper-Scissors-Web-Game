/* =========================================================
   Rock · Paper · Scissors — client logic
   Two modes:
     - "computer": POST /api/play (unchanged solo mode)
     - "online":   Socket.IO rooms, two browsers playing live
========================================================= */

const ICONS = {
  rock: `<svg viewBox="0 0 100 100"><path d="M50 8c14 0 20 10 22 20 6 2 12 8 12 18v10c0 20-14 36-34 36s-34-16-34-36V46c0-9 5-15 11-18C29 18 36 8 50 8z" fill="var(--paper)" stroke="var(--ink)" stroke-width="6" stroke-linejoin="round"/><path d="M34 46v20M50 42v24M66 46v20" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/></svg>`,
  paper: `<svg viewBox="0 0 100 100"><rect x="20" y="14" width="60" height="76" rx="14" fill="var(--paper)" stroke="var(--ink)" stroke-width="6"/><path d="M32 34h36M32 50h36M32 66h24" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/></svg>`,
  scissors: `<svg viewBox="0 0 100 100"><circle cx="30" cy="74" r="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="6"/><circle cx="70" cy="74" r="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="6"/><path d="M34 66 74 18M66 66 26 18" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/></svg>`,
};

const COUNT_STEPS = ["ROCK", "PAPER", "SCISSORS", "SHOOT!"];
const COUNT_STEP_MS = 380;

const els = {
  modeSelect: document.getElementById("mode-select"),
  modeComputer: document.getElementById("mode-computer"),
  modeOnline: document.getElementById("mode-online"),

  lobby: document.getElementById("lobby"),
  createRoomBtn: document.getElementById("create-room-btn"),
  roomCodeDisplay: document.getElementById("room-code-display"),
  roomCodeValue: document.getElementById("room-code-value"),
  hostStatus: document.getElementById("host-status"),
  joinCodeInput: document.getElementById("join-code-input"),
  joinRoomBtn: document.getElementById("join-room-btn"),
  lobbyError: document.getElementById("lobby-error"),
  lobbyBack: document.getElementById("lobby-back"),

  scoreboard: document.getElementById("scoreboard"),
  scoreLabelRival: document.getElementById("score-label-rival"),
  ring: document.getElementById("ring"),
  controls: document.getElementById("controls"),
  banner: document.getElementById("banner"),
  fighterTagRival: document.getElementById("fighter-tag-rival"),
  cpuStage: document.getElementById("cpu-stage"),
  youStage: document.getElementById("you-stage"),
  cpuShape: document.getElementById("cpu-shape"),
  youShape: document.getElementById("you-shape"),
  scoreCpu: document.getElementById("score-cpu"),
  scoreTie: document.getElementById("score-tie"),
  scoreYou: document.getElementById("score-you"),
  picks: Array.from(document.querySelectorAll(".pick")),

  afterword: document.getElementById("afterword"),
  afterwordText: document.getElementById("afterword-text"),
  playAgain: document.getElementById("play-again"),
  leaveMatch: document.getElementById("leave-match"),
};

const score = { cpu: 0, tie: 0, you: 0 };
let busy = false;
let mode = null; // "computer" | "online"
let socket = null;
let roomCode = null;
let awaitingOnlineResult = false;

/* ---------------------------------------------------------
   Screen management
--------------------------------------------------------- */
function showMode(newMode) {
  mode = newMode;
  score.cpu = 0;
  score.tie = 0;
  score.you = 0;
  updateScoreboard();

  els.modeSelect.hidden = true;
  els.lobby.hidden = true;
  els.scoreboard.hidden = false;
  els.ring.hidden = false;
  els.controls.hidden = false;
  els.afterword.hidden = true;

  els.leaveMatch.hidden = newMode !== "online";
  els.scoreLabelRival.textContent = newMode === "online" ? "Opponent" : "Computer";
  els.fighterTagRival.textContent = newMode === "online" ? "OPPONENT" : "COMPUTER";

  resetStages();
  setBanner(newMode === "online" ? "MATCHED! READY?" : "READY?");
}

function showLobby() {
  els.modeSelect.hidden = true;
  els.lobby.hidden = false;
  els.lobbyError.hidden = true;
  els.hostStatus.hidden = true;
  els.roomCodeDisplay.hidden = true;
  els.joinCodeInput.value = "";
}

function backToModeSelect() {
  if (socket) {
    if (roomCode) socket.emit("leave_room_request", { room: roomCode });
    socket.disconnect();
    socket = null;
  }
  roomCode = null;
  mode = null;
  els.lobby.hidden = true;
  els.scoreboard.hidden = true;
  els.ring.hidden = true;
  els.controls.hidden = true;
  els.afterword.hidden = true;
  els.modeSelect.hidden = false;
}

/* ---------------------------------------------------------
   Shared banner / stage helpers
--------------------------------------------------------- */
function setBanner(text, cls) {
  els.banner.className = "ring__banner" + (cls ? " " + cls : "");
  els.banner.textContent = text;
}

function setButtonsDisabled(disabled) {
  els.picks.forEach((btn) => (btn.disabled = disabled));
}

function resetStages() {
  els.cpuShape.innerHTML = "?";
  els.youShape.innerHTML = "?";
  els.cpuStage.className = "fighter__stage";
  els.youStage.className = "fighter__stage";
}

function updateScoreboard() {
  els.scoreCpu.textContent = score.cpu;
  els.scoreTie.textContent = score.tie;
  els.scoreYou.textContent = score.you;
}

function cap(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function reveal(userChoice, rivalChoice, result, rivalNoun) {
  els.youShape.innerHTML = ICONS[userChoice];
  els.cpuShape.innerHTML = ICONS[rivalChoice];
  els.youStage.classList.add("reveal");
  els.cpuStage.classList.add("reveal");

  if (result === "win") {
    els.youStage.classList.add("win");
    els.cpuStage.classList.add("lose");
    setBanner("YOU WIN!", "win");
    score.you += 1;
    els.ring.classList.add("shake");
  } else if (result === "lose") {
    els.youStage.classList.add("lose");
    els.cpuStage.classList.add("win");
    setBanner("YOU LOSE", "lose");
    score.cpu += 1;
    els.ring.classList.add("shake");
  } else {
    els.youStage.classList.add("tie");
    els.cpuStage.classList.add("tie");
    setBanner("IT'S A TIE", "tie");
    score.tie += 1;
  }

  setTimeout(() => els.ring.classList.remove("shake"), 420);
  updateScoreboard();

  els.afterwordText.textContent = `You threw ${cap(userChoice)}, ${rivalNoun} threw ${cap(rivalChoice)}.`;
  els.afterword.hidden = false;
}

/* ---------------------------------------------------------
   Mode: vs Computer (REST)
--------------------------------------------------------- */
function runCountdown() {
  return new Promise((resolve) => {
    let i = 0;
    setBanner(COUNT_STEPS[i], "count");
    const timer = setInterval(() => {
      i += 1;
      if (i >= COUNT_STEPS.length) {
        clearInterval(timer);
        resolve();
        return;
      }
      setBanner(COUNT_STEPS[i], "count");
    }, COUNT_STEP_MS);
  });
}

async function fetchComputerResult(choice) {
  const res = await fetch("/api/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice }),
  });
  if (!res.ok) throw new Error("Server didn't like that move.");
  return res.json();
}

async function playAgainstComputer(choice) {
  busy = true;
  setButtonsDisabled(true);
  els.afterword.hidden = true;
  resetStages();

  try {
    const [, data] = await Promise.all([runCountdown(), fetchComputerResult(choice)]);
    reveal(choice, data.computer, data.result, "the computer");
  } catch (err) {
    setBanner("CONNECTION FUMBLED", "lose");
    els.afterwordText.textContent = "Couldn't reach the server — check that the Flask app is running.";
    els.afterword.hidden = false;
  } finally {
    setButtonsDisabled(false);
    busy = false;
  }
}

/* ---------------------------------------------------------
   Mode: vs Friend (Socket.IO)
--------------------------------------------------------- */
function ensureSocket() {
  if (socket) return socket;
  socket = io();

  socket.on("room_created", ({ code }) => {
    roomCode = code;
    els.roomCodeDisplay.hidden = false;
    els.roomCodeValue.textContent = code;
    els.hostStatus.hidden = false;
  });

  socket.on("join_error", ({ message }) => {
    els.lobbyError.hidden = false;
    els.lobbyError.textContent = message;
  });

  socket.on("game_start", ({ room }) => {
    roomCode = room;
    showMode("online");
  });

  socket.on("opponent_waiting", () => {
    if (!busy) setBanner("OPPONENT IS READY — YOUR MOVE", "count");
  });

  socket.on("round_result", (data) => {
    reveal(data.you, data.opponent, data.result, "your opponent");
    score.cpu = data.scoreOpponent;
    score.you = data.scoreYou;
    updateScoreboard();
    setButtonsDisabled(false);
    busy = false;
    awaitingOnlineResult = false;
  });

  socket.on("opponent_left", () => {
    setBanner("OPPONENT LEFT", "lose");
    els.afterwordText.textContent = "Your opponent disconnected. Start or join a new room to keep playing.";
    els.afterword.hidden = false;
    setButtonsDisabled(true);
    roomCode = null;
  });

  return socket;
}

function playOnline(choice) {
  if (!roomCode) return;
  busy = true;
  awaitingOnlineResult = true;
  setButtonsDisabled(true);
  els.afterword.hidden = true;
  resetStages();
  setBanner("WAITING FOR OPPONENT…", "count");
  socket.emit("submit_choice", { room: roomCode, choice });
}

/* ---------------------------------------------------------
   Wiring
--------------------------------------------------------- */
function handlePick(choice) {
  if (busy) return;
  if (mode === "computer") {
    playAgainstComputer(choice);
  } else if (mode === "online") {
    playOnline(choice);
  }
}

els.picks.forEach((btn) => {
  btn.addEventListener("click", () => handlePick(btn.dataset.choice));
});

els.modeComputer.addEventListener("click", () => showMode("computer"));

els.modeOnline.addEventListener("click", () => {
  ensureSocket();
  showLobby();
});

els.createRoomBtn.addEventListener("click", () => {
  els.lobbyError.hidden = true;
  ensureSocket().emit("create_room");
});

els.joinRoomBtn.addEventListener("click", () => {
  const code = els.joinCodeInput.value.trim().toUpperCase();
  els.lobbyError.hidden = true;
  if (!code) {
    els.lobbyError.hidden = false;
    els.lobbyError.textContent = "Enter a room code first.";
    return;
  }
  ensureSocket().emit("join_room_request", { code });
});

els.lobbyBack.addEventListener("click", backToModeSelect);

els.playAgain.addEventListener("click", () => {
  els.afterword.hidden = true;
  resetStages();
  setBanner(mode === "online" ? "READY?" : "READY?");
});

els.leaveMatch.addEventListener("click", backToModeSelect);