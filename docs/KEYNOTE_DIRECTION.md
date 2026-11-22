# Keynote direction

A product-film look for reels that must feel expensive: one lit hero, huge tight type, words that come out of focus, motion that lands without bounce. Principles, not a brand: no Apple logos, products or fonts (SF Pro's licence covers Apple-platform UI only).

Reference reels: `studio/projects/gta6-keynote.json` (pure type and numbers) and `studio/projects/vin2win-palisade-keynote.json` (real product screens).

## Turn it on

```json
"art": {"direction": "keynote", "music": {"asset": "bed-pulse", "volume": 0.1, "duck": 0.5}}
```

`keynote` sets: palettes `base` (black stage), `inverse` (#F5F5F7 stage), `block` (midnight); Inter Tight; field `stage`; motion profile `keynote`; emphasis `gradient`.

## What it adds to the engine

| Piece | Where | Use |
|---|---|---|
| `appleSpring(duration, bounce)` | `motion/core.ts` | SwiftUI-style spring: mass 1, stiffness from duration, damping from bounce. Presets `smooth` (0.5 s, 0), `crisp` (0.38, 0.12), `lively` (0.5, 0.3), `hero` (1.0, 0), `glide` (1.6, 0) |
| Ease `quint`, `camera` | `motion/core.ts` | Blur-slide reveal; long even camera moves |
| Camera move `creep` | `motion/core.ts` | 4 % push on the camera ease. Never a constant-speed zoom |
| Entrance and reveal `focus` | `motion/core.ts`, `type/Headline.tsx` | y 0.38 em, blur 10 % of size, opacity on one progress; words 4 frames apart, a 0.2 s breath per line, the accented word lands last |
| Emphasis `gradient` | `type/Headline.tsx` | The accent word fills with accent → accent2, left to right, after it lands |
| Field `stage` | `fx/Field.tsx` | One soft key from above, a pool of light where the hero stands, haze in the beam |
| `keynoteBlink` | `scenes/custom/Keynote.tsx` | Fast type: one phrase per spoken word, hard cuts. `invert` flips to the light stage, `hero` settles and sweeps its gradient, `asset` shows a wordmark with an optional `under` line |
| `keynoteStat` | same | A number on a glass card under coloured light; rolls on `cue`, lands on `landCue`, label and note come out of focus |
| `keynotePhone` | same | A real screen (image or video) in a lit phone: rises on `hero`, rim light runs once, `focus` pushes into a region of the screen, glass `chips` carry the spoken numbers |
| `captionDisplay` | project root | On-screen spelling of spoken words: `{"from": "вин ту вин", "to": "VIN2WIN"}`. Voice and timing are untouched |
| `audio.whisperHint` | project audio | Brand names for the Whisper sync check, which then also asks for numbers in words. Opt-in: a hint changes how Whisper hears everything |
| Private assets | `public/private/manifest.json` | Unpublished product screens. Git ignores the folder; the entries merge in at read time and never reach the tracked manifest |

## Rules that make it work

From the shotcraft aesthetic rules (`vendor/video-shotcraft/references/aesthetic-rules.md`) and the research page:

- **One hero per frame.** If two things compete, cut one.
- **Frame 0 carries the hook.** No fade from black, no logo first.
- **Change the picture every 1.5–2.5 s**: a new beat, a scale step, an inversion. Hold on the hero between changes.
- **No more than three full-frame hits** per reel (R4). Everything else moves an element.
- **No handheld** on bright stages (Q3).
- **A rim light or sheen once per hero**, clipped to its shape (Q4).
- **Real screens, not drawn ones** (Q1). Product screens go in `public/private/` when they are not public.
- **Camera keys need a plane.** A custom shot that ignores the camera makes `motionOnCues` fail: put content in `<Depth>`.
- **Mark only what is moving.** `data-qa-moving` on a whole card hides it from the composition gate until its last word lands.
- **Glass over coloured light** needs a dark underlay, or small text drops below 4.5:1.

## Known limits

- The ₽ unit on `keynoteStat` reads small next to a 6-digit number; size it by eye.
- A `field` transition between two black stages paints black frames: use `cut` there.
- The `block` palette (midnight blue) is the least distinctive; prefer `base` and `inverse` and keep `block` for one beat.
- No glTF loader yet: a 3D hero still needs a custom scene or a real photo.
