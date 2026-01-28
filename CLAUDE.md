# Live Scotland Yard

A digital implementation of the Scotland Yard board game with an interactive web interface and Python-based board rendering tools.

> **Note:** This file contains project-specific instructions. Global standards (permissions, git workflow, code style principles, MCP usage) are defined in `~/.claude/CLAUDE.md`.

---

## Quick Reference

```bash
# Dev server (http://localhost:5173)
cd web-prototype && PATH="/usr/local/bin:$PATH" npm run dev

# Python scripts
source .venv/bin/activate
```

**Node.js Quirk:** System PATH includes old Node (v20.10.0) at `~/.local/node/bin`. Always prefix with `PATH="/usr/local/bin:$PATH"` to use correct version (v24.11.1).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19.2.0, TypeScript, Vite 7.2.4 |
| Utilities | Python 3.11, OpenCV, NumPy |
| Linting | ESLint (web), Google-style docstrings (Python) |

---

## Project Structure

```
LiveScotlandYard/
├── web-prototype/          # React + TypeScript web application
│   ├── src/
│   │   ├── App.tsx        # Main game board component
│   │   ├── main.tsx       # React entry point
│   │   └── App.css        # Styling
│   ├── public/            # Static assets (board.png, nodes.json)
│   └── package.json
├── scripts/               # Python board rendering utilities
│   ├── combine_board_images.py
│   └── render_node_overlay.py
├── assets/                # Game assets and JSON data
└── memory-bank/           # Project documentation
```

---

## Architecture

### Web Application (`web-prototype/`)

**App.tsx** handles:
1. Fetches node data from `/nodes.json` on mount
2. Displays the Scotland Yard board image
3. Overlays interactive SVG circles at each node position
4. Handles node selection with loading/error states

**Data Flow:**
```
/nodes.json → fetch() → state → SVG overlay → interactive nodes
```

### Python Scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `combine_board_images.py` | ORB feature matching + homography alignment, sharpness-weighted blending |
| `render_node_overlay.py` | Coordinate transformation, amber circle overlay, JSON export for web |

---

## Project-Specific Style

**TypeScript/React:**
- 2-space indentation
- Functional components with hooks
- Follow `web-prototype/eslint.config.js`

**Python:**
- Tab indentation
- Google-style docstrings with type hints
- Always use virtual environment

---

## Forbidden Files

Do not commit or read unnecessarily:
- `.env`, credentials, API keys
- `*.jpg` board originals in project root (large binaries)
- `node_modules/`, `.venv/`, `dist/`

---

## Debugging (This Project)

| Issue | Solution |
|-------|----------|
| Vite won't start | Check Node version: `node --version` (need 20.19+ or 22.12+) |
| API call fails silently | Check browser Network tab and console |
| Board not rendering | Verify `/board.png` and `/nodes.json` exist in `public/` |
| Python script fails | Ensure `.venv` is activated |
| Image processing issues | Check OpenCV installation and file paths |

---

## Common Commands

**Web Development:**
```bash
cd web-prototype && PATH="/usr/local/bin:$PATH" npm run dev      # Start dev server
cd web-prototype && npm run build                                 # Production build
cd web-prototype && npm run lint                                  # Run linter
```

**Python Scripts:**
```bash
# Combine board images
.venv/bin/python scripts/combine_board_images.py \
  --primary "Scotland Yard game board.jpg" \
  --secondary "Scotland Yard game board2.jpg" \
  --output assets/board/scotland_yard_board.png

# Render node overlay
.venv/bin/python scripts/render_node_overlay.py \
  --board "Scotland Yard game board2.jpg" \
  --nodes-json assets/board/nodes.json \
  --output-image assets/board/board2_nodes_overlay.png \
  --output-json assets/board/nodes_board2.json
```

---

## Testing

No automated tests currently. When adding:
- Use **Vitest** for React components
- Mock API calls
- Test critical user interactions
