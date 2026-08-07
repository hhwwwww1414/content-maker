from __future__ import annotations

from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

from audio_utils import TARGET_RATE, polish, write_wav

OUT = Path(__file__).resolve().parents[1] / "public/generated"


def env(length: int, attack: float = 0.03, release: float = 0.45) -> np.ndarray:
    t = np.linspace(0, 1, length, endpoint=False)
    return np.minimum(1, t / attack) * np.clip((1 - t) / release, 0, 1)


def tone(freq: float, seconds: float, amp: float = 0.4) -> np.ndarray:
    t = np.arange(round(seconds * TARGET_RATE)) / TARGET_RATE
    return (np.sin(2 * np.pi * freq * t) * env(len(t)) * amp).astype(np.float32)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(2309)

    error = tone(92, 0.34, 0.36) + tone(138, 0.34, 0.12)
    write_wav(OUT / "error.wav", polish(error) * 0.62)

    length = round(0.75 * TARGET_RATE)
    noise = rng.normal(0, 1, length)
    filtered = sosfilt(butter(3, [240 / (TARGET_RATE / 2), 4200 / (TARGET_RATE / 2)], btype="band", output="sos"), noise)
    whoosh_env = np.sin(np.linspace(0, np.pi, length)) ** 2
    write_wav(OUT / "whoosh.wav", polish(filtered * whoosh_env) * 0.25)

    connect = np.zeros(round(0.82 * TARGET_RATE), dtype=np.float32)
    for offset, freq in [(0.00, 523.25), (0.12, 659.25), (0.25, 783.99), (0.37, 1046.5)]:
        wave = tone(freq, 0.36, 0.20)
        start = round(offset * TARGET_RATE)
        connect[start:start + len(wave)] += wave[:len(connect) - start]
    write_wav(OUT / "connect.wav", polish(connect) * 0.42)

    click = tone(920, 0.055, 0.16) + tone(440, 0.055, 0.08)
    write_wav(OUT / "click.wav", polish(click) * 0.25)

    fall_len = round(0.5 * TARGET_RATE)
    fall_noise = rng.normal(0, 1, fall_len)
    fall_filtered = sosfilt(butter(3, [60 / (TARGET_RATE / 2), 900 / (TARGET_RATE / 2)], btype="band", output="sos"), fall_noise)
    fall_env = np.exp(-np.linspace(0, 6, fall_len))
    fall_tone = tone(70, 0.5, 0.3) * np.exp(-np.linspace(0, 4, fall_len))
    write_wav(OUT / "fall.wav", polish(fall_filtered * fall_env * 0.6 + fall_tone) * 0.5)

    seconds = 24
    t = np.arange(seconds * TARGET_RATE) / TARGET_RATE
    ambient = (0.035 * np.sin(2 * np.pi * 55 * t) + 0.022 * np.sin(2 * np.pi * 82.5 * t))
    ambient += sosfilt(butter(2, 900 / (TARGET_RATE / 2), btype="low", output="sos"), rng.normal(0, 0.018, len(t)))
    ambient *= np.minimum(1, t / 1.2) * np.minimum(1, (seconds - t) / 1.5)
    write_wav(OUT / "ambient.wav", np.clip(ambient, -0.2, 0.2).astype(np.float32))
    print(f"Generated original SFX in {OUT}")


if __name__ == "__main__":
    main()
