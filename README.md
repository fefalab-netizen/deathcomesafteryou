# Dead Lot — milestone 01

A build-free, browser-native 3D zombie combat sandbox. Landscape touch controls on phones; mouse and keyboard on desktop. Uses the actual articulated mannequin and authored animations extracted from your SpriteForge Studio Packs project, with new character colors and geometry inspired by the three supplied palette boards.

## Upload to GitHub Pages

Upload `index.html`, `style.css`, the entire `js` directory, and `.nojekyll` to your repository root. In GitHub's repository **Settings → Pages**, choose **Deploy from a branch**, select your branch and **/(root)**, then save. Open the published Pages URL after GitHub finishes deploying. No npm installation, build command, API key, CDN JavaScript, or backend is needed. All game paths are relative and support repository subpaths.

The optional Google Fonts stylesheet falls back to installed fonts when offline. Game geometry and animations are local code. A static HTTP server is needed for local use because the game uses ES modules; opening `index.html` with `file://` is not supported.

## Controls

| Action | Desktop | Phone (landscape) |
| --- | --- | --- |
| Move | WASD / arrow keys | Left stick |
| Aim | Mouse | Right stick |
| Fire | Hold left mouse | Hold right stick away from center |
| Reload | R | Reload button |
| Run | Shift | Full movement stick (standard speed) |
| Pause | Esc / pause button | Pause button |

Start a run, explore freely, then press **Start wave**. Waves are manual unless Endless is enabled in the starting menu. Wave size grows by three per wave. At most 60 enemies are active at once; remaining enemies enter as space opens. Ammunition reserves are unlimited, but the magazine holds 12 rounds. Zombies take two shots. Cars and barriers block movement and shots. Returning from a background tab requires resuming; portrait orientation displays a rotate screen.

## Included

- Fixed-angle orthographic 3D camera following the survivor.
- SpriteForge movement, aiming, recoil, hit and attack poses; adapted death fall and reload pose.
- Olive jacket, denim, backpack, hair, and sidearm; pale infected with stained shirts.
- Parking bays, static cars, concrete barriers, maintenance shed, dumpster, streetlights, cones, and weeds.
- Shared grid routing with local separation for zombies, ray-based shooting, health, reload, death and restart.
- Manual / endless waves, population and quality settings, FPS display.
- Batched WebGL rendering and cached character animation geometry. No game engine dependency.

## Files

- `js/spriteforge.js` — extracted original rig, inverse kinematics, authored animation library and supporting math. The original SpriteForge HTML is untouched.
- `js/render.js` — WebGL batching, primitive meshes, character styling, animation geometry cache, camera.
- `js/world.js` — parking lot, collision shapes, shared navigation field, ray/obstacle intersection.
- `js/game.js` — inputs, combat, waves, UI and frame loop. Tuning constants are near the top.

## Status / boundaries

**Coded, not tested or uploaded**, as requested. No browser, runtime, automated, or device tests have been run. Performance targets are not yet verified. Share device/browser, chosen quality, visible FPS, and what happened when reporting issues.

This is a combat sandbox: no settlement construction, interiors, driving, inventory, story, persistence, or multiplayer yet. Progress resets on reload. It has a fixed arena and no world streaming. Some original pose samples and the adapted reload/death motion are provisional; directional locomotion blending is a later polish task.

## Asset provenance

The model is procedural articulated geometry, not a sprite sheet or a skinned GLB. This build reuses the original SpriteForge authored animation library; the separate 86-clip Quaternius bundles are not included in this lightweight build. Those can be integrated later when specific actions need them. Reference PNGs are used as visual direction and are not distributed with this build. See `CREDITS.md`.
