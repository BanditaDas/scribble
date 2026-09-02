# Scribble 🎨

A minimal, frontend-only design tool inspired by Figma — sketch shapes, arrows, and text on an infinite canvas, all saved locally in your browser.

**🔗 Live Demo:** [scribble-murex.vercel.app](https://scribble-murex.vercel.app/)

---

## About

Scribble is a lightweight whiteboard/design tool built to explore canvas-based interaction design entirely on the frontend — no backend, no external sync services. Everything you draw persists locally, so you can close the tab and pick up right where you left off.

## Features

- **Drawing tools** — Rectangle, ellipse, line, arrow, freehand pen, and text
- **Eraser tool** — Click to delete shapes or drag to scrub-erase multiple elements with live visual feedback and single-stroke undo
- **Selection & transform** — Move, resize, and rotate any element on the canvas
- **Style controls** — Adjust stroke color, fill, and thickness
- **Undo / redo** — Full history stack for every action
- **Local persistence** — Your canvas is automatically saved via `localStorage`
- **PNG export** — Download your board as an image
- **Clear canvas** — Start fresh with one click
- **Dot-grid canvas** — Clean, Figma-style visual reference grid

## Tech Stack

| Layer | Tool |
|---|---|
| UI Framework | React |
| Styling | Tailwind CSS |
| Canvas Rendering | react-konva |
| Icons | lucide-react |
| Fonts | Inter, JetBrains Mono |
| Persistence | localStorage |
| Deployment | Vercel |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `V` | Select tool |
| `R` | Rectangle tool |
| `O` | Ellipse tool |
| `L` | Line tool |
| `A` | Arrow tool |
| `P` | Pen tool (freehand) |
| `T` | Text tool |
| `E` | Eraser tool |
| `Delete` / `Backspace` | Delete selected shape |
| `Ctrl` / `Cmd` + `Z` | Undo |
| `Ctrl` / `Cmd` + `Shift` + `Z` / `Y` | Redo |
| `Ctrl` / `Cmd` + `D` | Duplicate selection |

## Design

Scribble uses a graphite/fog neutral palette with a single signal-orange (`#FF5A36`) accent, a floating rounded toolbar, and a dot-grid background — aiming for a clean, focused, tool-like feel rather than a generic app UI.

## Getting Started

Clone the repo and install dependencies:

```bash
git clone https://github.com/BanditaDas/scribble.git
cd scribble
npm install
npm run dev
```

## Usage

1. Pick a tool from the floating toolbar (shape, pen, text, eraser) or press its keyboard shortcut
2. Draw on the canvas, or switch to the Eraser (`E`) to click or drag-erase elements
3. Select any element (`V`) to move, resize, or restyle it
4. Use undo/redo (`Ctrl+Z` / `Ctrl+Y`) as needed
5. Export your board as a PNG when you're done — your work is also auto-saved locally

---

**Portfolio:** [https://portfolio-six-theta-37.vercel.app/]
**LinkedIn:** [https://www.linkedin.com/in/banditadas-dev/]