/* =========================================================
   Rock · Paper · Scissors — client logic
   Talks to the Flask backend at POST /api/play, which owns
   the actual game rules (see app.py).
========================================================= */

const ICONS = {
  rock: `<svg viewBox="0 0 100 100"><path d="M50 8c14 0 20 10 22 20 6 2 12 8 12 18v10c0 20-14 36-34 36s-34-16-34-36V46c0-9 5-15 11-18C29 18 36 8 50 8z" fill="var(--paper)" stroke="var(--ink)" stroke-width="6" stroke-linejoin="round"/><path d="M34 46v20M50 42v24M66 46v20" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/></svg>`,
  paper: `<svg viewBox="0 0 100 100"><rect x="20" y="14" width="60" height="76" rx="14" fill="var(--paper)" stroke="var(--ink)" stroke-width="6"/><path d="M32 34h36M32 50h36M32 66h24" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/></svg>`,
  scissors: `<svg viewBox="0 0 100 100"><circle cx="30" cy="74" r="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="6"/><circle cx="70" cy="74" r="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="6"/><path d="M34 66 74 18M66 66 26 18" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/></svg>`,
};

const COUNT_STEPS = ["ROCK", "PAPER", "SCISSORS", "SHOOT!"];
const COUNT_STEP_MS = 380;

const els = {
  ring: document.getElementById("ring"),
  banner: document.getElementById("banner"),
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
};

const score = { cpu: 0, tie: 0, you: 0 };
let busy = false;

function setBanner(text, cls) {
  els.banner.className = "ring__banner" + (cls ? " " + cls : "");
  els.banner.textContent = text;
}

function setButtonsDisabled(disabled) {
  els.picks.forEach((btn) => (btn.disabled = disabled));
}

function resetStages() {
  els.cpuShape.textContent = "?";
  els.youShape.textContent = "?";
  els.cpuShape.innerHTML = "?";
  els.youShape.innerHTML = "?";
  els.cpuStage.className = "fighter__stage";
  els.youStage.className = "fighter__stage";
}

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

async function fetchResult(choice) {
  const res = await fetch("/api/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice }),
  });
  if (!res.ok) {
    throw new Error("Server didn't like that move.");
  }
  return res.json();
}

function reveal(userChoice, data) {
  els.youShape.innerHTML = ICONS[userChoice];
  els.cpuShape.innerHTML = ICONS[data.computer];
  els.youStage.classList.add("reveal");
  els.cpuStage.classList.add("reveal");

  if (data.result === "win") {
    els.youStage.classList.add("win");
    els.cpuStage.classList.add("lose");
    setBanner("YOU WIN!", "win");
    score.you += 1;
    els.ring.classList.add("shake");
  } else if (data.result === "lose") {
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

  els.scoreCpu.textContent = score.cpu;
  els.scoreTie.textContent = score.tie;
  els.scoreYou.textContent = score.you;

  els.afterwordText.textContent = `You threw ${cap(userChoice)}, the computer threw ${cap(
    data.computer
  )}.`;
  els.afterword.hidden = false;
}

function cap(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

async function handlePick(choice) {
  if (busy) return;
  busy = true;
  setButtonsDisabled(true);
  els.afterword.hidden = true;
  resetStages();

  try {
    const [_, data] = await Promise.all([runCountdown(), fetchResult(choice)]);
    reveal(choice, data);
  } catch (err) {
    setBanner("CONNECTION FUMBLED", "lose");
    els.afterwordText.textContent = "Couldn't reach the server — check that the Flask app is running.";
    els.afterword.hidden = false;
  } finally {
    setButtonsDisabled(false);
    busy = false;
  }
}

els.picks.forEach((btn) => {
  btn.addEventListener("click", () => handlePick(btn.dataset.choice));
});

els.playAgain.addEventListener("click", () => {
  els.afterword.hidden = true;
  resetStages();
  setBanner("READY?");
});
