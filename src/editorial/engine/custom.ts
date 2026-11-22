import type React from 'react';
import {BeatPaper, BeatStrike} from './scenes/custom/BeatQuotes';
import {EgoDoors} from './scenes/custom/EgoDoors';
import {FeedWall} from './scenes/custom/FeedWall';
import {LetterWall} from './scenes/custom/LetterWall';
import {SignalRings} from './scenes/custom/SignalRings';
import {WantGauges} from './scenes/custom/WantGauges';
import {WaterTest} from './scenes/custom/WaterTest';
import {ScrollClock} from './scenes/custom/ScrollClock';
import {FeedTunnel} from './scenes/custom/FeedTunnel';
import {BookEnd} from './scenes/custom/BookEnd';
import {V2wCompare, V2wOutro, V2wPhone, V2wPull} from '../brands/vin2win/shots';
import {KeynoteBlink, KeynotePhone, KeynoteStat} from './scenes/custom/Keynote';
import {DecisionFall, LossPhone, QuietButton, ZeroCorridor} from './scenes/custom/LossTrap';

/**
 * The explicit extension path. A story that no system can express registers a component here and uses
 * `{"type": "custom", "component": "<name>", "props": {...}, "review": "<why>"}`. It gets the same clock (useShot)
 * and the same layout guard. Add a Lab story and look at real frames when you add one.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const customShots: Record<string, React.FC<any>> = {signalRings: SignalRings, egoDoors: EgoDoors, beatPaper: BeatPaper, beatStrike: BeatStrike, wantGauges: WantGauges, letterWall: LetterWall, feedWall: FeedWall, waterTest: WaterTest,scrollClock: ScrollClock, feedTunnel: FeedTunnel, bookEnd: BookEnd, lossPhone: LossPhone, zeroCorridor: ZeroCorridor, decisionFall: DecisionFall, quietButton: QuietButton, keynoteBlink: KeynoteBlink, keynoteStat: KeynoteStat, keynotePhone: KeynotePhone, v2wCompare: V2wCompare, v2wPhone: V2wPhone, v2wPull: V2wPull, v2wOutro: V2wOutro};
