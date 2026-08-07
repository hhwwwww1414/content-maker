import type {CSSProperties} from 'react';
import {colors} from './colors';
import {manrope, unbounded} from './fonts';

export const headline: CSSProperties = {
  fontFamily: unbounded,
  fontSize: 92,
  lineHeight: 1.04,
  letterSpacing: -4,
  fontWeight: 800,
  color: colors.white,
  margin: 0,
};

export const label: CSSProperties = {
  fontFamily: manrope,
  fontSize: 34,
  lineHeight: 1.2,
  fontWeight: 700,
  color: colors.gray,
};
