import React from 'react';
import {Callout, Checklist, Compare, DocumentCard, Poll, Roster, Stamp, Timeline} from './Cards';
import {Flow} from './Diagram';
import {Phone, Tv} from './Devices';
import {Kinetic} from './Kinetic';
import {Light} from './Light';
import {Counter, Fingerprint, UnitGrid} from './Stats';

// Names must match studio/lib/visual-catalog.json; studio/tests/kit.test.mjs enforces it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const layerRegistry: Record<string, React.FC<any>> = {
  kinetic: Kinetic, flow: Flow, counter: Counter, unitgrid: UnitGrid, compare: Compare, checklist: Checklist,
  poll: Poll, tv: Tv, phone: Phone, fingerprint: Fingerprint, stamp: Stamp, document: DocumentCard,
  timeline: Timeline, roster: Roster, light: Light, callout: Callout,
};
