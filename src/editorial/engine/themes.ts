// Art directions: not skins but sets of decisions (palette, type voice, light, pacing, texture).
// Contrast of every pair is enforced by studio/tests/engine.test.mjs.

export type Palette = {
  bg: string; bg2: string; surface: string; line: string;
  ink: string; muted: string; accent: string; accent2: string; danger: string; onAccent: string;
};
export type Variant = 'base' | 'inverse' | 'block';
export type FieldKind = 'silk' | 'ink' | 'beam' | 'paper' | 'gradient' | 'solid' | 'stage';
export type MotionPersonality = 'fluid' | 'snappy' | 'weighty' | 'calm' | 'keynote';
export type EmphasisKind = 'color' | 'marker' | 'underline' | 'italic' | 'strike' | 'box' | 'gradient';
export type FontRole = {family: string; weight: number; tracking: number; leading: number};

export type ArtDirection = {
  id: string; label: string; intent: string;
  palettes: Record<Variant, Palette>;
  display: FontRole; statement: FontRole; italic: FontRole;
  body: FontRole; label2: FontRole; mono: FontRole;
  field: FieldKind; grain: number; vignette: number; radius: number;
  motion: MotionPersonality; emphasis: EmphasisKind;
  captions: {background: string; ink: string; hot: string; radius: number; font: FontRole};
  /** Other directions whose scenes may appear in the same reel (as a deliberate contrast beat). */
  compatibleWith: string[];
};

const serif = 'Noto Serif Display', cond = 'Sofia Sans Extra Condensed', onest = 'Onest', geo = 'Geologica', spec = 'Spectral', corm = 'Cormorant', tight = 'Inter Tight', mono = 'JetBrains Mono', tenor = 'Tenor Sans', unb = 'Unbounded';
const role = (family: string, weight: number, tracking = 0, leading = 1.05): FontRole => ({family, weight, tracking, leading});
const monoRole = role(mono, 500, 0, 1.2);

export const artDirections: Record<string, ArtDirection> = {
  editorial: {
    id: 'editorial', label: 'Premium editorial', intent: 'Law, money, institutions: a serious magazine feature. Serif authority, paper, one hot colour.',
    palettes: {
      base: {bg: '#EDE5D5', bg2: '#DCD1BB', surface: '#F8F3E7', line: '#A99B82', ink: '#16120D', muted: '#5C5243', accent: '#BF2A12', accent2: '#1A3A8A', danger: '#BF2A12', onAccent: '#FFF8EC'},
      inverse: {bg: '#16120D', bg2: '#2A231A', surface: '#231C14', line: '#5E5242', ink: '#F2EADA', muted: '#BDB19C', accent: '#FF6A45', accent2: '#8FA9F2', danger: '#FF6A45', onAccent: '#16120D'},
      block: {bg: '#B4260F', bg2: '#8F1D0B', surface: '#C93517', line: '#E98A72', ink: '#FFF6E8', muted: '#FFDCC8', accent: '#FFD27A', accent2: '#FFF6E8', danger: '#FFD27A', onAccent: '#3D0D03'},
    },
    display: role(serif, 700, -1, 1.02), statement: role(serif, 500, -1, 1.04), italic: role(serif, 500, -0.5, 1.04),
    body: role(onest, 500, 0, 1.28), label2: role(onest, 700, 1, 1.15), mono: monoRole,
    field: 'paper', grain: 0.5, vignette: 0.18, radius: 4, motion: 'calm', emphasis: 'italic',
    captions: {background: '#16120D', ink: '#F7F0E2', hot: '#FFC45C', radius: 8, font: role(onest, 700, 0, 1.15)},
    compatibleWith: ['documentary', 'luxury'],
  },
  documentary: {
    id: 'documentary', label: 'Cinematic documentary', intent: 'Geopolitics, investigations, real events: graded imagery, condensed titles, amber on graphite.',
    palettes: {
      base: {bg: '#0D1012', bg2: '#1E2A2E', surface: '#171D20', line: '#46565B', ink: '#F0E9DA', muted: '#AEB4AD', accent: '#EAA63F', accent2: '#6DB5AB', danger: '#E5634A', onAccent: '#171006'},
      inverse: {bg: '#E7DFCD', bg2: '#CFC5AE', surface: '#F3ECDC', line: '#8E8672', ink: '#13171A', muted: '#4B4F4C', accent: '#A85F00', accent2: '#1E5E58', danger: '#B23A22', onAccent: '#FFF8EA'},
      block: {bg: '#10343A', bg2: '#0A2227', surface: '#17444B', line: '#4C8088', ink: '#F0E9DA', muted: '#B8CCC8', accent: '#EAA63F', accent2: '#8FD6CB', danger: '#FF8D73', onAccent: '#171006'},
    },
    display: role(cond, 800, 0, 0.94), statement: role(cond, 700, 0, 0.98), italic: role(spec, 500, -0.5, 1.05),
    body: role(onest, 500, 0, 1.28), label2: role(onest, 600, 2, 1.15), mono: monoRole,
    field: 'beam', grain: 1, vignette: 0.42, radius: 6, motion: 'weighty', emphasis: 'color',
    captions: {background: '#0D1012', ink: '#F5EEDF', hot: '#F2B354', radius: 6, font: role(onest, 700, 0, 1.15)},
    compatibleWith: ['editorial', 'luxury'],
  },
  bold: {
    id: 'bold', label: 'Bold contemporary', intent: 'Viral explainers, youth, schemes: poster colour blocks, heavy grotesk, fast cuts.',
    palettes: {
      base: {bg: '#1B2BD8', bg2: '#1420A8', surface: '#2C3DF0', line: '#7D8BFF', ink: '#FFFFFF', muted: '#D6DBFF', accent: '#FFD60A', accent2: '#FF7BA6', danger: '#FFB0A0', onAccent: '#10145C'},
      inverse: {bg: '#FFD60A', bg2: '#F2B800', surface: '#FFE45C', line: '#9A7F00', ink: '#10145C', muted: '#3A3C6E', accent: '#C4122E', accent2: '#1B2BD8', danger: '#B5102A', onAccent: '#FFFFFF'},
      block: {bg: '#FF4A1C', bg2: '#D93509', surface: '#FF6A42', line: '#FFC1AE', ink: '#1A0500', muted: '#3F1405', accent: '#FFF7DC', accent2: '#10145C', danger: '#FFF7DC', onAccent: '#1A0500'},
    },
    display: role(geo, 900, -2, 0.98), statement: role(geo, 700, -1.5, 1.02), italic: role(geo, 500, -1, 1.04),
    body: role(onest, 600, 0, 1.25), label2: role(onest, 800, 1, 1.12), mono: monoRole,
    field: 'gradient', grain: 0.45, vignette: 0.08, radius: 28, motion: 'snappy', emphasis: 'marker',
    captions: {background: '#FFFFFF', ink: '#10145C', hot: '#C4122E', radius: 16, font: role(onest, 800, 0, 1.15)},
    compatibleWith: ['culture', 'dimensional'],
  },
  brash: {
    id: 'brash', label: 'Brash poster', intent: 'Provocation, opinion, a dare: black, bone and one hot red, heavy grotesk, fast cuts.',
    palettes: {
      base: {bg: '#0D0D0F', bg2: '#1C1C20', surface: '#18181C', line: '#55555C', ink: '#F5F0E6', muted: '#BDB8AE', accent: '#FF3B2F', accent2: '#F5F0E6', danger: '#FF6A5F', onAccent: '#0D0D0F'},
      inverse: {bg: '#F3EDE0', bg2: '#E2DAC9', surface: '#FBF7EE', line: '#A0988A', ink: '#0D0D0F', muted: '#4F4B45', accent: '#C9140C', accent2: '#0D0D0F', danger: '#C9140C', onAccent: '#FFFFFF'},
      block: {bg: '#CC1309', bg2: '#A80E06', surface: '#DC2A20', line: '#FFA79F', ink: '#FFFFFF', muted: '#FFE3DF', accent: '#0D0D0F', accent2: '#FFFFFF', danger: '#FFFFFF', onAccent: '#FFFFFF'},
    },
    display: role(geo, 900, -2, 0.98), statement: role(geo, 700, -1.5, 1.02), italic: role(geo, 500, -1, 1.04),
    body: role(onest, 600, 0, 1.25), label2: role(onest, 800, 1, 1.12), mono: monoRole,
    field: 'solid', grain: 0.45, vignette: 0.08, radius: 28, motion: 'snappy', emphasis: 'marker',
    captions: {background: '#FFFFFF', ink: '#0D0D0F', hot: '#C9140C', radius: 16, font: role(onest, 800, 0, 1.15)},
    compatibleWith: [],
  },
  soft: {
    id: 'soft', label: 'Soft explainer', intent: 'A hard subject told gently: warm sand and terracotta, rounded grotesk, slow moves, no alarm.',
    palettes: {
      base: {bg: '#F4EBDD', bg2: '#E8DAC5', surface: '#FBF5EA', line: '#B9A68D', ink: '#2A211A', muted: '#5F5346', accent: '#A84E28', accent2: '#2A211A', danger: '#A84E28', onAccent: '#FFFFFF'},
      inverse: {bg: '#2B211B', bg2: '#3C2F27', surface: '#362A23', line: '#6F5F52', ink: '#F6EDE0', muted: '#CDBFAF', accent: '#F0A273', accent2: '#F6EDE0', danger: '#F0A273', onAccent: '#2B211B'},
      block: {bg: '#A84E28', bg2: '#8F3F1E', surface: '#B85E36', line: '#E0A488', ink: '#FFFFFF', muted: '#FFE7D8', accent: '#FFDDBE', accent2: '#FFFFFF', danger: '#FFDDBE', onAccent: '#3A1608'},
    },
    display: role(geo, 700, -1.5, 1.04), statement: role(geo, 700, -1, 1.06), italic: role(geo, 500, -1, 1.06),
    body: role(onest, 500, 0, 1.28), label2: role(onest, 700, 1, 1.15), mono: monoRole,
    field: 'gradient', grain: 0.35, vignette: 0.06, radius: 24, motion: 'calm', emphasis: 'color',
    captions: {background: '#2B211B', ink: '#F6EDE0', hot: '#F0A273', radius: 16, font: role(onest, 700, 0, 1.15)},
    compatibleWith: [],
  },
  marker: {
    id: 'marker', label: 'Marker on paper', intent: 'Quotes cut to a beat: worn paper, a highlighter, a bold serif, hard cuts into white and black.',
    palettes: {
      base: {bg: '#DAD5C4', bg2: '#A6A08E', surface: '#E8E4D6', line: '#8C8676', ink: '#141311', muted: '#47433A', accent: '#5C5A0F', accent2: '#141311', danger: '#8C1D12', onAccent: '#FFFFFF'},
      inverse: {bg: '#F7F6F1', bg2: '#DEDCD2', surface: '#FFFFFF', line: '#A5A296', ink: '#0F0F0E', muted: '#4A4840', accent: '#5C5A0F', accent2: '#0F0F0E', danger: '#8C1D12', onAccent: '#FFFFFF'},
      block: {bg: '#08090B', bg2: '#17181C', surface: '#1D1E22', line: '#55565C', ink: '#F4F2EA', muted: '#BDBBB1', accent: '#E4EA2E', accent2: '#F4F2EA', danger: '#FF7A6B', onAccent: '#0F0F0E'},
    },
    display: role(serif, 700, -1, 1.02), statement: role(serif, 500, -1, 1.04), italic: role(serif, 500, -0.5, 1.04),
    body: role(onest, 500, 0, 1.28), label2: role(onest, 700, 1, 1.15), mono: monoRole,
    field: 'paper', grain: 0.7, vignette: 0.42, radius: 0, motion: 'snappy', emphasis: 'marker',
    captions: {background: '#FFFFFF', ink: '#0F0F0E', hot: '#5C5A0F', radius: 12, font: role(onest, 700, 0, 1.15)},
    compatibleWith: [],
  },
  dimensional: {
    id: 'dimensional', label: 'Expressive 3D', intent: 'Mechanisms and systems: soft studio light, tactile objects, rounded type.',
    palettes: {
      base: {bg: '#E4DFF2', bg2: '#C9C0E8', surface: '#F4F1FB', line: '#8D84B5', ink: '#1A1440', muted: '#4B4470', accent: '#5A2DE0', accent2: '#C6401F', danger: '#B91C3A', onAccent: '#FFFFFF'},
      inverse: {bg: '#120E2A', bg2: '#2A2160', surface: '#1E1842', line: '#5C5398', ink: '#F2EEFF', muted: '#BDB6DE', accent: '#A68CFF', accent2: '#FF8F6E', danger: '#FF8FA0', onAccent: '#120E2A'},
      block: {bg: '#FF8A63', bg2: '#F2663A', surface: '#FFA585', line: '#A8391A', ink: '#260B02', muted: '#54200E', accent: '#2A0E5E', accent2: '#FFF3EC', danger: '#6B0F1F', onAccent: '#FFF3EC'},
    },
    display: role(unb, 700, -2, 1.04), statement: role(unb, 500, -1.5, 1.08), italic: role(onest, 500, -0.5, 1.1),
    body: role(onest, 500, 0, 1.28), label2: role(onest, 700, 0.5, 1.15), mono: monoRole,
    field: 'gradient', grain: 0.3, vignette: 0.12, radius: 44, motion: 'fluid', emphasis: 'color',
    captions: {background: '#1A1440', ink: '#F4F1FB', hot: '#FFB199', radius: 22, font: role(onest, 700, 0, 1.15)},
    compatibleWith: ['bold', 'culture'],
  },
  luxury: {
    id: 'luxury', label: 'Minimal luxury', intent: 'Status, money, restraint: black, bone, one thin gold line, generous silence.',
    palettes: {
      base: {bg: '#0B0A09', bg2: '#1C1915', surface: '#151310', line: '#4A4234', ink: '#F0E7D4', muted: '#B5AA95', accent: '#D0AE70', accent2: '#8FA79A', danger: '#E08A6C', onAccent: '#0B0A09'},
      inverse: {bg: '#EDE6D4', bg2: '#D9D0BA', surface: '#F7F1E2', line: '#94896F', ink: '#120F0A', muted: '#544C3C', accent: '#7A5A20', accent2: '#2E5244', danger: '#973B1F', onAccent: '#FFF9EA'},
      block: {bg: '#0F2A22', bg2: '#091B16', surface: '#163A2F', line: '#4F7566', ink: '#EFE7D4', muted: '#B9C8BB', accent: '#D0AE70', accent2: '#EFE7D4', danger: '#E9A085', onAccent: '#0B0A09'},
    },
    display: role(corm, 600, -1, 1), statement: role(corm, 500, -0.5, 1.02), italic: role(corm, 500, 0, 1.02),
    body: role(tenor, 400, 0.5, 1.3), label2: role(tenor, 400, 4, 1.15), mono: monoRole,
    field: 'silk', grain: 0.7, vignette: 0.45, radius: 0, motion: 'calm', emphasis: 'italic',
    captions: {background: '#0B0A09', ink: '#F0E7D4', hot: '#E2C283', radius: 2, font: role(onest, 600, 0, 1.15)},
    compatibleWith: ['editorial', 'documentary'],
  },
  culture: {
    id: 'culture', label: 'Modern digital culture', intent: 'Platforms, apps, psychology: screen-native, white space, mono labels, signal blue.',
    palettes: {
      base: {bg: '#F4F3EE', bg2: '#E2E0D8', surface: '#FFFFFF', line: '#A5A39A', ink: '#0B0B10', muted: '#55544E', accent: '#2636E8', accent2: '#D42B1C', danger: '#D42B1C', onAccent: '#FFFFFF'},
      inverse: {bg: '#0B0B10', bg2: '#1E1F2C', surface: '#17171F', line: '#4B4C5C', ink: '#F4F3EE', muted: '#ACABB4', accent: '#8791FF', accent2: '#FF7A6B', danger: '#FF7A6B', onAccent: '#0B0B10'},
      block: {bg: '#2636E8', bg2: '#1825B8', surface: '#3647F2', line: '#9AA3FF', ink: '#FFFFFF', muted: '#DADDFF', accent: '#FFE9A8', accent2: '#FFB5AB', danger: '#FFD2CB', onAccent: '#10145C'},
    },
    display: role(tight, 900, -3, 0.98), statement: role(tight, 700, -2, 1.02), italic: role(spec, 500, -0.5, 1.05),
    body: role(onest, 500, 0, 1.28), label2: role(mono, 500, 0, 1.15), mono: monoRole,
    field: 'solid', grain: 0.25, vignette: 0.06, radius: 30, motion: 'snappy', emphasis: 'box',
    captions: {background: '#0B0B10', ink: '#F4F3EE', hot: '#B9C0FF', radius: 14, font: role(onest, 700, 0, 1.15)},
    compatibleWith: ['bold', 'dimensional'],
  },
  thriller: {
    id: 'thriller', label: 'Psychological thriller', intent: 'Compulsion, dread, the private trap: charcoal dark, one amber light source, burgundy as the only other colour.',
    palettes: {
      base: {bg: '#0E0B0C', bg2: '#1C1315', surface: '#181213', line: '#4E3E3C', ink: '#F2EBDF', muted: '#B9AEA2', accent: '#E3A54A', accent2: '#CF5067', danger: '#E8604F', onAccent: '#1A0F05'},
      inverse: {bg: '#E9E1D3', bg2: '#D5CAB8', surface: '#F4EEE2', line: '#8F8373', ink: '#17110F', muted: '#574B44', accent: '#8F5408', accent2: '#7C1F33', danger: '#8E1F2E', onAccent: '#FFF8EC'},
      block: {bg: '#4A0D1D', bg2: '#2E0612', surface: '#5C1226', line: '#A05868', ink: '#F6EEE2', muted: '#E3CFC4', accent: '#F0B75C', accent2: '#F6EEE2', danger: '#FFB08F', onAccent: '#2E0612'},
    },
    display: role(cond, 800, 0, 0.94), statement: role(cond, 700, 0, 0.98), italic: role(spec, 500, -0.5, 1.05),
    body: role(onest, 500, 0, 1.28), label2: role(onest, 600, 1, 1.15), mono: monoRole,
    field: 'ink', grain: 0.9, vignette: 0.46, radius: 6, motion: 'weighty', emphasis: 'color',
    captions: {background: '#0E0B0C', ink: '#F5EEDF', hot: '#F2B354', radius: 8, font: role(onest, 700, 0, 1.15)},
    compatibleWith: [],
  },
};

/**
 * Keynote: product-film restraint. A black or near-white stage lit by one soft key, tight Inter Tight display,
 * words that come out of focus, springs without bounce, and one gradient word per reel. See docs/KEYNOTE_DIRECTION.md.
 */
artDirections.keynote = {
  id: 'keynote', label: 'Keynote product film', intent: 'Launches, products, phenomena, money told calmly: a lit stage, one hero, huge tight type, motion without bounce.',
  palettes: {
    base: {bg: '#000000', bg2: '#2C2C34', surface: '#1C1C1E', line: '#3A3A3C', ink: '#F5F5F7', muted: '#A1A1A6', accent: '#FF8A4C', accent2: '#B18CFF', danger: '#FF6961', onAccent: '#000000'},
    inverse: {bg: '#F5F5F7', bg2: '#FFFFFF', surface: '#FFFFFF', line: '#D2D2D7', ink: '#1D1D1F', muted: '#6E6E73', accent: '#C2410C', accent2: '#6D28D9', danger: '#C81E1E', onAccent: '#FFFFFF'},
    block: {bg: '#030A1F', bg2: '#1E3C8C', surface: '#0B1A3D', line: '#33508F', ink: '#F5F5F7', muted: '#B4C3E6', accent: '#FFB36B', accent2: '#9DB8FF', danger: '#FF8F80', onAccent: '#030A1F'},
  },
  display: role(tight, 700, -3.5, 0.94), statement: role(tight, 700, -2.5, 1.0), italic: role(tight, 500, -2, 1.02),
  body: role(tight, 500, -0.5, 1.3), label2: role(tight, 500, 0.5, 1.2), mono: monoRole,
  field: 'stage', grain: 0.22, vignette: 0.32, radius: 40, motion: 'keynote', emphasis: 'gradient',
  captions: {background: '#1C1C1E', ink: '#F5F5F7', hot: '#FFB36B', radius: 22, font: role(tight, 700, -0.5, 1.15)},
  compatibleWith: [],
};

export const artIds = Object.keys(artDirections);

/** A scene's colours: its direction's palette in the requested variant. */
export const paletteOf = (art: ArtDirection, variant: Variant = 'base'): Palette => art.palettes[variant];
