#!/usr/bin/env python3
"""Free local research, idea ranking and editorial checks. Python stdlib only."""
import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sqlite3
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'runs/studio/studio.sqlite3'


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
                                   'Choose one 20–25 second angle',
                                   'Write and approve a sourced scene script']}
        path = directory / f'{iid}.json'
        path.write_text(json.dumps(item, ensure_ascii=False, indent=2) + '\n')
        print(path)


def validate(path):
    project = json.loads(Path(path).read_text())
    errors = []
    needed = ['id', 'topic', 'niche', 'sources', 'status', 'centralIdea', 'scenes', 'audio']
    errors += [f'Missing {key}' for key in needed if key not in project]
    scenes = project.get('scenes', [])
    if not scenes:
        errors.append('No scenes')
    known_sources = {s.get('id') for s in project.get('sources', [])}
    cursor = 0
    for scene in scenes:
        sid = scene.get('id', '?')
        if abs(scene.get('start', -99) - cursor) > 0.001:
            errors.append(f'{sid}: scene gap or overlap')
        duration = scene.get('duration', 0)
        if duration < 2:
            errors.append(f'{sid}: less than 2 seconds for reading')
        cursor += duration
        for field in ['voice', 'thought', 'template', 'animation', 'onScreen']:
            if not scene.get(field):
                errors.append(f'{sid}: missing {field}')
        if not scene.get('sources') or set(scene['sources']) - known_sources:
            errors.append(f'{sid}: missing or unknown sources')
        if len(scene.get('onScreen', '')) > 38:
            errors.append(f'{sid}: on-screen text over 38 characters')
        if len(scene.get('voice', '').split()) / max(duration, .1) > 3.6:
            errors.append(f'{sid}: estimated speech rate exceeds 3.6 words/s')
    if cursor > 30 or abs(cursor - project.get('durationSeconds', -1)) > .001:
        errors.append('Total duration invalid or over 30 seconds')
    if project.get('status', {}).get('factCheck') != 'reviewed':
        errors.append('Facts require editorial review')
    if project.get('status', {}).get('scriptApproval') != 'approved':
        errors.append('Script requires approval')
    if errors:
        print('\n'.join('FAIL: ' + e for e in errors))
        return 1
    conn = connect()
    conn.execute('INSERT INTO projects(id,path,status,updated,render_path,qa_path) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET path=excluded.path,status=excluded.status,updated=excluded.updated,render_path=excluded.render_path,qa_path=excluded.qa_path',
        (project['id'], str(Path(path).resolve()), project.get('status', {}).get('production', 'approved'), dt.datetime.now(dt.timezone.utc).isoformat(), project.get('renderPath'), project.get('qa', {}).get('path') if project.get('qa') else None))
    conn.commit()
    conn.close()
    print(f'PASS: {project["id"]}, {cursor}s, {len(scenes)} scenes; editorial approval recorded in project')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['research', 'rank', 'draft', 'validate'])
    parser.add_argument('argument', help='niche or project JSON path')
    a = parser.parse_args()
    try:
        if a.command == 'research': fetch(a.argument)
        elif a.command == 'rank': rank(a.argument)
        elif a.command == 'draft': draft(a.argument)
        else: sys.exit(validate(a.argument))
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
