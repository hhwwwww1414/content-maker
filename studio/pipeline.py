#!/usr/bin/env python3
"""Free local research, idea ranking and editorial checks. Python stdlib only."""
import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sqlite3
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'runs/studio/studio.sqlite3'
STANDARDS = json.loads((ROOT / 'config/reel.standards.json').read_text())
CATALOG = json.loads((ROOT / 'studio/lib/visual-catalog.json').read_text())


def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB)
    conn.executescript('''
    CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY, niche TEXT, title TEXT,
      url TEXT UNIQUE, publisher TEXT, published TEXT, discovered TEXT);
    CREATE TABLE IF NOT EXISTS ideas(id TEXT PRIMARY KEY, source_id TEXT, title TEXT,
      score REAL, explanation TEXT, status TEXT DEFAULT 'candidate');
    CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, path TEXT, status TEXT,
      updated TEXT, render_path TEXT, qa_path TEXT);
    CREATE TABLE IF NOT EXISTS publications(project_id TEXT, platform TEXT,
      published TEXT, url TEXT, views INTEGER, notes TEXT);
    ''')
    return conn


def text_of(element, names):
    for name in names:
        node = element.find(name)
        if node is not None and node.text:
            return node.text.strip()
    return ''


def fetch(niche):
    feeds = json.loads((ROOT / 'studio/feeds.json').read_text())['niches']
    if niche not in feeds:
        raise ValueError(f'Unknown niche {niche}. Available: {", ".join(feeds)}')
    conn = connect()
    count = 0
    for url in feeds[niche]:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'ContentMakerResearch/1.0'})
            with urllib.request.urlopen(req, timeout=15) as response:
                data = response.read(2_000_000)
            root = ET.fromstring(data)
            items = root.findall('.//item') or root.findall('{http://www.w3.org/2005/Atom}entry')
            for item in items[:50]:
                title = text_of(item, ['title', '{http://www.w3.org/2005/Atom}title'])
                link = text_of(item, ['link'])
                if not link:
                    atom_link = item.find('{http://www.w3.org/2005/Atom}link')
                    link = atom_link.get('href', '') if atom_link is not None else ''
                published = text_of(item, ['pubDate', '{http://www.w3.org/2005/Atom}published', '{http://www.w3.org/2005/Atom}updated'])
                if not title or not link.startswith('http'):
                    continue
                sid = hashlib.sha256(link.encode()).hexdigest()[:16]
                conn.execute('INSERT OR IGNORE INTO sources VALUES(?,?,?,?,?,?,?)',
                    (sid, niche, title, link, url.split('/')[2], published, dt.datetime.now(dt.timezone.utc).isoformat()))
                count += 1
        except Exception as error:
            print(f'Feed unavailable: {url}: {error}', file=sys.stderr)
    conn.commit()
    conn.close()
    print(f'Processed {count} feed entries. Database: {DB}')


def rank(niche):
    conn = connect()
    rows = conn.execute('SELECT id,title,url,published,publisher FROM sources WHERE niche=?', (niche,)).fetchall()
    ranked = []
    now = dt.datetime.now(dt.timezone.utc)
    for sid, title, url, published, publisher in rows:
        # A source headline is a lead, not a verified script or popularity signal.
        try:
            from email.utils import parsedate_to_datetime
            age = max(0, (now - parsedate_to_datetime(published).astimezone(dt.timezone.utc)).days)
            recency = round(max(0, 2 - age / 14), 1)
        except (TypeError, ValueError, OverflowError):
            recency = 0
        words = title.split()
        clarity = 2 if 4 <= len(words) <= 12 else (1 if len(words) <= 16 else 0)
        visual = 1 if re.search(r'planet|satellit|space|rocket|map|orbit|mars|comet|earth|launch|image', title, re.I) else 0
        retention = 1 if re.search(r'why|how|discover|first|new|mystery|surpris', title, re.I) else 0
        source = 1 if publisher.endswith(('.gov', '.int')) else 0
        value = 1 if re.search(r'why|how|discover|research|science|improv|mission', title, re.I) else 0
        audience = 0  # no audience measurements
        originality = 0  # no comparison corpus
        score = round(recency + clarity + visual + retention + source + value, 1)
        explanation = (f'Limited-evidence score {score}/10: recency {recency}/2, audience {audience}/1 (unknown), '
            f'retention cue {retention}/1, 30s clarity {clarity}/2, visual cue {visual}/1, '
            f'publisher signal {source}/1, originality {originality}/1 (unknown), learning value cue {value}/1. '
            'Headline heuristics only; no view counts or verified facts. Editor must assess retention, originality and source claims.')
        iid = hashlib.sha256((niche + sid).encode()).hexdigest()[:16]
        conn.execute('INSERT INTO ideas(id,source_id,title,score,explanation,status) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET score=excluded.score,explanation=excluded.explanation',
            (iid, sid, title, score, explanation, 'candidate'))
        ranked.append((score, title, url, explanation))
    conn.commit()
    conn.close()
    for score, title, url, why in sorted(ranked, reverse=True)[:10]:
        print(f'{score:.1f}  {title}\n  {url}\n  {why}')
    if not ranked:
        print('No cached ideas. Run research first.')


def draft(niche):
    """Write non-publishable idea briefs from cached leads for editor review."""
    conn = connect()
    rows = conn.execute('SELECT i.id,i.title,i.score,i.explanation,s.url,s.publisher,s.published '
                        'FROM ideas i JOIN sources s ON i.source_id=s.id WHERE s.niche=? '
                        'ORDER BY i.score DESC LIMIT 3', (niche,)).fetchall()
    conn.close()
    if not rows:
        raise ValueError('No ranked ideas; run research and rank first')
    directory = ROOT / 'runs/studio/drafts' / niche
    directory.mkdir(parents=True, exist_ok=True)
    for iid, title, score, explanation, url, publisher, published in rows:
        item = {'id': iid, 'niche': niche, 'topic': title,
                'source': {'url': url, 'publisher': publisher, 'published': published},
                'score': score, 'scoreExplanation': explanation,
                'status': 'unverified_idea',
                'editorialTasks': ['Read the full source and confirm the core claim',
                                   'Check originality and audience interest',
                                   'Choose one ' + str(STANDARDS['duration']['targetSeconds']) + ' second angle',
                                   'Write and approve a sourced scene script']}
        path = directory / f'{iid}.json'
        path.write_text(json.dumps(item, ensure_ascii=False, indent=2) + '\n')
        print(path)


def norm_word(text):
    return re.sub(r'[^\w]', '', text.lower().replace('ё', 'е'))


def walk_cues(node):
    """Yield every voice cue in a visual spec: a string under a *cue/until key."""
    if isinstance(node, list):
        for child in node:
            yield from walk_cues(child)
    elif isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, str) and (key.lower().endswith('cue') or key == 'until'):
                yield value
            else:
                yield from walk_cues(value)


def check_visual(scene, errors):
    sid = scene.get('id', '?')
    visual = scene['visual']
    layers = visual.get('layers') or []
    if not layers:
        errors.append(f'{sid}: visual has no layers')
    for layer in layers:
        if layer.get('type') not in CATALOG['layers']:
            errors.append(f'{sid}: unknown layer {layer.get("type")}')
    transition = (visual.get('transition') or {}).get('type', 'cut')
    if transition not in CATALOG['transitions']:
        errors.append(f'{sid}: unknown transition {transition}')
    if visual.get('backdrop') and visual['backdrop'] not in CATALOG['backdrops']:
        errors.append(f'{sid}: unknown backdrop {visual["backdrop"]}')
    spoken = [norm_word(w) for w in scene.get('voice', '').split()]
    cues = list(walk_cues(visual))
    for cue in cues:
        word, _, nth = cue.partition('#')
        matches = [w for w in spoken if w.startswith(norm_word(word))]
        if len(matches) < (int(nth) if nth else 1):
            errors.append(f'{sid}: cue "{cue}" is not spoken in this scene')
    # A scene with no spoken cue cannot be synced to the voice.
    if not cues:
        errors.append(f'{sid}: no voice cues; animation is not tied to speech')


def check_variety(scenes, errors):
    """Reject a reel that repeats itself. This is the machine half of art direction."""
    visual = [s for s in scenes if s.get('visual')]
    leads, seen = [], {}
    for scene in visual:
        types = [l.get('type') for l in scene['visual'].get('layers', []) if l.get('type') != 'light']
        lead = types[0] if types else None
        signature = tuple(sorted(set(types)))
        if signature in seen:
            errors.append(f'{scene["id"]}: repeats the visual recipe of {seen[signature]}: {", ".join(signature)}')
        seen[signature] = scene['id']
        if leads and leads[-1] == lead:
            errors.append(f'{scene["id"]}: same lead visual as previous scene: {lead}')
        leads.append(lead)
    kinds = [(s['visual'].get('transition') or {}).get('type', 'cut') for s in visual[1:]]
    for i in range(1, len(kinds)):
        if kinds[i] != 'cut' and kinds[i] == kinds[i - 1]:
            errors.append(f'{visual[i + 1]["id"]}: same transition twice in a row: {kinds[i]}')
    if len(visual) >= 4 and len(set(leads)) < 3:
        errors.append('Fewer than 3 distinct lead visuals in the reel')


def validate(path, stage='full'):
    project = json.loads(Path(path).read_text())
    errors, warnings = [], []
    needed = ['id', 'topic', 'niche', 'sources', 'status', 'centralIdea', 'scenes', 'audio']
    errors += [f'Missing {key}' for key in needed if key not in project]
    scenes = project.get('scenes', [])
    if not scenes:
        errors.append('No scenes')
    limits = {**STANDARDS['duration'], **project.get('limits', {})}
    read = STANDARDS['readability']
    known_sources = {s.get('id') for s in project.get('sources', [])}
    timed = stage == 'full'
    cursor = 0
    for scene in scenes:
        sid = scene.get('id', '?')
        duration = scene.get('duration', 0)
        if timed:
            if abs(scene.get('start', -99) - cursor) > 0.001:
                errors.append(f'{sid}: scene gap or overlap')
            if duration < read['minSceneSeconds']:
                errors.append(f'{sid}: less than {read["minSceneSeconds"]} seconds for reading')
            if len(scene.get('voice', '').split()) / max(duration, .1) > read['maxWordsPerSecond']:
                errors.append(f'{sid}: speech rate exceeds {read["maxWordsPerSecond"]} words/s')
        cursor += duration
        for field in ['voice', 'thought', 'animation', 'onScreen']:
            if not scene.get(field):
                errors.append(f'{sid}: missing {field}')
        if not scene.get('template') and not scene.get('visual') and not scene.get('component') and not scene.get('direction'):
            errors.append(f'{sid}: needs direction, visual, component or template')
        if scene.get('visual'):
            check_visual(scene, errors)
        if not scene.get('sources') or set(scene['sources']) - known_sources:
            errors.append(f'{sid}: missing or unknown sources')
        if len(scene.get('onScreen', '')) > read['maxOnScreenChars']:
            errors.append(f'{sid}: on-screen text over {read["maxOnScreenChars"]} characters')
    check_variety(scenes, errors)
    # Directed scenes have a typed contract and their own rules, shared with the renderer.
    if any(s.get('direction') for s in scenes):
        result = subprocess.run(['node', '--no-warnings', str(ROOT / 'studio/spec-check.mjs'), str(path)], capture_output=True, text=True)
        for line in result.stdout.splitlines():
            if line.startswith('FAIL '):
                errors.append(line[5:])
            elif line.startswith('WARN '):
                warnings.append(line[5:])
        if result.returncode != 0 and not any(l.startswith('FAIL ') for l in result.stdout.splitlines()):
            errors.append('spec-check failed: ' + result.stderr[-400:])
    if project.get('theme') and project['theme'] not in CATALOG['themes']:
        errors.append(f'Unknown theme {project["theme"]}')
    if timed:
        total_ok = limits['minSeconds'] <= cursor <= limits['maxSeconds']
        if not total_ok or abs(cursor - project.get('durationSeconds', -1)) > .001:
            errors.append(f'Total duration {cursor:.2f}s invalid or outside {limits["minSeconds"]}–{limits["maxSeconds"]}s')
        status = project.get('status', {})
        demo = status.get('scriptApproval') == 'demo' and status.get('factCheck') in ('reviewed', 'partial')
        if demo:
            warnings.append('Demo status: renders from an existing take only, not publishable until approved')
        else:
            if status.get('factCheck') != 'reviewed':
                errors.append('Facts require editorial review')
            if status.get('scriptApproval') != 'approved':
                errors.append('Script requires approval')
    for warning in warnings:
        print('WARN: ' + warning)
    if errors:
        print('\n'.join('FAIL: ' + e for e in errors))
        return 1
    if not timed:
        print(f'PASS (script): {project["id"]}, {len(scenes)} scenes')
        return 0
    conn = connect()
    conn.execute('INSERT INTO projects(id,path,status,updated,render_path,qa_path) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET path=excluded.path,status=excluded.status,updated=excluded.updated,render_path=excluded.render_path,qa_path=excluded.qa_path',
        (project['id'], str(Path(path).resolve()), project.get('status', {}).get('production', 'approved'), dt.datetime.now(dt.timezone.utc).isoformat(), project.get('renderPath'), project.get('qa', {}).get('path') if project.get('qa') else None))
    conn.commit()
    conn.close()
    print(f'PASS: {project["id"]}, {cursor}s, {len(scenes)} scenes; editorial status recorded in project')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['research', 'rank', 'draft', 'validate'])
    parser.add_argument('argument', help='niche or project JSON path')
    parser.add_argument('--stage', choices=['script', 'full'], default='full', help='script: before audio exists, skip timing and approval')
    a = parser.parse_args()
    try:
        if a.command == 'research': fetch(a.argument)
        elif a.command == 'rank': rank(a.argument)
        elif a.command == 'draft': draft(a.argument)
        else: sys.exit(validate(a.argument, a.stage))
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
