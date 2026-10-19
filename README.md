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

Start outside the lot on the south approach. Explore the roads, yards and ruined workshop, then follow the northbound road into the gold arena square on the minimap. Crossing into the original parking lot starts wave 1 automatically. Follow-up waves are automatic by default, with a three-second break. Uncheck the menu option for manual follow-up waves. Leaving the arena does not reset the encounter: active enemies pursue through the district. After clearing a wave outside the arena, return inside to resume the countdown.

## District pass 03 — harder horde

- Playable bounds expanded from 46 × 46 to 160 × 160 world units (about 12 times the area).
- Connected roads, closed building shells, motor yard, freight containers and a walk-through ruined workshop. Most buildings are exterior-only.
- District labels, minimap, approach arrows and an arena threshold marker.
- Normal: 4 shots / speed 1.85; runner: 4 / 2.8; worker: 8 / 1.7; crawler: 5 / 1.85; brute: 18 / 1.35. Speed is in world units/second before variation, wave scaling or abilities.
- Shorter attack wind-ups, recoveries and stagger. Runner burst wind-up is 0.22 seconds; cooldown is 1.6 seconds. Arrival intervals tighten with each wave; active enemy cap remains 60.
- District-wide navigation and collision bounds support pursuit outside the original arena.
- No runtime or device tests performed, per the user's workflow. This is an authored district expansion, not yet a streamed world or a decay simulation.
## Combat pass 02

Five types now appear progressively, with at least one of each unlocked type in every wave:

| Type | First wave | Behavior |
| --- | --- | --- |
| Shambler | 1 | Steady pursuit and close-range swipe |
| Runner | 2 | Flanking approach, crouched wind-up, committed speed burst |
| Worker | 3 | Helmet and safety vest; resilient to stagger and stronger attacks |
| Crawler | 4 | Low dragging silhouette; ankle attacks slow the player temporarily |
| Brute | 5 | Large silhouette, long attack wind-up, heavy damage and knockback |

Gun visuals now use an aligned sidearm, barrel-origin muzzle flash, short moving tracers and impact flecks. Mouse aim uses a torso-height plane. Locomotion uses interpolated source poses, distance-driven animation time, and directional foot placement relative to hips, with pelvis and feet facing the torso; reload and recoil have their own timing. Character details include backpack straps, eye sockets, teeth, helmet, vest and varied proportions. Parked vehicles now include SUV, pickup, panel van and police car silhouettes with round tires, glass, grilles, mirrors, rust and trim. The camera remains unchanged.

New balance values live in `js/zombies.js`. Include that file when updating your GitHub upload. This pass has not been run or tested; the user owns playtesting and publishing.

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

This is a combat sandbox: no settlement construction, interiors, driving, inventory, story, persistence, or multiplayer yet. Progress resets on reload. It has a fixed explorable district containing the arena and no world streaming. Some original pose samples and the adapted reload/death motion are provisional; locomotion transitions remain subject to user playtesting.

## Asset provenance

The model is procedural articulated geometry, not a sprite sheet or a skinned GLB. This build reuses the original SpriteForge authored animation library; the separate 86-clip Quaternius bundles are not included in this lightweight build. Those can be integrated later when specific actions need them. Reference PNGs are used as visual direction and are not distributed with this build. See `CREDITS.md`.



## Movement correction — pass 04

- Fixed the pose-cache key to distinguish idle, walking and reaction clips; they can no longer reuse each other's geometry.
- Removed independent lower-body rotation. Directional steps reposition IK foot targets around fixed hips, keeping the legs attached and the feet facing with the torso.
- Normalized combined direction inputs; animation advances with actual distance moved, including sliding along obstacles. Opposing inputs cancel and blocked movement returns to idle.
- Backward movement is 60% of forward walking speed; sideways movement is 90%, with proportional diagonal speeds. Backward sprint is disabled.
- Camera and phone aiming behavior are unchanged. No runtime or device tests run, per the agreed workflow.

## Angular model and animation pass 05

Character geometry now uses square limbs, hands and boots, plus clipped-corner heads, torsos and pelvises. Helmets and brute bodies use flat-faced geometry. Round vehicle tires remain round.

Code corrections: distinct idle/walking clocks; action poses keep their locomotion phase; hit reactions are no longer overwritten by aim or zombie styling; zombie reactions play across their stagger duration; stationary attackers no longer cycle walking feet; final death poses reach their terminal sample and settle above the ground. Crawler death preserves the low posture. Reload and recoil reposition the hand-held gun, and muzzle position comes from the rendered gun transform. Reload returns toward the aiming pose, and the attack strike is timed to its damage phase.

Upload `js/render.js`, `js/game.js`, and `js/spriteforge.js` together. Code changes and source inspection only: no runtime, automated or device tests were performed. Visual correctness still needs the user's uploaded playtest.
