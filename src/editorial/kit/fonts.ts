import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {manrope, unbounded} from '../../theme/fonts';
import type {Theme} from './themes';

const {fontFamily: playfair} = loadPlayfair('normal', {weights: ['700', '800'], subsets: ['cyrillic', 'latin']});
export const bodyFont = manrope;
export const displayFont = (theme: Theme) => ({unbounded, playfair, manrope})[theme.display];
