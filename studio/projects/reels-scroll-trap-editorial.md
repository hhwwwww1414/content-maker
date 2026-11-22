# Reels scroll trap — editorial decision sheet

## Hook candidates

| Candidate | Recognition | Curiosity | Spoken Russian | Opening image | Decision |
| --- | --- | --- | --- | --- | --- |
| «Ты открыл Reels на минуту. Как уже прошло полчаса?» | Immediate everyday situation | Time jump demands an answer | Natural | Phone and clock collide in one frame | **Chosen**: clearest emotional entry |
| «У следующего ролика есть одна хитрость: ты ещё не знаешь, какой он» | Familiar after context | Strong | Slightly abstract | Hidden card reveal | Better for explanation than opening |
| «Почему палец листает раньше, чем ты решил?» | Recognizable automatic gesture | Strong | Natural | Thumb moves on its own | Risks overstating loss of control |
| «У книги есть последняя страница. А у Reels?» | Moderate | Strong | Natural | Book folds into feed | Best reserved for the turn |
| «Скучно? Свайп. Интересно? Тоже свайп.» | Strong rhythm | Moderate | Natural | Two radically different clips | Could imply all viewers behave the same way |
| «Что держит тебя в ленте: ролик или следующий ролик?» | Moderate | Strong | Natural | Two stacked phone screens | More cerebral than the chosen hook |

These are editorial judgments, not measured performance predictions.

## Visual direction

Culture art direction, with charcoal, warm off-white and one coral accent. A large illustrative phone owns frame one. The camera enters its feed, which changes from a physical object to a descending corridor of unseen clips. Recommendations appear as a family of related frames. The corridor then meets a book's literal last page. A cut to stillness lets the final line end on a single point. The beat sequence uses device → journey → device → timeline → split → type; transitions follow the movement of the feed and reserve a hard cut for the book comparison.

The phone screen uses invented content and no Instagram branding. Visual elements are procedural and typography uses vendored fonts. The final cut uses a quiet pulse bed and sparse, original sound effects under the narration. The music drops for the last stillness. The measured duration is 27.35 seconds.

## Claim boundaries

- «Полчаса» is a relatable example, not a prevalence statistic or measured average.
- Uncertainty about the next clip is supported by Wang et al. (2026), but that study uses a survey and does not isolate a single causal mechanism.
- Meta describes watch duration and similar prior interactions among signals used by its recommendation systems. The script does not claim the system can read thoughts.
- APA describes rapid transitions and autoplay as features that can extend viewing, and reports an expert explanation of missing stopping cues. The book comparison is a visual metaphor.
- No claim about dopamine spikes, brain damage or universal clinical addiction is made.

## Production record

The user approved the script, factual basis and one final ElevenLabs generation. `studio/reel.mjs approve` recorded script approval and fact review in the project JSON. The ElevenLabs subscription check redirected to a geo-restriction page before a synthesis request could be sent; no ElevenLabs audio was generated or quota spent. To complete the deliverable, the unchanged approved script was voiced locally with the macOS Russian `Milena` voice. Word timing was measured with local speech recognition and applied to the six directed-engine scenes, captions and cues. The local voice has less natural expression than the intended ElevenLabs voice.

The production render is `out/studio/reels-scroll-trap.mp4` (1080×1920, 30 fps, 27.35 s). Contact sheets are `out/studio/reels-scroll-trap-sheet.jpg` and `out/studio/reels-scroll-trap-mobile.jpg`. The QA report is `out/studio/reels-scroll-trap-production-qa.json`; all seven gate groups pass in `out/studio/reels-scroll-trap-production-gates.md`. Visual regression passes for all six scenes. The file was inspected through still frames and motion frame strips, but a person still needs to watch and listen to the complete video, ideally on a phone, before publication. Publication remains draft.
