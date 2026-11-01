# Content Maker editorial workflow

Use `studio/` and `src/editorial/` for 15–30 second explanatory reels. Existing `content/`, `scripts/conveyor/` and `src/Root.tsx` are legacy production paths; preserve them and user data.

Budget: no new paid APIs. `studio/voice.mjs` is the only new command that spends ElevenLabs quota; run it only when a voiced final render is requested and the key is configured. Never call OpenRouter from this workflow. Never publish automatically.

Roles in one pass: Researcher gathers official sources; Trend Analyst labels limited-data scores; Scriptwriter writes one central idea; Fact Checker checks claims; Art Director selects a visual metaphor; Motion Designer animates it; Audio Engineer aligns speech; Video QA measures the file and watches it. Separate AI calls are unnecessary.

Commands and schema are in `README.md` under “Editorial pipeline”. Run `python3 studio/pipeline.py validate studio/gps-offline.json` before any render. Production must have a real voice file, measured metadata and QA report. Cite claims and distinguish satellite positioning from online map loading. Update only the relevant scene component or JSON scene when revising a single beat.
