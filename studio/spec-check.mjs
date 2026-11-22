#!/usr/bin/env node
// Validates a directed project: schema of every scene, cross-scene direction rules, assets. Exit 1 on any error.
//   node studio/spec-check.mjs <project.json> [--json]
import './lib/ts-hooks.mjs';
import {loadProject, projectPath} from './lib/project.mjs';
import {libraryIndex} from './lib/library.mjs';

const {checkProject} = await import('../src/editorial/engine/spec/rules.ts');
const argv = process.argv.slice(2);
if (argv.includes('--schema')) {
  const {writeFileSync} = await import('node:fs');
  const {resolve} = await import('node:path');
  const {jsonSchema} = await import('../src/editorial/engine/spec/schema.ts');
  writeFileSync(resolve(import.meta.dirname, '../docs/storyboard.schema.json'), JSON.stringify(jsonSchema(), null, 1) + '\n');
  console.log('docs/storyboard.schema.json');
  process.exit(0);
}
const project = loadProject(projectPath(argv.find((a) => !a.startsWith('--'))));
const findings = checkProject(project, libraryIndex());
const errors = findings.filter((f) => f.level === 'error');
if (argv.includes('--json')) console.log(JSON.stringify({project: project.id, errors: errors.length, findings}, null, 1));
else {
  for (const f of findings) console.log(`${f.level === 'error' ? 'FAIL' : 'WARN'} [${f.scene}] ${f.rule}: ${f.message}`);
  if (!errors.length) console.log(`PASS (spec): ${project.id}, ${project.scenes.length} scenes${findings.length ? `, ${findings.length} warnings` : ''}`);
}
process.exit(errors.length ? 1 : 0);
