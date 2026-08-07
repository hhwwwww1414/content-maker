from __future__ import annotations

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content/reel.json"
MODEL_DIR = ROOT / "models/silero"
MODEL_URL = "https://models.silero.ai/models/tts/ru/v5_5_ru.pt"


def main() -> None:
    config = json.loads(CONTENT.read_text(encoding="utf-8"))
    if config.get("ttsProvider") != "silero":
        raise SystemExit("content/reel.json must use ttsProvider=silero")
    model = MODEL_DIR / f"{config['voice']}.pt"
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    if model.exists() and model.stat().st_size > 1_000_000:
        print(f"Silero model already available: {model}")
        return
    temporary = model.with_suffix(".download")
    print(f"Downloading local Silero model {config['voice']}...")
    try:
        urllib.request.urlretrieve(MODEL_URL, temporary)
        temporary.replace(model)
    except Exception as exc:
        temporary.unlink(missing_ok=True)
        raise SystemExit(f"Could not download Silero model from {MODEL_URL}: {exc}") from exc
    if model.stat().st_size <= 1_000_000:
        raise SystemExit(f"Downloaded Silero model is unexpectedly small: {model}")
    print(f"Downloaded: {model}")


if __name__ == "__main__":
    main()
