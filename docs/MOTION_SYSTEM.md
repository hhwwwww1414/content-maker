# Motion system

All motion is a pure function of `(frame, fps)` in `src/editorial/engine/motion/core.ts`. There is no CSS animation, no timer and no `Math.random`, so any frame renders the same on its own. Durations are seconds, so a scene holds at 30 and 60 fps; a test compares them.

## Clock

`useShot()` inside a scene gives:

| Value | Meaning |
|---|---|
| `frame`, `fps`, `t` | Frame 0 is the scene's first spoken word. Negative during the incoming transition |
| `start(cue, fallback)` | Frame of a spoken word (`"снял"`, `"кадр#2"`) or of seconds from the scene start |
| `spring(cue, preset?, delay?, fallback?)` | Spring progress, in the story's pacing unless a preset is named |
| `tween(cue, seconds, ease?, delay?, fallback?)` | Timed progress, clamped to 0–1 |
| `camera`, `profile`, `palette`, `art`, `direction`, `assets` | Current shot state |

A cue that is not spoken in the scene throws. A silent miss would desync the reel.

## Presets

- **Eases:** `linear`, `out`, `outSoft`, `in`, `inOut`, `expoInOut`, `back`, `anticipate`, `quint`, `camera`.
- **Springs:** `settle`, `soft`, `snap`, `pop`, `bounce`, `heavy`, `camera`, and the keynote family from `appleSpring(duration, bounce)`: `smooth`, `crisp`, `lively`, `hero`, `glide`. Controlled overshoot comes only from `pop`, `bounce` and `lively`.
- **Entrances** (`entrance(name, p)`): `rise`, `mask`, `pop`, `slideL`, `slideR`, `drop`, `blur`, `fade`, `track`, `unfold`, `focus` (pass the font size as distance).
- **Pacing profiles** (`fluid`, `snappy`, `weighty`, `calm`, `keynote`) choose springs, stagger, drift and handheld. An art direction names one; `project.art.motion` or `direction.art.motion` overrides it.

`studio/lab.mjs boards` shows all of them, and `Lab-Motion-60` shows them at 60 fps.

## Camera

`cameraAt()` is one deterministic camera per scene: a base move (`still`, `pushIn`, `pullOut`, `panLeft`, `panRight`, `tiltUp`, `tiltDown`, `driftUp`) plus keys on spoken words, plus optional handheld from composite sines.

```json
"camera": {"move": "pushIn", "handheld": 1, "keys": [{"cue": "адрес", "scale": 1.1, "seconds": 1}]}
```

**Parallax.** `<Depth z={-0.5}>` puts children on a plane moving `1 + z` times the camera. Backgrounds sit at -0.5, text at about -0.45, foreground cutouts above 0.

**Safe area under a push.** `planeGrowth(camera, z)` is the largest size a plane reaches. Type and counters are fitted to `width / growth`, so a push cannot carry them out of the safe area.

**Device poses, 3D cameras and tracking.** `device.poses` tilt and zoom the phone on words. In `stage3d` each preset has its own camera path, and `labels` project a 3D anchor to the DOM every frame. `media` callouts are given in image coordinates and follow the image through its move.

## Masks, morphs, blur

- Reveal masks use a clipping line box or `clip-path`.
- `shapes.circle/rect/diamond` are resampled to the same point count, so `morph(a, b, p)` works between any pair; `toPath` and `toPolygon` turn them into SVG or CSS.
- **Motion blur** is directional and per transition: `push` uses an SVG directional Gaussian tied to its speed. `through` and `depth` use a scalar blur. Full sub-frame motion blur is not implemented; see the limitations in `AI_VIDEO_CREATION_GUIDE.md`.

## Transitions: `engine/transitions/Transitions.tsx`

A transition is centred on the new scene's first spoken word. Scenes overlap visually while each keeps its voice-derived clock, so a transition cannot change the timeline.

| Type | Use it when | Parameters |
|---|---|---|
| `cut` | The word itself is the turn. Prefer it often | |
| `push` | One thought pushes the next, without a pause | `direction`, `seconds` |
| `through` | The camera enters something in the frame | `origin` |
| `mask` | A shape in the frame opens onto the next scene | `shape` (`circle`, `diamond`, `diagonal`, `bars`, `rise`), `origin` |
| `field` | Colour continuity: the next ground grows from a point | `origin` |
| `morph` | Shape continuity: an element becomes the frame, or the next element | `from`, `to`, `color`, `radius` |
| `glyph` | Text to picture: the next scene appears through a letter that flies at the lens | `glyph` |
| `depth` | A step forward: the old scene recedes, the new one arrives from in front | |

Every non-cut transition should state `intent`. The same non-cut type twice in a row fails validation. Reserve `glyph` for flat grounds, since it paints the previous palette's background.

Devices without their own `enterCue` are already on stage when a transition opens, so a reveal never shows an empty ground and then a dark object: that was measured as a real flash.

## Frame rate

Pass `--fps=60` to `studio/render.mjs` for a 60 fps render of the same project. Word timings are in milliseconds and all choreography is in seconds. See the measured cost in `AI_VIDEO_CREATION_GUIDE.md`.
