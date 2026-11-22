# Video quality checklist

An MP4 existing proves nothing. `node studio/gates.mjs <project> --mode=preview|production` writes `out/studio/<id>-<mode>-gates.json` and `.md`. Every failure names its scene and frame. `reel.mjs run` calls it automatically and stops on a failure with exit code 5.

## The seven gates

| Gate | Automated checks | Source |
|---|---|---|
| Technical | Spec valid, dimensions, fps, H.264, duration, scene timing, complete decode, no black or blank frames, approval status, sources | `spec-check`, `qa.mjs`, stills |
| Typography and layout | Overflow, text outside safe area, size below 30 px after camera scale, collisions, caption size, contrast of each text from its own pixels | `LayoutGuard` in collect mode, stills every 0.5 s and after each cue |
| Animation continuity | No stage still for more than 2 s, 85% of cues have motion, no flashes (a jump that comes back within 4 frames) | `qa.mjs`, every frame decoded |
| Audio sync | Caption text and timing, speech inside 95% of words, caption contrast, -20 to -12 LUFS, true peak, no clipping, cue and density rules, Whisper against subtitles (production) | `qa.mjs`, `sync-check.py` |
| Composition | Largest primary element covers at least 5% of the frame. Warnings: detail in under 10% of the frame, a layout like the previous scene, palette and transition repetition | Stills |
| Assets | In the manifest, on disk, licensed, attribution present. Warning: enlarged above ×1.6 | `manifest.json` |
| Export | Size, frame rate, `yuv420p`, `bt709` tag, audio stream, bitrate, file size | `ffprobe` |

Composition numbers are proxies. They catch emptiness and repetition. They do not measure beauty, so a passed gate still needs a person.

## Human review before publishing

Run `node studio/sheet.mjs <project> --mobile`, then **watch the video** on a phone with sound.

**Each scene**

- [ ] One clear focal point, seen first
- [ ] The picture says something the words do not, rather than illustrating a word
- [ ] Nothing on screen is small in the middle of emptiness
- [ ] Text reads at phone size in the time the scene gives

**The reel**

- [ ] The first frame works as a thumbnail
- [ ] Compositions and palettes vary with the story, not randomly
- [ ] Each transition has a reason; hard cuts where the word is the turn
- [ ] Movement follows the voice
- [ ] It does not look like slides

**Sound**

- [ ] Natural intonation, no artifacts
- [ ] Music and effects sit under the voice, and the synthesised beds are acceptable to you
- [ ] Effects land on the action

**Truth**

- [ ] Every claim has a read source in `sources`; `editorialReview.openClaims` is empty or accepted
- [ ] Image credits from `node studio/assets.mjs credits <project>` are in the post
- [ ] Illustrative screens do not imitate a real company's interface or brand

Record the result in `out/studio/<id>-manual-review.json`.

## Fixing failures

Never relax a limit to get a pass. Change the scene, or report that the script needs to change.

| Message | Usual fix |
|---|---|
| `Text does not fit` | Shorten it, or use `/` for explicit lines |
| `Text outside safe area` | Use `useRegion()`, reduce a device pose, or lower a camera key |
| `Overlap X × Y` | Move a piece. Only a stamp may overlap on purpose |
| `Font ... below 30px` | Scale the device up, or shorten the text |
| `textContrast` | Change the palette or plate, or add a scrim |
| `noFrozenStage` with `longestStaticScene` | Add a camera key on a word in that window, or use a moving field |
| `motionOnCues`, `missed` | The named cue changes nothing visible: tie something to it or remove it |
| `density` | Cut on-screen text, or merge beats |
| `spec:cue` | Use a word that is really spoken in that scene |
