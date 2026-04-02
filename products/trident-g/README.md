# Trident G

Static prototype shell for a game-like Trident-G app.

Files:

- `index.html` - launcher page for the prototype
- `g-loop.html` - mission hub with zone check, micro probes, mission map, and adaptive run recipe
- `game-play.html` - integrated run shell for capacity, reasoning, mission grammar, and transfer telemetry
- `trident-g.css` - adapted visual system based on the provided console styling
- `trident-g.js` - lightweight screen, mode, and mission switching

Current prototype scope:

- `G Loop` screen for zone gating, mission selection, meta-mission telemetry, and adaptive run recipe
- `Game Play` screen for `Capacity Gym`, `Reasoning Gym`, and `Mission Grammar Gym`
- right-rail telemetry including `Accuracy`, `Pace`, `Zone`, `Syntax Swap Gains`, `Far Transfer`, and `Banked Scripts`

Local preview:

- open the launcher directly: `Start-Process .\products\trident-g\index.html`
- open the hub directly: `Start-Process .\products\trident-g\g-loop.html`
- open gameplay directly: `Start-Process .\products\trident-g\game-play.html`
- serve from localhost:
  `Set-Location .\products\trident-g`
  `python -m http.server 8080`

This is a UI prototype, not a production application yet.
