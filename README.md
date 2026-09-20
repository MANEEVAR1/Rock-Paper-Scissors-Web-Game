# Rock · Paper · Scissors — Showdown

A browser take on the classic hand-game: pick your move, watch a countdown
build to a punch-in reveal, and keep score across rounds — all wrapped in a
hand-inked, comic-panel arena instead of a plain form.

**Live demo:** [rock-paper-scissors-web-game.onrender.com](https://rock-paper-scissors-web-game.onrender.com/)

> First load may take a few seconds — the free Render tier spins the server
> down when it's idle and wakes it back up on the first visit.

## What it does

- Two modes: **Vs Computer** (solo, instant) and **Vs a Friend** (live,
  across two separate devices/browsers)
- Click Rock, Paper, or Scissors and a "ROCK... PAPER... SCISSORS... SHOOT!"
  countdown runs before either move is revealed
- In Vs a Friend mode, one player creates a room and gets a 5-character
  code; the other enters it to join — no accounts, no sign-up
- Wins, losses, and ties each get their own color and a short screen-shake
  or glow, and a running scoreboard tracks the whole session
- Fully responsive — the same arena reflows for phones, tablets, and desktop

## How it works

The game rules live in a small Flask backend (`app.py`).

- **Vs Computer** sends your move to a `/api/play` endpoint, which decides
  the winner and picks the computer's move over a normal HTTP request.
- **Vs a Friend** uses Socket.IO (WebSockets) instead of HTTP requests,
  since both players need to be notified the moment the other one moves.
  Rooms are held in memory on the server: when both players in a room have
  submitted a choice, the server resolves the round and pushes the result
  to both browsers at once. Room state resets if the server restarts, and
  a disconnect ends the match for the remaining player.

Either way, no page reloads, and scores reset if you refresh.

## Tech stack

- **Backend:** Python, Flask, Flask-SocketIO
- **Frontend:** HTML, CSS, vanilla JavaScript, Socket.IO client — no frameworks
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
├── app.py                 # Flask app — owns the game rules + Socket.IO rooms
├── requirements.txt       # Flask, Flask-SocketIO, gunicorn, eventlet
├── .python-version        # Pins the Python version Render builds with
├── templates/
│   └── index.html         # Page structure — mode select, lobby, arena
└── static/
    ├── style.css           # Comic-panel arena theme + animations
    └── script.js           # Countdown, REST + Socket.IO calls, reveal + score
```

## Deployment

Deployed on [Render](https://render.com) as a web service:

- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn --worker-class eventlet -w 1 app:app`

The worker class matters here: WebSocket connections (used by Vs a Friend
mode) need a worker that can hold a connection open and push messages to
it, which the default `gunicorn` worker can't do. `eventlet` is used
instead of `gevent` specifically because it's pure Python — `gevent`
needs to compile C code during install, which fails on some hosts'
build images. If this service is already deployed with an older Start
Command, update it in the Render dashboard under **Settings → Start
Command**, then push a commit (or manually redeploy) to pick it up.

`.python-version` pins the build to Python 3.12.7. Render's default
Python version changes over time as new releases come out, and `eventlet`
(along with plenty of other libraries) hasn't fully caught up to the
newest ones yet — pinning avoids landing on an untested version by
chance.

## Customizing

- Colors, fonts, and the halftone texture live at the top of
  `static/style.css` under `:root` — change one variable and the whole
  palette follows.
- Countdown wording and speed are set by `COUNT_STEPS` and
  `COUNT_STEP_MS` at the top of `static/script.js`.