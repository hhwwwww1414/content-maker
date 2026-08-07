import timeline from '../generated/timeline-last-percent.json';
type Segment={id:string;startMs:number;endMs:number};
export const computeLastPercentFrames=()=>{
  const segments=timeline.segments as Segment[];
  const frame=(ms:number)=>Math.round(ms/1000*timeline.fps);
  const start=(id:string)=>frame(segments.find(s=>s.id===id)?.startMs??0);
  const end=(id:string)=>frame(segments.find(s=>s.id===id)?.endMs??0);
  return {fps:timeline.fps,durationInFrames:timeline.durationInFrames,hookB:start('hook_b'),search:start('search_a'),searchB:start('search_b'),find:start('find_a'),findB:start('find_b'),resume:start('resume_a'),resumeB:start('resume_b'),cta:start('cta_a'),ctaB:start('cta_b'),end:end('cta_b')};
};
export type LastPercentBeats=ReturnType<typeof computeLastPercentFrames>;
