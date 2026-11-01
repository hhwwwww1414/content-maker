import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

export const palette = {bg:'#07121E', panel:'#102637', ink:'#F2F6F4', muted:'#9CB5C3', mint:'#69F0CE', gold:'#F8C776', blue:'#56A7FF'};
export const safe = {left:96, right:140, top:160, bottom:320};
export const enter = (frame:number, delay=0, frames=18) => interpolate(frame,[delay,delay+frames],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(0.22,1,0.36,1),
});

export const Frame:React.FC<{label:string;index:number;children:React.ReactNode}> = ({label,index,children}) => {
  const f=useCurrentFrame();
  return <div style={{width:1080,height:1920,background:palette.bg,color:palette.ink,fontFamily:'Arial, sans-serif',position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 45%, #153146 0%, #07121E 68%)'}}/>
    <div style={{position:'absolute',left:96,top:164,right:140,display:'flex',justifyContent:'space-between',fontSize:23,letterSpacing:4,color:palette.mint,fontWeight:700}}>
      <span>ПОНЯТНО / GPS</span><span>0{index} — 05</span>
    </div>
    <div style={{position:'absolute',left:96,top:222,width:844,height:2,background:'#355064'}}/>
    <div data-qa="title" style={{position:'absolute',left:96,top:280,width:844,minHeight:150,opacity:.5+.5*enter(f,0),translate:`0 ${(1-enter(f))*15}px`,fontSize:64,fontWeight:800,letterSpacing:-2.5,lineHeight:1.06,whiteSpace:'pre-line'}}>{label}</div>
    {children}
    <div style={{position:'absolute',left:96,bottom:360,width:844,height:2,background:'#355064'}}/>
    <div style={{position:'absolute',left:96,bottom:322,color:palette.muted,fontSize:20,letterSpacing:2}}>СИГНАЛ → РАССТОЯНИЕ → КООРДИНАТЫ</div>
  </div>;
};

export const Satellite:React.FC<{x:number;y:number;phase?:number;scale?:number;floating?:boolean}> = ({x,y,phase=0,scale=1,floating=true}) => {
  const f=useCurrentFrame();
  const yy=y+(floating?Math.sin((f+phase)/30)*6:0);
  return <g transform={`translate(${x},${yy}) scale(${scale})`}>
    <g fill={palette.blue} stroke="#91C7FF" strokeWidth={1.5}>
      <rect x={-74} y={-22} width={48} height={44} rx={3}/><rect x={26} y={-22} width={48} height={44} rx={3}/>
      <path d="M-58 -22v44 M-42 -22v44 M42 -22v44 M58 -22v44 M-74 0h48 M26 0h48" opacity={.5}/>
    </g>
    <path d="M-28 0h56" stroke={palette.muted} strokeWidth={6}/>
    <rect x={-23} y={-33} width={46} height={66} rx={12} fill={palette.ink}/>
    <circle cx={0} cy={0} r={9} fill={palette.mint}/><path d="M0 32v18" stroke={palette.ink} strokeWidth={4}/>
  </g>;
};

export const Phone:React.FC<{x?:number;y?:number;scale?:number;pin?:boolean;map?:number;route?:number}> = ({x=540,y=450,scale=1,pin=true,map=0,route=0}) => {
  const f=useCurrentFrame();
  return <g transform={`translate(${x},${y}) scale(${scale})`}>
    <rect x={-145} y={-265} width={290} height={530} rx={46} fill="#03090E" stroke={palette.muted} strokeWidth={6}/>
    <rect x={-127} y={-244} width={254} height={488} rx={30} fill={palette.panel}/>
    <rect x={-45} y={-234} width={90} height={16} rx={8} fill="#03090E"/>
    <g opacity={map}>
      <path d="M-110 -140H110 M-110 -40H110 M-110 65H110 M-110 160H110 M-75 -190V200 M25 -190V200 M100 -190V200" stroke="#294B5A" strokeWidth={35}/>
      <path d="M-110 -140H110 M-110 -40H110 M-110 65H110 M-110 160H110 M-75 -190V200 M25 -190V200 M100 -190V200" stroke="#49616B" strokeWidth={3}/>
      <path d="M-120 160Q-5 110 -25 0T90 -190" stroke="#287AA4" strokeWidth={18} fill="none"/>
      <path d="M-70 135V65H25V-40H95V-140" fill="none" stroke={palette.mint} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-route}/>
      {route>.95&&<circle cx={95} cy={-140} r={12} fill={palette.gold}/>}
    </g>
    {pin&&<><circle cx={map>0?-70:0} cy={map>0?135:0} r={44+Math.sin(f/15)*3} fill={palette.mint} opacity={.1}/><circle cx={map>0?-70:0} cy={map>0?135:0} r={17} fill={palette.mint}/><circle cx={map>0?-70:0} cy={map>0?135:0} r={8} fill={palette.ink}/></>}
  </g>;
};

export const Signal:React.FC<{x1:number;y1:number;x2:number;y2:number;delay?:number}> = ({x1,y1,x2,y2,delay=0}) => {
  const f=useCurrentFrame();
  const reveal=enter(f,delay,24);
  const p=interpolate(f,[delay,delay+42],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <g opacity={reveal}>
    <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={palette.mint} strokeWidth={3} strokeDasharray="9 13" opacity={.5}/>
    <circle cx={x1+(x2-x1)*p} cy={y1+(y2-y1)*p} r={8} fill={palette.gold}/>
  </g>;
};

export const Pill:React.FC<{x:number;y:number;text:string;accent?:string;width?:number}> = ({x,y,text,accent=palette.mint,width=280}) => <g data-qa="label">
  <rect x={x} y={y} width={width} height={64} rx={18} fill={palette.panel} stroke={accent} strokeWidth={1.5}/>
  <text x={x+width/2} y={y+41} textAnchor="middle" fill={accent} fontSize={25} fontWeight={700} fontFamily="Arial, sans-serif">{text}</text>
</g>;
