// One bundle and one browser for many frames: fast stills for storyboards, gates and visual review.
import {existsSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {ROOT} from './project.mjs';
import {libraryOf} from './library.mjs';

export const openSession = async (project, {composition = 'EditorialReel', qa, entry = 'src/editorial/index.tsx'} = {}) => {
  const out = mkdtempSync(join(tmpdir(), 'reel-bundle-'));
  const serveUrl = await bundle({entryPoint: resolve(ROOT, entry), outDir: out, publicDir: resolve(ROOT, 'public'), enableCaching: true, onProgress: () => undefined});
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
  const logs = [];
  const prepared = project ? {...project, assets: project.scenes?.some((s) => s.direction) ? libraryOf(project) : project.assets} : project;
  const inputProps = project ? {project: prepared, qa} : {qa};
  const comp = await selectComposition({serveUrl, id: composition, inputProps, puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}});
  return {
    comp, logs,
    still: async (frame, output, {scale = 1, id, props, format = 'jpeg'} = {}) => {
      const target = id ? await selectComposition({serveUrl, id, inputProps: props ?? inputProps, puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}}) : comp;
      await renderStill({serveUrl, composition: target, frame, output, inputProps: props ?? inputProps, puppeteerInstance: browser, scale, imageFormat: format, ...(format === 'jpeg' ? {jpegQuality: 88} : {}), overwrite: true, timeoutInMilliseconds: 90000, chromiumOptions: {gl: 'angle'}, logLevel: 'error', onBrowserLog: (log) => logs.push(log.text)});
    },
    close: async () => { await browser.close({silent: true}); if (existsSync(out)) rmSync(out, {recursive: true, force: true}); },
  };
};
