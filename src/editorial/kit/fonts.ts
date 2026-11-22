import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadUnbounded} from '@remotion/google-fonts/Unbounded';
import type {Theme} from './themes';

// Kit themes fetch their fonts on demand, so a directed reel, which uses vendored faces only, never touches the network.
let loaded = false;
export const ensureKitFonts = () => {
  if (loaded) return;
  loaded = true;
  const subsets: Array<'cyrillic' | 'latin'> = ['cyrillic', 'latin'];
  loadPlayfair('normal', {weights: ['700', '800'], subsets});
  loadUnbounded('normal', {weights: ['500', '600', '700', '800'], subsets});
  loadManrope('normal', {weights: ['500', '600', '700', '800'], subsets});
};
export const bodyFont = 'Manrope';
export const displayFont = (theme: Theme) => ({unbounded: 'Unbounded', playfair: 'Playfair Display', manrope: 'Manrope'})[theme.display];
