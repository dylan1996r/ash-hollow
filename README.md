# Ash Hollow

Browser-playable 2.5D psychological horror vertical slice built with Vite, TypeScript, and Phaser 3.

This is a fully AI-created game experiment: concept, design plan, code, placeholder art direction, and implementation were produced through an AI-assisted development session. The project explores how quickly a playable browser horror prototype can be designed and built from a prompt, with atmosphere-first mechanics, procedural placeholder visuals, and a compact vertical slice.

## AI Transparency

This project is intended to be open about AI involvement. The game is being created as an AI-assisted experiment rather than a traditionally authored commercial game.

AI systems used or planned:

- **OpenAI Codex / ChatGPT**: Used for the initial concept development, design planning, project scaffolding, TypeScript/Phaser implementation, README drafting, local build checks, and GitHub repository setup.
- **Claude Code with Claude Opus 4.7**: Planned for future code review, implementation assistance, debugging, architecture feedback, and iteration passes.

Other relevant notes:

- The current source code and placeholder game content were generated through AI-assisted development prompts and tool use.
- Visuals are procedural placeholder assets drawn in code; no third-party art pack is currently included.
- Audio is not yet a polished asset pipeline; current horror feedback is primarily visual/UI-driven.
- Human input is currently focused on direction, taste, approval, and iteration requests.
- Any future AI tools, generated assets, external models, or human-created assets should be listed here as the project evolves.

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL, usually `http://localhost:5173/`.

## Controls

- `WASD` / arrow keys: move
- `Shift`: sprint, which makes noise
- Mouse: aim flashlight
- `E`: interact
- `F`: short flashlight stun when the threat is close
- `Esc`: pause
- `R`: restart from death or chapter complete

## Current Slice

The first chapter prototype covers the Ash Hollow Clinic District: fog road, diner, motel office, clinic lobby, storage, fuse room, basement, and service tunnel. It includes flashlight battery pressure, inventory, notes, locked progression, a three-fuse objective chain, room shifting, radio static, and one stalking enemy.
