from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

import numpy as np
from scipy.signal import resample_poly

from audio_utils import TARGET_RATE, compress_internal_silence, finalize_mix, silence, trim_edge_silence, voice_master, write_wav

ROOT = Path(__file__).resolve().parents[1]
ARGS = sys.argv[1:]
CONTENT = ROOT / (ARGS[0] if len(ARGS) > 0 else "content/reel.json")
TIMELINE_OUT = ROOT / (ARGS[1] if len(ARGS) > 1 else "src/generated/timeline.json")
VOICE_OUT = ROOT / (ARGS[2] if len(ARGS) > 2 else "public/generated/voiceover.wav")
METADATA_OUT = ROOT / (ARGS[3] if len(ARGS) > 3 else "public/generated/voiceover-metadata.json")
CAPTIONS_OUT = ROOT / ARGS[4] if len(ARGS) > 4 else None

MODEL_DIR_SILERO = ROOT / "models/silero"
MODEL_DIR_PIPER = ROOT / "models/piper"
WHISPER_MODEL_DIR = ROOT / "models/whisper"
TEMP_DIR = ROOT / f"public/generated/voice-parts-{CONTENT.stem}"
FINAL_HOLD_MS = 1500

PUNCTUATION_PAUSE_MS = 90
MAX_PAGE_WORDS = 6
MIN_PAGE_WORDS = 3
MAX_PAGE_MS = 1500


def resample_to_target(audio: np.ndarray, source_rate: int) -> np.ndarray:
    if source_rate == TARGET_RATE:
        return audio.astype(np.float32)
    return resample_poly(audio, TARGET_RATE, source_rate).astype(np.float32)


def edge_fade(audio: np.ndarray, seconds: float = 0.012) -> np.ndarray:
    if not len(audio):
        return audio.astype(np.float32)
    x = audio.astype(np.float64)
    x -= np.mean(x)
    fade = min(round(TARGET_RATE * seconds), len(x) // 2)
    if fade:
        curve = np.sin(np.linspace(0, np.pi / 2, fade)) ** 2
        x[:fade] *= curve
        x[-fade:] *= curve[::-1]
    return x.astype(np.float32)


def synth_silero(data: dict) -> tuple[list[np.ndarray], list[dict]]:
    import torch
    from xml.sax.saxutils import escape

    model_path = MODEL_DIR_SILERO / f"{data['voice']}.pt"
    if not model_path.exists():
        raise SystemExit("Silero model is missing. Run npm run tts:setup first.")

    torch.set_num_threads(max(1, min(4, torch.get_num_threads())))
    model = torch.package.PackageImporter(str(model_path)).load_pickle("tts_models", "model")
    model.to(torch.device("cpu"))

    # Optional global delivery-speed control via Silero's SSML <prosody rate="..%">
    # (integer percentages only). Falls back to the plain apply_tts(text=...) path
    # when omitted, so existing content files render byte-identical to before.
    speech_rate = data.get("speechRate")

    parts: list[np.ndarray] = []
    timeline_segments: list[dict] = []
    cursor_ms = 0

    for index, segment in enumerate(data["voiceoverSegments"]):
        spoken_text = segment.get("spokenText", segment["text"])
        # Per-segment prosody makes the delivery expressive instead of flat: speed up
        # on excitement, slow down on the punchline, lift the pitch on questions.
        # Falls back to the global speechRate, then to the plain path.
        rate = segment.get("rate", speech_rate)
        pitch = segment.get("pitch")
        with torch.inference_mode():
            if rate or pitch:
                attrs = []
                if rate:
                    attrs.append(f'rate="{rate}"')
                if pitch:
                    attrs.append(f'pitch="{pitch}"')
                ssml = f'<speak><prosody {" ".join(attrs)}>{escape(spoken_text)}</prosody></speak>'
                tensor = model.apply_tts(ssml_text=ssml, speaker=data["speaker"], sample_rate=TARGET_RATE)
            else:
                tensor = model.apply_tts(text=spoken_text, speaker=data["speaker"], sample_rate=TARGET_RATE)
        audio = tensor.detach().cpu().numpy()
        # Opt-in via "trimEdgeSilence" in the content file: drops Silero's dead air at
        # segment edges (not the speech, not the configured inter-segment pauses), so
        # existing content files without the flag render byte-identical to before.
        if data.get("trimEdgeSilence"):
            audio = trim_edge_silence(audio)
        audio = edge_fade(audio)
        peak = np.max(np.abs(audio)) or 1.0
        audio = (audio * (0.88 / peak)).astype(np.float32)
        write_wav(TEMP_DIR / f"{index + 1:02}-{segment['id']}.wav", audio)
        duration_ms = round(len(audio) / TARGET_RATE * 1000)
        start_ms = cursor_ms
        end_ms = start_ms + duration_ms
        parts.extend([audio, silence(segment["pauseAfterMs"])])
        timeline_segments.append({
            "id": segment["id"],
            "text": segment["text"],
            "startMs": start_ms,
            "endMs": end_ms,
            "durationMs": duration_ms,
            "pauseAfterMs": segment["pauseAfterMs"],
        })
        cursor_ms = end_ms + segment["pauseAfterMs"]

    return parts, timeline_segments


def synth_piper(data: dict) -> tuple[list[np.ndarray], list[dict]]:
    from piper import PiperVoice, SynthesisConfig

    model_path = MODEL_DIR_PIPER / f"{data['voice']}.onnx"
    config_path = MODEL_DIR_PIPER / f"{data['voice']}.onnx.json"
    if not model_path.exists():
        raise SystemExit(f"Piper model is missing: {model_path}. Run npm run tts:setup first.")

    voice = PiperVoice.load(str(model_path), str(config_path))
    syn_config = SynthesisConfig(
        length_scale=data.get("lengthScale", 1.0),
        noise_scale=data.get("noiseScale", 0.667),
        noise_w_scale=data.get("noiseWScale", 0.8),
        normalize_audio=False,
    )

    parts: list[np.ndarray] = []
    timeline_segments: list[dict] = []
    cursor_ms = 0

    for index, segment in enumerate(data["voiceoverSegments"]):
        spoken_text = segment.get("spokenText", segment["text"])
        chunks = list(voice.synthesize(spoken_text, syn_config))
        chunk_audio = np.concatenate([c.audio_float_array for c in chunks]).astype(np.float32)
        source_rate = chunks[0].sample_rate
        audio = resample_to_target(chunk_audio, source_rate)
        # Shortens the model's own pause between sentences within one segment (e.g. the
        # three short clauses in "benefits"); the deliberate pause *between* segments,
        # which we use to let a scene breathe, is inserted separately below untouched.
        audio = compress_internal_silence(audio)
        audio = edge_fade(audio)
        peak = np.max(np.abs(audio)) or 1.0
        audio = (audio * (0.82 / peak)).astype(np.float32)
        write_wav(TEMP_DIR / f"{index + 1:02}-{segment['id']}.wav", audio)
        duration_ms = round(len(audio) / TARGET_RATE * 1000)
        start_ms = cursor_ms
        end_ms = start_ms + duration_ms
        parts.extend([audio, silence(segment["pauseAfterMs"])])
        timeline_segments.append({
            "id": segment["id"],
            "text": segment["text"],
            "startMs": start_ms,
            "endMs": end_ms,
            "durationMs": duration_ms,
            "pauseAfterMs": segment["pauseAfterMs"],
        })
        cursor_ms = end_ms + segment["pauseAfterMs"]

    return parts, timeline_segments


def tokenize(text: str) -> list[str]:
    """Split into display words, dropping tokens that are pure punctuation (e.g. a
    standalone em dash used for a spoken pause), which Whisper never transcribes."""
    return [w for w in text.split() if re.search(r"[^\W\d_]", w, re.UNICODE)]


def brand_word_groups(display_words: list[str], spoken_words: list[str]) -> list[int] | None:
    """When spokenText pronounces one display word as several ("GhostPepeBot" -> "Гост
    Пепе Бот"), figure out how many consecutive spoken words each display word consumes."""
    if len(display_words) == len(spoken_words):
        return [1] * len(display_words)
    extra = len(spoken_words) - len(display_words)
    if extra < 0:
        return None
    brand_idx = next((i for i, w in enumerate(display_words) if "ghostpepebot" in w.lower()), None)
    if brand_idx is None:
        return None
    groups = [1] * len(display_words)
    groups[brand_idx] = 1 + extra
    return groups


def proportional_word_times(segment: dict, words: list[str]) -> list[tuple[str, float, float]]:
    """Fallback: distribute a segment's *real, already-measured* duration across its
    display words, proportional to word length. Only used when the number of words
    Whisper detected inside this segment's window doesn't match the display word count
    (e.g. "GhostPepeBot" spoken as three syllables "Гост Пепе Бот")."""
    weights = []
    for word in words:
        bonus = PUNCTUATION_PAUSE_MS if re.search(r"[.,!?—-]$", word) else 0
        weights.append(len(word) + bonus / 10)
    total_weight = sum(weights) or 1
    cursor_ms = float(segment["startMs"])
    out: list[tuple[str, float, float]] = []
    for word, weight in zip(words, weights):
        word_ms = segment["durationMs"] * (weight / total_weight)
        out.append((word, cursor_ms, cursor_ms + word_ms))
        cursor_ms += word_ms
    return out


def align_words_with_whisper(voice_path: Path, timeline_segments: list[dict]) -> list[tuple[str, float, float]]:
    """Get real word-level timing from the finished audio, then map it onto our own
    display words per segment (falling back to proportional-within-segment timing only
    where Whisper's word count doesn't match, e.g. brand-name substitutions)."""
    from faster_whisper import WhisperModel

    print("Aligning captions to the final audio with faster-whisper (small, ru)...")
    model = WhisperModel("small", device="cpu", compute_type="int8", download_root=str(WHISPER_MODEL_DIR))
    segments, _info = model.transcribe(str(voice_path), language="ru", word_timestamps=True, vad_filter=True, beam_size=5)

    whisper_words: list[tuple[float, float]] = []
    for seg in segments:
        for w in seg.words or []:
            whisper_words.append((w.start * 1000, w.end * 1000))

    all_words: list[tuple[str, float, float]] = []
    for segment in timeline_segments:
        display_words = tokenize(segment["text"])
        spoken_words = tokenize(segment.get("spokenText", segment["text"]))
        if not display_words:
            continue
        lo, hi = segment["startMs"] - 150, segment["endMs"] + 150
        in_range = [w for w in whisper_words if lo <= (w[0] + w[1]) / 2 <= hi]

        groups = brand_word_groups(display_words, spoken_words)
        if groups is not None and len(in_range) == sum(groups):
            cursor = 0
            for word, group_size in zip(display_words, groups):
                grouped = in_range[cursor:cursor + group_size]
                cursor += group_size
                start_ms = max(grouped[0][0], segment["startMs"])
                end_ms = min(grouped[-1][1], segment["endMs"])
                all_words.append((word, start_ms, end_ms))
        else:
            print(f"  segment '{segment['id']}': whisper found {len(in_range)} words, expected {sum(groups) if groups else len(display_words)} -> proportional fallback")
            all_words.extend(proportional_word_times(segment, display_words))
    return all_words


def build_caption_pages(words: list[tuple[str, float, float]], timeline_segments: list[dict]) -> list[dict]:
    """Group words into TikTok-style pages that never cross a voiceover segment
    boundary, so a caption page can never switch before its phrase's audio ends."""
    seg_order = [seg["id"] for seg in timeline_segments]

    words_by_segment: dict[str, list[tuple[str, float, float]]] = {seg_id: [] for seg_id in seg_order}
    cursor = 0
    for seg in timeline_segments:
        count = len(tokenize(seg["text"]))
        words_by_segment[seg["id"]] = words[cursor:cursor + count]
        cursor += count

    pages: list[dict] = []
    for seg_id in seg_order:
        seg_words = words_by_segment[seg_id]
        if not seg_words:
            continue
        page: list[tuple[str, float, float]] = []
        for word_entry in seg_words:
            page.append(word_entry)
            page_start = page[0][1]
            page_end = word_entry[2]
            reached_max_words = len(page) >= MAX_PAGE_WORDS
            reached_soft_duration = len(page) >= MIN_PAGE_WORDS and (page_end - page_start) >= MAX_PAGE_MS
            if reached_max_words or reached_soft_duration:
                pages.append(_finalize_page(page))
                page = []
        if page:
            pages.append(_finalize_page(page))
    return pages


def build_phrase_caption_pages(timeline_segments: list[dict]) -> list[dict]:
    pages: list[dict] = []
    for index, segment in enumerate(timeline_segments):
        next_start = timeline_segments[index + 1]["startMs"] if index + 1 < len(timeline_segments) else None
        hold_ms = min(segment["pauseAfterMs"], 180)
        if next_start is not None:
            end_ms = min(segment["endMs"] + hold_ms, next_start)
        else:
            end_ms = segment["endMs"] + hold_ms
        duration_ms = max(900, end_ms - segment["startMs"])
        if next_start is not None:
            duration_ms = min(duration_ms, max(1, next_start - segment["startMs"]))
        pages.append({
            "text": segment["text"],
            "startMs": segment["startMs"],
            "durationMs": duration_ms,
            "tokens": [{"text": segment["text"], "fromMs": segment["startMs"], "toMs": segment["startMs"] + duration_ms}],
        })
    return pages


def _finalize_page(page: list[tuple[str, float, float]]) -> dict:
    tokens = []
    for i, (word, start_ms, end_ms) in enumerate(page):
        prefix = "" if i == 0 else " "
        tokens.append({"text": f"{prefix}{word}", "fromMs": round(start_ms), "toMs": round(end_ms)})
    return {
        "text": " ".join(w for w, _, _ in page),
        "startMs": round(page[0][1]),
        "durationMs": round(page[-1][2] - page[0][1]),
        "tokens": tokens,
    }


def main() -> None:
    data = json.loads(CONTENT.read_text(encoding="utf-8"))
    provider = data.get("ttsProvider", "silero")
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    TIMELINE_OUT.parent.mkdir(parents=True, exist_ok=True)

    if provider == "piper":
        parts, timeline_segments = synth_piper(data)
        combined = voice_master(np.concatenate(parts))
    elif provider == "silero":
        parts, timeline_segments = synth_silero(data)
        combined = finalize_mix(np.concatenate(parts))
    else:
        raise SystemExit(f"Unknown ttsProvider: {provider}")

    write_wav(VOICE_OUT, combined)
    voice_duration_ms = round(len(combined) / TARGET_RATE * 1000)
    final_hold_ms = data.get("finalHoldMs", FINAL_HOLD_MS)
    total_duration_ms = voice_duration_ms + final_hold_ms
    timeline = {
        "fps": data["fps"],
        "width": data["width"],
        "height": data["height"],
        "ttsProvider": provider,
        "voice": data["voice"],
        "speaker": data.get("speaker"),
        "voiceDurationMs": voice_duration_ms,
        "finalHoldMs": final_hold_ms,
        "totalDurationMs": total_duration_ms,
        "durationInFrames": int(np.ceil(total_duration_ms / 1000 * data["fps"])),
        "segments": timeline_segments,
    }
    TIMELINE_OUT.write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")
    METADATA_OUT.write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")

    if CAPTIONS_OUT is not None:
        if data.get("captionMode") == "phrase":
            pages = build_phrase_caption_pages(timeline_segments)
        elif provider == "piper":
            words = align_words_with_whisper(VOICE_OUT, timeline_segments)
            pages = build_caption_pages(words, timeline_segments)
        else:
            words = []
            for segment in timeline_segments:
                words.extend(proportional_word_times(segment, tokenize(segment["text"])))
            pages = build_caption_pages(words, timeline_segments)
        CAPTIONS_OUT.parent.mkdir(parents=True, exist_ok=True)
        CAPTIONS_OUT.write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding="utf-8")

    shutil.rmtree(TEMP_DIR, ignore_errors=True)
    print(f"{provider} voiceover: {VOICE_OUT} ({voice_duration_ms / 1000:.2f}s); reel: {total_duration_ms / 1000:.2f}s")


if __name__ == "__main__":
    main()
