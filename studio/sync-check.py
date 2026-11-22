#!/usr/bin/env python3
"""Independent sync check: local Whisper hears the rendered voice; compare with the caption timings.
Free and offline once the model is cached. Run with the venv at runs/studio/audio-qa-venv."""
import difflib
import json
import os
import re
import statistics
import sys
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
project = json.loads(Path(sys.argv[1]).read_text())
os.environ.setdefault('HF_HOME', str(ROOT / 'runs/studio/whisper-models'))


def norm(text):
    return re.sub(r'[^\w]', '', text.lower().replace('ё', 'е'))


model = WhisperModel('small', device='cpu', compute_type='int8', download_root=str(ROOT / 'runs/studio/whisper-models'), local_files_only=True)
# Whisper writes numerals as digits and mangles brand names spoken phonetically. audio.whisperHint names the brands
# and asks for numbers in words; it never contains the script, so the check stays an independent hearing.
# Opt-in per project: a hint changes how Whisper hears everything, so reels that pass without one keep none.
extra = project['audio'].get('whisperHint')
hint = f'Все числа записываются словами. {extra}' if extra else None
segments, _ = model.transcribe(str(ROOT / 'public' / project['audio']['voicePath']), language='ru', word_timestamps=True, vad_filter=False, initial_prompt=hint)
heard = [(norm(w.word), w.start) for s in segments for w in s.words if norm(w.word)]
captions = [(norm(c['text']), c['startMs'] / 1000) for c in project['captions'] if norm(c['text'])]
matcher = difflib.SequenceMatcher(a=[w for w, _ in captions], b=[w for w, _ in heard], autojunk=False)
drift = [abs(captions[block.a + i][1] - heard[block.b + i][1]) for block in matcher.get_matching_blocks() for i in range(block.size)]
drift.sort()
report = {
    'project': project['id'],
    'wordsMatched': len(drift),
    'wordsInScript': len(captions),
    'textSimilarity': round(matcher.ratio(), 3),
    'medianDriftMs': round(statistics.median(drift) * 1000) if drift else None,
    'p95DriftMs': round(drift[int(len(drift) * .95) - 1] * 1000) if drift else None,
}
report['passed'] = bool(drift) and report['textSimilarity'] >= .85 and report['medianDriftMs'] <= 150 and report['p95DriftMs'] <= 350
out = ROOT / 'out/studio' / f"{project['id']}-sync.json"
out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False))
sys.exit(0 if report['passed'] else 1)
