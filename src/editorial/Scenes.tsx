import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {enter, palette, Phone, Pill, Satellite, Signal} from './Design';

const Stage:React.FC<{children:React.ReactNode}> = ({children}) => <svg data-qa="diagram" viewBox="0 0 1080 960" style={{position:'absolute',left:0,top:430,width:1080,height:960}}>{children}</svg>;

export const PhoneScene:React.FC = () => {
  const f=useCurrentFrame();
  return <Stage><g opacity={enter(f,3)} transform={`translate(0 ${(1-enter(f,3))*22})`}>
    <Phone x={520} y={430} scale={1.1}/>
    <Pill x={360} y={770} width={320} text="ИНТЕРНЕТ ОТКЛЮЧЁН" accent={palette.gold}/>
    <path d="M790 340q50-40 100 0 M806 365q34-27 68 0 M822 390q18-14 36 0 M798 310l88 105" fill="none" stroke={palette.gold} strokeWidth={6} strokeLinecap="round"/>
  </g></Stage>;
};

export const SatelliteScene:React.FC = () => {
  const f=useCurrentFrame();
  return <Stage>
    <path d="M160 600Q530 470 920 600" fill="none" stroke="#31576D" strokeWidth={2}/>
    <g opacity={enter(f,2)}>
      <Satellite x={225} y={200}/><Satellite x={800} y={180} phase={30}/><Satellite x={515} y={80} phase={60} scale={.85}/>
      <Phone x={520} y={650} scale={.57}/>
    </g>
    <Signal x1={225} y1={245} x2={520} y2={650} delay={12}/>
    <Signal x1={800} y1={225} x2={520} y2={650} delay={22}/>
    <Signal x1={515} y1={125} x2={520} y2={650} delay={32}/>
    <g opacity={enter(f,45)}><Pill x={325} y={860} width={390} text="ПОЛОЖЕНИЕ + ВРЕМЯ"/></g>
  </Stage>;
};

export const RangingScene:React.FC = () => {
  const f=useCurrentFrame();
  const travel=interpolate(f,[18,66],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <Stage>
    <defs><clipPath id="ranging-bounds"><rect x={96} y={50} width={844} height={720} rx={30}/></clipPath></defs>
    <g clipPath="url(#ranging-bounds)">
      {[0,1,2].map(i=><circle key={i} cx={220} cy={200} r={80+i*135+travel*85} fill="none" stroke={palette.blue} strokeWidth={2} opacity={(.26-i*.05)*enter(f,12)}/>)}
    </g>
    <Satellite x={220} y={200}/><Phone x={790} y={600} scale={.68}/>
    <Signal x1={235} y1={235} x2={790} y2={600} delay={18}/>
    <g opacity={enter(f,40)}>
      <path d="M240 560v110 M240 615h280 M505 605l15 10-15 10" stroke={palette.muted} strokeWidth={3} fill="none"/>
      <text x={375} y={590} textAnchor="middle" fill={palette.ink} fontSize={39}>Δt</text>
      <Pill x={300} y={820} width={440} text="ДАЛЬНОСТЬ ≈ c × Δt"/>
    </g>
  </Stage>;
};

// Every range circle passes through this point. This is an explicit 2D teaching
// diagram; real GPS solves three spatial coordinates plus receiver clock bias.
export const solution={x:520,y:450};
export const satellites=[{x:240,y:200},{x:805,y:180},{x:235,y:700},{x:815,y:700}];
export const IntersectionScene:React.FC = () => {
  const f=useCurrentFrame();
  return <Stage>
    <defs><clipPath id="range-bounds"><rect x={96} y={50} width={844} height={745} rx={30}/></clipPath></defs>
    <g clipPath="url(#range-bounds)">
      {satellites.map((s,i)=>{
        const radius=Math.hypot(solution.x-s.x,solution.y-s.y);
        const settle=enter(f,12+i*11,28);
        return <circle key={i} cx={s.x} cy={s.y} r={radius*(.88+.12*settle)} fill="none" stroke={i===3?palette.gold:palette.blue} strokeWidth={3} opacity={enter(f,8+i*11)*.75}/>;
      })}
    </g>
    {satellites.map((s,i)=><Satellite key={i} x={s.x} y={s.y} scale={.65} floating={false}/>)}
    <g opacity={enter(f,62)}>
      <circle cx={solution.x} cy={solution.y} r={36} fill={palette.mint} opacity={.16}/>
      <circle cx={solution.x} cy={solution.y} r={13} fill={palette.mint}/>
      <path d={`M${solution.x-52} ${solution.y}h20 M${solution.x+32} ${solution.y}h20 M${solution.x} ${solution.y-52}v20 M${solution.x} ${solution.y+32}v20`} stroke={palette.mint} strokeWidth={2}/>
    </g>
    <g opacity={enter(f,75)}><Pill x={285} y={815} width={470} text="КООРДИНАТЫ + ПОПРАВКА ЧАСОВ" accent={palette.gold}/></g>
    <text x={520} y={927} textAnchor="middle" fill={palette.muted} fontSize={23}>Условная 2D-схема</text>
  </Stage>;
};

export const MapScene:React.FC = () => {
  const f=useCurrentFrame();
  return <Stage>
    <Phone x={520} y={425} scale={1.17} map={enter(f,5,24)} route={enter(f,30,42)}/>
    <g opacity={enter(f,65)}><Pill x={345} y={805} width={350} text="КАРТА УЖЕ СКАЧАНА"/></g>
  </Stage>;
};

export const visuals:Record<string,React.FC>={phone:PhoneScene,satellites:SatelliteScene,ranging:RangingScene,intersection:IntersectionScene,map:MapScene};
