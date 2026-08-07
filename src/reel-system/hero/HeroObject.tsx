import React from 'react';
import type {HeroObjectPlan} from '../storyboard/types';
import {LAYERS} from '../layers';

type HeroObjectProps = {
  plan: HeroObjectPlan;
  width?: number;
  height?: number;
  silhouetteMode?: boolean;
};

export const HeroObject: React.FC<HeroObjectProps> = ({plan, width = 320, height = 320, silhouetteMode = false}) => {
  const fill = silhouetteMode ? '#000' : '#34d399';
  const stroke = silhouetteMode ? '#000' : '#7dd3fc';

  return (
    <div
      data-hero-asset-type={plan.assetType}
      data-hero-semantic-name={plan.semanticName}
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: silhouetteMode ? '#fff' : 'transparent',
        zIndex: LAYERS.HERO,
      }}
    >
      {plan.assetType === 'SVG' || plan.assetType === 'HTML' ? (
        <svg width={width} height={height} viewBox="0 0 320 320" role="img" aria-label={plan.semanticName}>
          <path d="M160 24 278 92v136l-118 68-118-68V92z" fill={fill} opacity={silhouetteMode ? 1 : 0.92} />
          <path d="M160 62 244 110v100l-84 48-84-48V110z" fill={silhouetteMode ? '#000' : '#071014'} stroke={stroke} strokeWidth="10" />
          <circle cx="160" cy="160" r="44" fill={fill} />
        </svg>
      ) : (
        <div
          style={{
            width: width * 0.72,
            height: height * 0.72,
            borderRadius: 8,
            background: fill,
            boxShadow: silhouetteMode ? undefined : '0 0 48px rgba(52, 211, 153, 0.35)',
          }}
        />
      )}
    </div>
  );
};
