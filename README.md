# Ash Hollow

Browser-playable 2.5D psychological horror vertical slice built with Vite, TypeScript, and Phaser 3.

Demo: https://dylan1996r.github.io/ash-hollow/

This is a fully AI-created game experiment: concept, design plan, code, placeholder art direction, and implementation were produced through an AI-assisted development session. The project explores how quickly a playable browser horror prototype can be designed and built from a prompt, with atmosphere-first mechanics, procedural placeholder visuals, and a compact vertical slice.

## AI Transparency

This project is intended to be open about AI involvement. The game is being created as an AI-assisted experiment rather than a traditionally authored commercial game.

AI systems used or planned:

- **OpenAI Codex / ChatGPT**: Used for the initial concept development, design planning, project scaffolding, TypeScript/Phaser implementation, README drafting, local build checks, and GitHub repository setup.
- **Claude Code with Claude Opus 4.7**: Planned for future code review, implementation assistance, debugging, architecture feedback, and iteration passes.

Other relevant notes:

- The current source code and placeholder game content were generated through AI-assisted development prompts and tool use.
- Visuals combine procedural effects with curated CC0 third-party assets listed in [CREDITS.md](./CREDITS.md).
- Audio combines procedural threat tones with curated CC0 ambience assets listed in [CREDITS.md](./CREDITS.md).
- Human input is currently focused on direction, taste, approval, and iteration requests.
- Any future AI tools, generated assets, external models, or human-created assets should be listed here as the project evolves.

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL, usually `http://localhost:5173/`.

## Build

```bash
npm run build
```

For the GitHub Pages base path:

```bash
npm run deploy:pages
```

## Controls

- `WASD` / arrow keys: move
- `Shift`: sprint, which makes noise
- Mouse: aim flashlight
- `E`: interact
- `F`: short flashlight stun when the threat is close
- `M`: mute/unmute procedural audio
- `,` / `.`: lower/raise audio volume
- `Esc`: pause
- `R`: restart from death or chapter complete

## Current Slice

The first chapter prototype covers the Ash Hollow Clinic District: fog road, diner, motel office, clinic lobby, storage, fuse room, basement, and service tunnel. It includes flashlight battery pressure, inventory, notes, locked progression, a three-fuse objective chain, room shifting, radio static, hybrid procedural/asset audio, ash/fog effects, imported texture overlays, in-game credits, and one stalking enemy.

## Asset Transparency

The project uses free/open assets only when license information is visible and compatible with a public browser demo. Current integrated third-party assets are CC0; attribution is still provided voluntarily in [CREDITS.md](./CREDITS.md) and in the in-game credits screen. Future CC-BY assets are allowed only if creator, source, license, and modification notes are documented.

## v0.2 Features

- Public-demo-oriented UI, controls, and objective clarity.
- Procedural audio generated in code with no third-party audio assets.
- Data-driven level content modules for rooms, pickups, notes, doors, walls, and patrol points.
- Development-only shortcuts in local dev builds for faster testing.
- GitHub Pages deployment workflow.

## v0.3 Features

- Curated CC0 asset pass for top-down floors/walls, grunge overlays, input prompt glyphs, ambience, and enemy silhouette frames.
- Hybrid audio system with asset ambience/stingers layered under procedural threat tones.
- In-game credits screen reachable from menu or pause with `C`.
- Asset manifest for source URLs, creators, licenses, local paths, modifications, and usage notes.

## Known Limitations

- The game currently targets desktop browsers.
- Art is still a hybrid prototype style, not final hand-authored production art.
- Audio now includes real ambience assets, but the soundtrack and mix are still prototype-level.
- The current demo is one compact chapter, not a full game.
