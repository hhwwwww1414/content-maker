import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import process from 'node:process';

const isWin = process.platform === 'win32';
const venvPython = isWin ? '.venv/Scripts/python.exe' : '.venv/bin/python';
const systemPython = isWin ? 'py' : 'python3';

const run = (command, args) => {
  const result = spawnSync(command, args, {stdio: 'inherit', shell: false});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

if (!existsSync(venvPython)) {
  console.log('Creating Python 3.11 virtual environment in .venv...');
  run(systemPython, isWin ? ['-3.11', '-m', 'venv', '.venv'] : ['-m', 'venv', '.venv']);
}

const dependencyCheck = spawnSync(venvPython, ['-c', 'import torch,numpy,scipy,soundfile'], {stdio: 'ignore'});
if (dependencyCheck.status !== 0) {
  console.log('Installing pinned Python audio dependencies...');
  run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip']);
  run(venvPython, ['-m', 'pip', 'install', '-r', 'requirements.txt']);
}

run(venvPython, process.argv.slice(2));
