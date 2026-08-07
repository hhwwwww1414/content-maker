from __future__ import annotations

from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

TARGET_RATE = 48_000


def read_mono(path: Path, target_rate: int = TARGET_RATE) -> np.ndarray:
    audio, rate = sf.read(path, dtype="float32", always_2d=True)
    mono = audio.mean(axis=1)
    if rate != target_rate:
        mono = resample_poly(mono, target_rate, rate).astype(np.float32)
    return mono


def polish(audio: np.ndarray) -> np.ndarray:
    if not len(audio):
        return audio.astype(np.float32)
    x = audio.astype(np.float64)
    x -= np.mean(x)
    # Gentle above-threshold compression without saturating speech harmonics.
    magnitude = np.abs(x)
    threshold = 0.48
    compressed = np.where(magnitude > threshold, threshold + (magnitude - threshold) * 0.55, magnitude)
    x = np.sign(x) * compressed
    peak = np.max(np.abs(x)) or 1.0
    x *= 0.89 / peak
    fade = min(int(TARGET_RATE * 0.018), len(x) // 2)
    if fade:
        curve = np.sin(np.linspace(0, np.pi / 2, fade)) ** 2
        x[:fade] *= curve
        x[-fade:] *= curve[::-1]
    return np.clip(x, -0.98, 0.98).astype(np.float32)


def finalize_mix(audio: np.ndarray) -> np.ndarray:
    """Remove residual DC and normalize once after concatenation, without recompression."""
    if not len(audio):
        return audio.astype(np.float32)
    x = audio.astype(np.float64)
    x -= np.mean(x)
    peak = np.max(np.abs(x)) or 1.0
    x *= 0.91 / peak
    fade = min(int(TARGET_RATE * 0.012), len(x) // 2)
    if fade:
        curve = np.sin(np.linspace(0, np.pi / 2, fade)) ** 2
        x[:fade] *= curve
        x[-fade:] *= curve[::-1]
    return np.clip(x, -0.98, 0.98).astype(np.float32)


def voice_master(audio: np.ndarray, rate: int = TARGET_RATE) -> np.ndarray:
    """Final mastering pass for a narration track: gentle high-pass to remove rumble,
    soft above-threshold compression, peak normalization and short fades. Tuned to stay
    transparent (no metallic artifacts) rather than aggressive."""
    if not len(audio):
        return audio.astype(np.float32)
    x = audio.astype(np.float64)
    x -= np.mean(x)

    sos = butter(2, 90 / (rate / 2), btype="high", output="sos")
    x = sosfilt(sos, x)

    magnitude = np.abs(x)
    threshold = 0.5
    compressed = np.where(magnitude > threshold, threshold + (magnitude - threshold) * 0.6, magnitude)
    x = np.sign(x) * compressed

    peak = np.max(np.abs(x)) or 1.0
    x *= 0.88 / peak

    fade = min(int(rate * 0.02), len(x) // 2)
    if fade:
        curve = np.sin(np.linspace(0, np.pi / 2, fade)) ** 2
        x[:fade] *= curve
        x[-fade:] *= curve[::-1]

    return np.clip(x, -0.97, 0.97).astype(np.float32)


def compress_internal_silence(audio: np.ndarray, rate: int = TARGET_RATE, max_gap_ms: float = 200, silence_ratio: float = 0.035) -> np.ndarray:
    """Shorten overly long internal silences (e.g. the model's own pause between two
    sentences spoken in one synthesis call) without touching speech or the deliberate
    pause we insert *between* voiceover segments. Runs a short RMS envelope, finds
    silent runs longer than max_gap_ms, and trims their middle down to that length.
    A short crossfade is applied at every splice point to avoid audible clicks."""
    if not len(audio):
        return audio.astype(np.float32)
    win = max(1, round(rate * 0.01))
    peak = np.max(np.abs(audio)) or 1.0
    threshold = peak * silence_ratio
    n_windows = len(audio) // win
    if n_windows < 2:
        return audio.astype(np.float32)
    trimmed = audio[: n_windows * win].reshape(n_windows, win)
    is_silent = np.sqrt(np.mean(trimmed.astype(np.float64) ** 2, axis=1)) < threshold

    max_gap_windows = max(1, round(max_gap_ms / 1000 * rate / win))
    drops: list[tuple[int, int]] = []
    run_start = None
    for i in range(n_windows + 1):
        silent = i < n_windows and is_silent[i]
        if silent and run_start is None:
            run_start = i
        elif not silent and run_start is not None:
            run_len = i - run_start
            if run_len > max_gap_windows:
                # Drop the excess from the middle of the run, keeping its edges intact.
                drop = run_len - max_gap_windows
                drop_start = run_start + (run_len - drop) // 2
                drops.append((drop_start * win, (drop_start + drop) * win))
            run_start = None

    if not drops:
        return audio.astype(np.float32)

    fade = min(round(rate * 0.006), win)  # ~6ms crossfade at each splice
    pieces: list[np.ndarray] = []
    cursor = 0
    for start, end in drops:
        left = audio[cursor:start]
        right_start = end
        if fade and len(left) > fade and len(audio) - right_start > fade:
            curve = np.linspace(0, 1, fade, dtype=np.float32)
            head = audio[right_start:right_start + fade] * curve + left[-fade:] * (1 - curve)
            pieces.append(left[:-fade])
            pieces.append(head)
            cursor = right_start + fade
        else:
            pieces.append(left)
            cursor = right_start
    pieces.append(audio[cursor:])
    return np.concatenate(pieces).astype(np.float32)


def trim_edge_silence(audio: np.ndarray, rate: int = TARGET_RATE, keep_ms: float = 40, silence_ratio: float = 0.02) -> np.ndarray:
    """Trim the synthesis model's own leading/trailing dead air from one segment while
    keeping a short natural cushion, so the explicit pause inserted *between* segments
    stays the only deliberate silence in the track. Speech itself is untouched."""
    if not len(audio):
        return audio.astype(np.float32)
    peak = np.max(np.abs(audio)) or 1.0
    loud = np.flatnonzero(np.abs(audio) > peak * silence_ratio)
    if not len(loud):
        return audio.astype(np.float32)
    keep = round(rate * keep_ms / 1000)
    start = max(0, int(loud[0]) - keep)
    end = min(len(audio), int(loud[-1]) + keep)
    return audio[start:end].astype(np.float32)


def silence(milliseconds: int) -> np.ndarray:
    return np.zeros(round(TARGET_RATE * milliseconds / 1000), dtype=np.float32)


def write_wav(path: Path, audio: np.ndarray, rate: int = TARGET_RATE) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(path, audio, rate, subtype="PCM_16")
