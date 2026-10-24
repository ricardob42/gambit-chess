# Gambit Chess

A chess game built with Svelte 5, Vite and chess.js, installable as a PWA and ready for Vercel.

## Features

- Play the engine (four levels) or a friend on the same device
- Legal move hints, drag and drop or tap to move, promotion picker
- Castling, en passant, check, checkmate, stalemate, threefold repetition, fifty-move rule, insufficient material
- Clocks with increments, resign, undo, board flip
- Move list with history review (arrow keys, Home, End)
- Copy PGN or FEN
- Spanish (default) and English interface, switchable in the app
- Sound effects, three themes, installable and playable offline
- The current game is saved and resumes after a reload

## Run

```
npm install
npm run dev
```

## Deploy

Push to GitHub, import the repository in Vercel and deploy. The Vite preset is detected automatically (`npm run build`, output `dist`).
