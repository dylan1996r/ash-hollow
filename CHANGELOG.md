# Changelog

## v0.3.0 - Asset Polish

- Added a curated CC0 asset pipeline under `public/assets/vendor/`.
- Added asset manifest metadata and project credits for third-party assets and AI transparency.
- Integrated top-down floor/wall tiles, grunge horror overlays, Kenney input prompt glyphs, and selected enemy silhouette frames.
- Extended audio from procedural-only to a hybrid system with asset ambience/stingers plus procedural threat tones.
- Added an in-game credits screen available from the menu or pause screen with `C`.
- Preserved the existing room/collision data and chapter progression.

## v0.2.0 - Public Demo Hardening

- Extracted content types, level data, event names, runtime config, and procedural audio into focused modules.
- Added procedural horror audio: ambience, radio/threat tones, interaction cues, footsteps, damage, death, shift, and completion sounds.
- Added audio controls: `M` toggles mute, `,` lowers volume, and `.` raises volume.
- Improved objective text, locked-door feedback, pickup feedback, pause UI, and public-demo HUD status.
- Tuned The Bent Attendant for fairer chase speed, damage cadence, and search recovery.
- Improved procedural visuals with denser fog, ash drift, stronger flashlight readability, room dressing, and shift effects.
- Added development-only shortcuts for faster testing in local dev builds.
- Added GitHub Pages deployment workflow and production base-path configuration.

## v0.1.0 - Initial Prototype

- Created the first playable Ash Hollow Clinic District prototype.
- Added movement, flashlight, fog, inventory, notes, locked progression, three fuses, one enemy, death, and chapter completion.
