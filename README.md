# Rock · Paper · Scissors — Showdown

A browser version of the classic terminal game, wrapped in a comic-panel
arena UI: countdown-to-reveal animation, a live scoreboard, and win/lose/tie
states that punch, shake, and glow instead of just printing text.

The Python game logic hasn't changed — it's the same comparison rules from
the original script, just moved behind a small Flask endpoint so a browser
can call it.

## Project structure

```
rps-web/
├── app.py                 # Flask app — owns the game rules
├── requirements.txt       # Flask + gunicorn
├── templates/
│   └── index.html         # Page structure
└── static/
    ├── style.css           # Comic-panel arena theme + animations
    └── script.js           # Countdown, fetch to /api/play, reveal + score
```

Flask expects **exactly** this layout: HTML goes in `templates/`, CSS/JS
go in `static/`. If the folders are named anything else, `render_template`
and `url_for('static', ...)` won't find the files.

## How the pieces link together

Your original script used `input()` and `print()` in a `while` loop — that
only works in a terminal, not in a browser, so there's no way to "attach" a
UI directly to it. Instead, `app.py` keeps the exact same decision logic
(`rock` beats `scissors`, etc.) inside a function called `decide()`, and
exposes it over HTTP:

1. The browser loads `/` → Flask returns `templates/index.html`.
2. You click a move button → `static/script.js` runs the countdown, then
   sends `POST /api/play` with `{"choice": "rock"}`.
3. `app.py` picks the computer's move with `random.choice`, calls
   `decide()`, and replies with JSON: `{"computer": "scissors", "result": "win"}`.
4. `script.js` reads that JSON and animates the reveal + updates the
   scoreboard — no page reload, no server-side score storage (score lives
   in the browser tab only).

## Run it locally

```bash
cd rps-web
pip install -r requirements.txt
python app.py
```

Then open `http://127.0.0.1:5000` in your browser.

## Push to GitHub

```bash
cd rps-web
git init
git add .
git commit -m "Rock paper scissors web UI"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Deploy on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect the GitHub repo you just pushed.
3. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
4. Leave the environment as Python 3, click **Create Web Service**.

Render builds and gives you a live `https://your-app.onrender.com` URL.
`gunicorn` is what actually serves Flask in production — `python app.py`'s
built-in server (the one you used locally) isn't meant for that.

## Customizing

- Colors, fonts, and the halftone texture all live at the top of
  `static/style.css` under `:root` — change one variable, the whole
  palette follows.
- Countdown wording/speed is `COUNT_STEPS` and `COUNT_STEP_MS` at the top
  of `static/script.js`.
