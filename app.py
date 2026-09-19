"""
Rock Paper Scissors — Flask backend.

This is your original game logic, ported from a terminal loop into a
web endpoint. The frontend (templates/index.html, static/script.js)
calls POST /api/play with the player's choice; this file still owns
who wins, exactly like your original script did.
"""

from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

OPTIONS = ("rock", "paper", "scissors")
BEATS = {"rock": "scissors", "paper": "rock", "scissors": "paper"}


def decide(user_choice, comp_choice):
    """Same rules as your while/elif chain, just returned instead of printed."""
    if user_choice == comp_choice:
        return "tie"
    return "win" if BEATS[user_choice] == comp_choice else "lose"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/play", methods=["POST"])
def play():
    data = request.get_json(force=True) or {}
    user_choice = str(data.get("choice", "")).lower()

    if user_choice not in OPTIONS:
        return jsonify({"error": "Invalid choice"}), 400

    comp_choice = random.choice(OPTIONS)
    result = decide(user_choice, comp_choice)

    return jsonify({"computer": comp_choice, "result": result})


if __name__ == "__main__":
    app.run(debug=True)
