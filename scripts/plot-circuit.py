"""Plots the circuit data (pavement, route, stations, markings) with a metre grid, for choosing where things go.
Usage: python scripts/plot-circuit.py out.png [x0 y0 x1 y1]"""
import json, sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon

c = json.load(open("docs/circuit-v2/circuit.json", encoding="utf-8"))
fig, ax = plt.subplots(figsize=(22, 15))
for i, ring in enumerate(c["pavement"]):
    ax.add_patch(Polygon(ring, closed=True, fc="#c9ccd1" if i == 0 else "#7fbf6a", ec="#555", lw=0.6))
S = c["route"]["samples"]
ax.plot([s[1] for s in S], [s[2] for s in S], color="#d22", lw=1.2, label="route")
for st in c["stations"]:
    ax.plot(*st["start"]["at"], "bo"); ax.annotate(st["id"], st["start"]["at"], color="blue", fontsize=8)
ax.plot(*c["spawn"]["at"], "g^"); ax.annotate("spawn", c["spawn"]["at"], color="green")
for a, b in c["markings"].get("stop_lines", []): ax.plot([a[0], b[0]], [a[1], b[1]], color="k", lw=1)
ax.set_aspect("equal"); ax.set_xticks(range(-5, 125, 5)); ax.set_yticks(range(-5, 80, 5)); ax.grid(True, lw=0.3)
if len(sys.argv) > 2:
    x0, y0, x1, y1 = map(float, sys.argv[2:6]); ax.set_xlim(x0, x1); ax.set_ylim(y0, y1)
fig.savefig(sys.argv[1], dpi=60, bbox_inches="tight")
