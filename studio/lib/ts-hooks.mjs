// Lets Node import the engine's pure TypeScript modules: extension-less paths and JSON imports.
import {registerHooks} from 'node:module';
import {existsSync} from 'node:fs';
import {dirname, resolve as resolvePath} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
      const base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
      if (!existsSync(base) || specifier.endsWith('/')) {
        for (const candidate of [`${base}.ts`, resolvePath(base, 'index.ts')]) {
          if (existsSync(candidate)) return next(pathToFileURL(candidate).href, context);
        }
      }
      if (specifier.endsWith('.json')) return {...next(specifier, context), importAttributes: {type: 'json'}};
    }
    return next(specifier, context);
  },
});
