#!/usr/bin/env python3
"""Apply short fades to a normalized mono PCM16 WAV without extra libraries."""
from array import array
from pathlib import Path
import sys
import wave

path = Path(sys.argv[1])
with wave.open(str(path), 'rb') as source:
    params = source.getparams()
    if params.nchannels != 1 or params.sampwidth != 2:
        raise ValueError('Expected mono PCM16 WAV')
    samples = array('h', source.readframes(params.nframes))
if sys.byteorder != 'little':
    samples.byteswap()
fade_in = min(len(samples), round(params.framerate * .012))
fade_out = min(len(samples), round(params.framerate * .08))
for i in range(fade_in):
    samples[i] = round(samples[i] * i / max(1, fade_in - 1))
for i in range(fade_out):
    index = len(samples) - fade_out + i
    samples[index] = round(samples[index] * (1 - i / max(1, fade_out - 1)))
if sys.byteorder != 'little':
    samples.byteswap()
temporary = path.with_suffix('.tmp.wav')
with wave.open(str(temporary), 'wb') as target:
    target.setparams(params)
    target.writeframes(samples.tobytes())
temporary.replace(path)
