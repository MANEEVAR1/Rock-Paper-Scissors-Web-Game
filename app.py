"""
Rock Paper Scissors — Flask backend.

Two modes:
  - Solo vs Computer: POST /api/play (unchanged from the original version)
  - Online vs a friend: Socket.IO rooms, so two browsers on two different
    devices/networks can play a live round against each other.

Room state lives in memory (a plain dict). That's fine for a small game
like this, but it means rooms disappear if the server restarts, and this
won't scale past a single server process — good enough for a personal
project, not for a "real" production game backend.
"""

import random
import string

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, join_room, leave_room, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = "rock-paper-scissors-secret"
socketio = SocketIO(app, cors_allowed_origins="*")

OPTIONS = ("rock", "paper", "scissors")
BEATS = {"rock": "scissors", "paper": "rock", "scissors": "paper"}

# rooms[code] = {
#   "players": [sid1, sid2],
#   "choices": {sid: "rock"/"paper"/"scissors"},
#   "scores": {sid: int},
# }
rooms = {}


def decide(choice_a, choice_b):
    """Returns 'a', 'b', or 'tie' — who wins between two arbitrary choices."""
    if choice_a == choice_b:
        return "tie"
    return "a" if BEATS[choice_a] == choice_b else "b"


def generate_room_code():
    while True:
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
        if code not in rooms:
            return code


def find_room_for_sid(sid):
    for code, room in rooms.items():
        if sid in room["players"]:
            return code, room
    return None, None


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/play", methods=["POST"])
def play():
    """Solo mode: you vs a random computer move."""
    data = request.get_json(force=True) or {}
    user_choice = str(data.get("choice", "")).lower()

    if user_choice not in OPTIONS:
        return jsonify({"error": "Invalid choice"}), 400

    comp_choice = random.choice(OPTIONS)
    outcome = decide(user_choice, comp_choice)
    result = "tie" if outcome == "tie" else ("win" if outcome == "a" else "lose")

    return jsonify({"computer": comp_choice, "result": result})


# ---------------------------------------------------------------------------
# Online mode — Socket.IO rooms
# ---------------------------------------------------------------------------

@socketio.on("create_room")
def handle_create_room():
    code = generate_room_code()
    rooms[code] = {"players": [request.sid], "choices": {}, "scores": {request.sid: 0}}
    join_room(code)
    emit("room_created", {"code": code})


@socketio.on("join_room_request")
def handle_join_room(data):
    code = str((data or {}).get("code", "")).upper().strip()
    room = rooms.get(code)

    if not room:
        emit("join_error", {"message": "That room code doesn't exist."})
        return
    if len(room["players"]) >= 2:
        emit("join_error", {"message": "That room already has two players."})
        return

    room["players"].append(request.sid)
    room["scores"][request.sid] = 0
    join_room(code)

    emit("game_start", {"room": code}, room=code)


@socketio.on("submit_choice")
def handle_submit_choice(data):
    code = str((data or {}).get("room", "")).upper().strip()
    choice = str((data or {}).get("choice", "")).lower()
    room = rooms.get(code)

    if not room or choice not in OPTIONS or request.sid not in room["players"]:
        return

    room["choices"][request.sid] = choice

    if len(room["choices"]) < 2:
        emit("opponent_waiting", room=code, include_self=False)
        return

    p1, p2 = room["players"]
    c1, c2 = room["choices"][p1], room["choices"][p2]
    outcome = decide(c1, c2)

    if outcome != "tie":
        winner = p1 if outcome == "a" else p2
        room["scores"][winner] += 1

    for sid in room["players"]:
        opponent_sid = p2 if sid == p1 else p1
        if outcome == "tie":
            personal_result = "tie"
        else:
            personal_result = "win" if (outcome == "a") == (sid == p1) else "lose"

        emit(
            "round_result",
            {
                "you": room["choices"][sid],
                "opponent": room["choices"][opponent_sid],
                "result": personal_result,
                "scoreYou": room["scores"][sid],
                "scoreOpponent": room["scores"][opponent_sid],
            },
            room=sid,
        )

    room["choices"] = {}


@socketio.on("leave_room_request")
def handle_leave_room(data):
    code = str((data or {}).get("room", "")).upper().strip()
    room = rooms.get(code)
    if room and request.sid in room["players"]:
        leave_room(code)
        emit("opponent_left", room=code)
        rooms.pop(code, None)


@socketio.on("disconnect")
def handle_disconnect():
    code, room = find_room_for_sid(request.sid)
    if room:
        leave_room(code)
        emit("opponent_left", room=code)
        rooms.pop(code, None)


if __name__ == "__main__":
    socketio.run(app, debug=True)