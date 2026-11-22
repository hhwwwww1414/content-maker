import {staticFile} from 'remotion';

/** Asset path from the manifest. A remote URL is never used at render time. */
export const assetUrl = (entry: {path: string}) => staticFile(entry.path);
