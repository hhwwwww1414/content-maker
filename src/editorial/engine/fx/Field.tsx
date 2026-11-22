import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {hexToRgb} from '../tokens';
import type {FieldKind, Palette} from '../themes';

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const COMMON = `precision highp float;uniform vec2 r;uniform float t;uniform vec3 a,b,c;uniform vec2 l;uniform float s;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,w=.5;for(int i=0;i<5;i++){v+=w*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p;w*=.5;}return v;}`;

// Each field is a lit surface, not a decoration: colour comes from the scene palette.
const SHADERS: Record<Exclude<FieldKind, 'solid'>, string> = {
  // Folded cloth under a raking key light.
  silk: `void main(){vec2 u=gl_FragCoord.xy/r;vec2 p=vec2(u.x*r.x/r.y,u.y)*2.2+s;
    float d=fbm(p*.7+vec2(t*.03,-t*.02));
    float f=sin((p.x*1.4+p.y*2.6+d*4.5)*3.)+.5*sin((p.y*2.+d*6.)*2.+t*.08);
    float e=1e-2;float f2=sin(((p.x+e)*1.4+p.y*2.6+d*4.5)*3.)+.5*sin((p.y*2.+d*6.)*2.+t*.08);
    float lit=pow(clamp(.5+(f2-f)/e*.06,0.,1.),2.2);
    float fall=smoothstep(1.25,.1,distance(u,l));
    vec3 col=mix(a,mix(b,b*2.4,.6),lit*fall*1.3);col+=c*.22*pow(lit,5.)*fall;gl_FragColor=vec4(col,1.);}`,
  // Pigment folding in water.
  ink: `void main(){vec2 u=gl_FragCoord.xy/r;vec2 p=vec2(u.x*r.x/r.y,u.y)*1.7+s;
    vec2 q=vec2(fbm(p+t*.025),fbm(p+vec2(5.2,1.3)-t*.02));
    vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)),fbm(p+3.*q+vec2(8.3,2.8)+t*.02));
    float v=fbm(p+3.4*w);
    vec3 col=mix(a,b,smoothstep(.25,.75,v));col=mix(col,c,smoothstep(.62,.95,v*length(q))*.55);
    col*=mix(1.,.75,distance(u,l)*.6);gl_FragColor=vec4(col,1.);}`,
  // Volumetric light in haze from a point above the frame.
  beam: `void main(){vec2 u=gl_FragCoord.xy/r;vec2 asp=vec2(r.x/r.y,1.);vec2 d=(u-l)*asp;float ang=atan(d.x,d.y);float rad=length(d);
    float rays=fbm(vec2(ang*5.+s,t*.02+s))*.75+.25*fbm(vec2(ang*17.-s,t*.035));
    float cone=smoothstep(.75,.05,abs(ang-3.14159*sign(ang))*.75);
    float haze=fbm(u*asp*2.6+vec2(t*.015,-t*.03)+s);
    float i=pow(rays,1.7)*cone*exp(-rad*.85)*(.6+.65*haze);
    float dark=1.-dot(a,vec3(.3,.6,.1));vec3 col=mix(a,mix(b,b*1.8,dark),clamp(i*2.6,0.,1.));col+=c*pow(clamp(i*2.1,0.,1.),2.2)*.5*dark*dark;gl_FragColor=vec4(col,1.);}`,
  // Heavy uncoated stock lit from one side.
  paper: `void main(){vec2 u=gl_FragCoord.xy/r;vec2 p=u*r/r.y;
    float fib=fbm(p*vec2(60.,180.)+s)*.5+fbm(p*vec2(190.,60.)+s)*.5;float cloud=fbm(p*2.4+s);
    float fall=smoothstep(1.35,.15,distance(u,l));
    vec3 col=mix(b,a,clamp(fall*.9+cloud*.25,0.,1.));col*=.985+.03*fib;gl_FragColor=vec4(col,1.);}`,
  // A slow, soft colour mesh with no visible bands.
  gradient: `void main(){vec2 u=gl_FragCoord.xy/r;vec2 p=vec2(u.x*r.x/r.y,u.y)+s;
    float v=fbm(p*1.15+vec2(t*.03,-t*.024));float w=fbm(p*.9+vec2(-t*.02,t*.03)+7.);
    vec3 col=mix(a,b,smoothstep(.22,.8,v));col=mix(col,c,smoothstep(.6,.9,w)*.12);
    col*=1.+.09*(1.-distance(u,l));gl_FragColor=vec4(col,1.);}`,
};

const compile = (gl: WebGLRenderingContext, kind: number, source: string) => {
  const shader = gl.createShader(kind)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Field shader: ' + gl.getShaderInfoLog(shader));
  return shader;
};

type Program = {gl: WebGLRenderingContext; u: Record<string, WebGLUniformLocation | null>};
const setup = (canvas: HTMLCanvasElement, kind: Exclude<FieldKind, 'solid'>): Program => {
  const gl = canvas.getContext('webgl', {preserveDrawingBuffer: true, antialias: false, alpha: false});
  if (!gl) throw new Error('WebGL is unavailable: render with --gl=angle (studio/render.mjs does this)');
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, COMMON + SHADERS[kind]));
  gl.linkProgram(program);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const at = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(at);
  gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(['r', 't', 'a', 'b', 'c', 'l', 's'].map((name) => [name, gl.getUniformLocation(program, name)]));
  return {gl, u};
};

const vec = (hex: string) => hexToRgb(hex).map((c) => c / 255) as [number, number, number];
const seedOf = (text: string) => { let h = 7; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 9973; return (h / 9973) * 40; };

/** A deterministic shader background. Half resolution is enough for soft light, and the grain restores texture. */
export const Field: React.FC<{kind: FieldKind; palette: Palette; seed?: string; light?: [number, number]; strength?: number; speed?: number}> = ({kind, palette, seed = 'field', light = [0.5, 1.05], strength = 1, speed = 1}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const program = useRef<Program | null>(null);
  useLayoutEffect(() => {
    if (kind === 'solid' || !ref.current) return;
    if (!program.current) program.current = setup(ref.current, kind);
    const {gl, u} = program.current;
    gl.viewport(0, 0, ref.current.width, ref.current.height);
    gl.uniform2f(u.r, ref.current.width, ref.current.height);
    gl.uniform1f(u.t, (frame / fps) * speed * 10);
    gl.uniform3fv(u.a, vec(palette.bg));
    gl.uniform3fv(u.b, vec(palette.bg2));
    gl.uniform3fv(u.c, vec(palette.accent));
    gl.uniform2f(u.l, light[0], 1 - light[1]);
    gl.uniform1f(u.s, seedOf(seed));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, [frame, fps, kind, palette, light, seed, speed]);
  useEffect(() => () => { program.current?.gl.getExtension('WEBGL_lose_context')?.loseContext(); program.current = null; }, []);
  if (kind === 'solid') return <div style={{position: 'absolute', inset: 0, background: palette.bg}}/>;
  return <canvas ref={ref} width={Math.round(width / 2)} height={Math.round(height / 2)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: strength}}/>;
};
