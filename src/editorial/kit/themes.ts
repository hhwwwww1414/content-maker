export type Theme = {
  bg: string; bg2: string; surface: string; line: string; ink: string; muted: string;
  accent: string; accent2: string; danger: string; onAccent: string;
  captionBg: string; captionInk: string; captionHot: string;
  display: 'unbounded' | 'playfair' | 'manrope'; displayWeight: number; radius: number;
  backdrop: string;
};

// Contrast of every text pair below is enforced by studio/tests/kit.test.mjs.
export const themes: Record<string, Theme> = {
  signal: {
    bg: '#05090F', bg2: '#0D2230', surface: '#0F1E2B', line: '#2B4A5E', ink: '#F3F7F5', muted: '#A9BCC8',
    accent: '#7CFFB2', accent2: '#FFB454', danger: '#FF6B78', onAccent: '#04130B',
    captionBg: '#05090F', captionInk: '#F3F7F5', captionHot: '#7CFFB2',
    display: 'unbounded', displayWeight: 700, radius: 26, backdrop: 'grid',
  },
  paper: {
    bg: '#F4EEE1', bg2: '#E8DFCC', surface: '#FFFDF7', line: '#B9AD97', ink: '#17130E', muted: '#5C5346',
    accent: '#B92A18', accent2: '#1C4A9E', danger: '#B92A18', onAccent: '#FFFDF7',
    captionBg: '#17130E', captionInk: '#F4EEE1', captionHot: '#FFC94D',
    display: 'playfair', displayWeight: 800, radius: 6, backdrop: 'paper',
  },
  cobalt: {
    bg: '#0B1F7A', bg2: '#1F46D8', surface: '#FFFFFF', line: '#8FA4F2', ink: '#FFFFFF', muted: '#D5DEFF',
    accent: '#FFE14D', accent2: '#7DF0FF', danger: '#FFB3A8', onAccent: '#0B1F7A',
    captionBg: '#FFFFFF', captionInk: '#0B1F7A', captionHot: '#C2185B',
    display: 'manrope', displayWeight: 800, radius: 40, backdrop: 'rays',
  },
  solar: {
    bg: '#1B0B24', bg2: '#4A1740', surface: '#2A1436', line: '#6E4A7E', ink: '#FFF4E6', muted: '#D9C3D6',
    accent: '#FFB02E', accent2: '#FF6FA3', danger: '#FF8A8A', onAccent: '#1B0B24',
    captionBg: '#1B0B24', captionInk: '#FFF4E6', captionHot: '#FFB02E',
    display: 'unbounded', displayWeight: 800, radius: 18, backdrop: 'aurora',
  },
};
