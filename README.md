# Scribble 🎨

> A browser-based, Figma-lite collaborative whiteboard / design tool.

🚧 **Status: In Progress** — this project is currently being built. 

---

## About

Scribble lets users draw shapes, add text, create simple diagrams, move and transform elements, undo/redo changes, save their work locally, and export the canvas as a PNG — all in the browser, no backend required.

This is a frontend-only project by design: no server, no auth, no real-time multi-user sync. The focus is on interactions, state management, and UI architecture rather than just building static pages.

## Planned Features

- 🖊️ Draw shapes: rectangle, ellipse, line, arrow, freehand pen, text
- 🎯 Select, move, resize, and rotate elements
- 🎨 Style controls: stroke color, fill, stroke width, font
- ↩️ Undo / redo
- 💾 Auto-save to localStorage (persists between sessions)
- 📤 Export canvas as PNG
- 🧹 Clear canvas

## Tech Stack

- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **Canvas engine:** react-konva (Konva.js)
- **State persistence:** Browser localStorage
- **Icons:** lucide-react
- **Fonts:** Inter + JetBrains Mono
- **Deployment:** Vercel

## Design Direction

- Neutral graphite/fog palette with a single signal-orange (`#FF5A36`) accent
- Floating, rounded toolbar over a dot-grid canvas background
- Minimal, modern, developer-tool aesthetic

## Getting Started

```bash
# coming soon — setup instructions will be added once the initial build is ready
```

## Roadmap

- [ ] Canvas foundation (Konva stage, dot-grid background)
- [ ] Full toolset (shapes, selection, transform)
- [ ] Undo/redo + localStorage persistence
- [ ] PNG export + UI polish

---

*More to come as this builds out — follow along on [LinkedIn](https://www.linkedin.com/in/banditadas-dev/).*