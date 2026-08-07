"""Proof-of-concept preview for Chatterbox Multilingual TTS.

Runs in its own environment (.venv-chatterbox) because Chatterbox pins torch 2.6 while
the production pipeline is pinned to torch 2.7 CPU. Nothing here is wired into the reel
build yet -- it only renders sample WAVs so a voice/reference/exaggeration combination
can be judged before committing to a third ttsProvider.

Usage:
    .venv-chatterbox/Scripts/python.exe scripts/preview_chatterbox.py [content.json] [ref.wav ...]
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
FLAGS = {a for a in sys.argv[1:] if a.startswith("--")}

CONTENT = ROOT / (ARGS[0] if ARGS else "content/reel.json")
REFERENCES = [ROOT / a for a in ARGS[1:]] or sorted((ROOT / "refs/voice-ref").glob("ref-*.wav"))
OUT_DIR = ROOT / "out/voice-preview"
LANGUAGE_ID = "ru"
SEGMENT_PAUSE_MS = 220

# Sweep the emotional-intensity knob: 0.5 is the model default, higher pushes towards the
# animated delivery we want. cfg_weight is lowered as exaggeration rises because Resemble
# note that high exaggeration speeds speech up, and a lower cfg compensates by slowing it.
SETTINGS = [
    ("e05", 0.5, 0.5),
    ("e07", 0.7, 0.4),
    ("e09", 0.9, 0.3),
]


def main() -> None:
    import torch
    import torchaudio as ta
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    if not REFERENCES:
        raise SystemExit("No reference clips found in refs/voice-ref/.")
    for reference in REFERENCES:
        if not reference.exists():
            raise SystemExit(f"Reference clip is missing: {reference}")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"torch {torch.__version__} on {device}")
    if device == "cpu":
        print("WARNING: running on CPU, expect minutes per segment.")

    data = json.loads(CONTENT.read_text(encoding="utf-8"))
    segments = data["voiceoverSegments"]

    model = ChatterboxMultilingualTTS.from_pretrained(device=device)
    pause = torch.zeros(1, int(model.sr * SEGMENT_PAUSE_MS / 1000))

    for reference in REFERENCES:
        for label, exaggeration, cfg_weight in SETTINGS:
            started = time.monotonic()
            parts = []
            for segment in segments:
                # spokenText carries the phonetic spelling of brand names ("Гост Пепе Бот"),
                # exactly as the Silero and Piper paths already use it.
                text = segment.get("spokenText", segment["text"])
                wav = model.generate(
                    text,
                    language_id=LANGUAGE_ID,
                    audio_prompt_path=str(reference),
                    exaggeration=exaggeration,
                    cfg_weight=cfg_weight,
                )
                parts.extend([wav.cpu(), pause])
            combined = torch.cat(parts, dim=1)
            out_path = OUT_DIR / f"chatterbox-{reference.stem}-{label}.wav"
            out_path.parent.mkdir(parents=True, exist_ok=True)
            ta.save(str(out_path), combined, model.sr)
            duration = combined.shape[1] / model.sr
            print(f"  {out_path.name}: {duration:.2f}s (rendered in {time.monotonic() - started:.0f}s)")


if __name__ == "__main__":
    main()
