import {loadFont as loadUnbounded} from '@remotion/google-fonts/Unbounded';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';

export const {fontFamily: unbounded} = loadUnbounded('normal', {
  weights: ['500', '600', '700', '800'],
  subsets: ['cyrillic', 'latin'],
});

export const {fontFamily: manrope} = loadManrope('normal', {
  weights: ['500', '600', '700', '800'],
  subsets: ['cyrillic', 'latin'],
});
