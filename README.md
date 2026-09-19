# Rock · Paper · Scissors — Showdown

A browser take on the classic hand-game: pick your move, watch a countdown
build to a punch-in reveal, and keep score across rounds — all wrapped in a
hand-inked, comic-panel arena instead of a plain form.

**Live demo:** [rock-paper-scissors-web-game.onrender.com](https://rock-paper-scissors-web-game.onrender.com/)

> First load may take a few seconds — the free Render tier spins the server
> down when it's idle and wakes it back up on the first visit.

## What it does

- Click Rock, Paper, or Scissors and a "ROCK... PAPER... SCISSORS... SHOOT!"
  countdown runs before either move is revealed
- The computer's move is picked server-side, so it can't be seen or guessed
  in advance from the page's code
- Wins, losses, and ties each get their own color and a short screen-shake
  or glow, and a running scoreboard tracks the whole session
- Fully responsive — the same arena reflows for phones, tablets, and desktop

## How it works

The game rules live in a small Flask backend (`app.py`). The page in your
browser sends the move you clicked to a `/api/play` endpoint, the backend
decides the winner and picks the computer's move, and the page animates
whatever comes back. No page reloads, and the score resets if you refresh
(it isn't saved anywhere beyond the current tab).

## Tech stack

- **Backend:** Python, Flask
- **Frontend:** HTML, CSS, vanilla JavaScript — no frameworks
- **Hosting:** Render

## Run it locally

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
pip install -r requirements.txt
python app.py
```

Then open `http://127.0.0.1:5000`.

## Project structure

```
├── app.py                 # Flask app — owns the game rules
├── requirements.txt       # Flask + gunicorn
├── templates/
│   └── index.html         # Page structure
└── static/
    ├── style.css           # Comic-panel arena theme + animations
    └── script.js           # Countdown, fetch to /api/play, reveal + score
```

## Deployment

Deployed on [Render](https://rock-paper-scissors-web-game.onrender.com/) as a web service:

- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn app:app`

## Customizing

- Colors, fonts, and the halftone texture live at the top of
  `static/style.css` under `:root` — change one variable and the whole
  palette follows.
- Countdown wording and speed are set by `COUNT_STEPS` and
  `COUNT_STEP_MS` at the top of `static/script.js`.
