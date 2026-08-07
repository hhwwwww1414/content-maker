from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from scipy.signal import resample_poly

from audio_utils import TARGET_RATE, compress_internal_silence, finalize_mix, silence, voice_master, write_wav

ROOT = Path(__file__).resolve().parents[1]
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
FLAGS = {a for a in sys.argv[1:] if a.startswith("--")}
CONTENT = ROOT / (ARGS[0] if len(ARGS) > 0 else "content/reel.json")
OUT_DIR = ROOT / (ARGS[1] if len(ARGS) > 1 else "out/voice-preview")
PROVIDER = "piper" if "--piper" in FLAGS else "silero"

MODEL_DIR_SILERO = ROOT / "models/silero"
MODEL_DIR_PIPER = ROOT / "models/piper"
SEGMENT_PAUSE_MS = 220


def preview_piper(data: dict) -> None:
    """Preview every Piper model present in models/piper/, using the same synthesis and
    mastering chain as the real pipeline so a sample sounds like the finished reel."""
    from piper import PiperVoice, SynthesisConfig

    models = sorted(MODEL_DIR_PIPER.glob("*.onnx"))
    if not models:
        raise SystemExit(f"No Piper models found in {MODEL_DIR_PIPER}.")
    print(f"piper voices: {', '.join(m.stem for m in models)}")

    syn_config = SynthesisConfig(
        length_scale=data.get("lengthScale", 1.0),
        noise_scale=data.get("noiseScale", 0.667),
        noise_w_scale=data.get("noiseWScale", 0.8),
        normalize_audio=False,
    )

    for model_path in models:
        voice = PiperVoice.load(str(model_path), str(model_path.with_suffix(".onnx.json")))
        parts: list[np.ndarray] = []
        for segment in data["voiceoverSegments"]:
            spoken_text = segment.get("spokenText", segment["text"])
            chunks = list(voice.synthesize(spoken_text, syn_config))
            chunk_audio = np.concatenate([c.audio_float_array for c in chunks]).astype(np.float32)
            source_rate = chunks[0].sample_rate
            audio = chunk_audio if source_rate == TARGET_RATE else resample_poly(chunk_audio, TARGET_RATE, source_rate).astype(np.float32)
            parts.extend([compress_internal_silence(audio), silence(SEGMENT_PAUSE_MS)])
        combined = voice_master(np.concatenate(parts))
        out_path = OUT_DIR / f"{model_path.stem}.wav"
        write_wav(out_path, combined)
        print(f"  {model_path.stem}: {out_path} ({len(combined) / TARGET_RATE:.2f}s)")


def main() -> None:
    data = json.loads(CONTENT.read_text(encoding="utf-8"))

    if PROVIDER == "piper":
        preview_piper(data)
        return

    import torch

    model_path = MODEL_DIR_SILERO / f"{data['voice']}.pt"
    if not model_path.exists():
        raise SystemExit("Silero model is missing. Run npm run tts:setup first.")

    torch.set_num_threads(max(1, min(4, torch.get_num_threads())))
    model = torch.package.PackageImporter(str(model_path)).load_pickle("tts_models", "model")
    model.to(torch.device("cpu"))

    # The model is the source of truth for the speaker catalogue, so a model update
    # surfaces new voices here without editing this script.
    speakers = list(model.speakers)
    print(f"{data['voice']} speakers: {', '.join(speakers)}")

    for speaker in speakers:
        parts: list[np.ndarray] = []
        for segment in data["voiceoverSegments"]:
            spoken_text = segment.get("spokenText", segment["text"])
            with torch.inference_mode():
                tensor = model.apply_tts(text=spoken_text, speaker=speaker, sample_rate=TARGET_RATE)
            parts.extend([tensor.detach().cpu().numpy(), silence(SEGMENT_PAUSE_MS)])
        combined = finalize_mix(np.concatenate(parts))
        out_path = OUT_DIR / f"{data['voice']}-{speaker}.wav"
        write_wav(out_path, combined)
        print(f"  {speaker}: {out_path} ({len(combined) / TARGET_RATE:.2f}s)")


if __name__ == "__main__":
    main()
