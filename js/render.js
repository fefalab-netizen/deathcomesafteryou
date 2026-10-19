import {TYPES} from './zombies.js';
import {V,I,mm,transform,translate,scaled,rotX,rotY,ortho,lookAt,rigPose,armFrame,project,exampleLibrary,clone,interpolate,gait} from './spriteforge.js';

export const colors={asphalt:'#393636',concrete:'#8c887b',line:'#b9ac79',olive:'#646b49',rust:'#75513c',dark:'#292b28',blood:'#84332e'};
const rgb=c=>c.match(/\w\w/g).map(n=>parseInt(n,16)/255);
function boxGeometry(){const out=[];for(let a=0;a<3;a++)for(const s of [-1,1]){const b=(a+1)%3,c=(a+2)%3,n=[0,0,0];n[a]=s;const p=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{const r=[0,0,0];r[a]=s;r[b]=u;r[c]=v;return r;});for(const i of [0,1,2,0,2,3])out.push(...p[i],...n);}return out;}
function sphereGeometry(){const out=[],point=(u,v)=>[Math.sin(v)*Math.cos(u),Math.cos(v),Math.sin(v)*Math.sin(u)];for(let j=0;j<4;j++)for(let i=0;i<8;i++){const a=point(i/8*Math.PI*2,j/4*Math.PI),b=point((i+1)/8*Math.PI*2,j/4*Math.PI),c=point((i+1)/8*Math.PI*2,(j+1)/4*Math.PI),d=point(i/8*Math.PI*2,(j+1)/4*Math.PI);for(const tri of [[a,b,c],[a,c,d]]){const n=V.unit(V.add(V.add(...tri.slice(0,2)),tri[2]));for(const p of tri)out.push(...p,...n);}}return out;}
const BOX=boxGeometry(),SPHERE=sphereGeometry();
// Square cross-section with small clipped corners; flat normals keep broad faces readable.
function bevelGeometry(){
 const ring=[[-.78,-1],[.78,-1],[1,-.78],[1,.78],[.78,1],[-.78,1],[-1,.78],[-1,-.78]],out=[];
 const triangle=(a,b,c,n)=>{for(const p of [a,b,c])out.push(...p,...n);};
 for(let i=0;i<8;i++){const [x,z]=ring[i],[xx,zz]=ring[(i+1)%8],n=V.unit([zz-z,0,x-xx]);
  triangle([x,-1,z],[xx,-1,zz],[xx,1,zz],n);triangle([x,-1,z],[xx,1,zz],[x,1,z],n);
  for(const y of [-1,1])triangle([0,y,0],[x,y,z],[xx,y,zz],[0,y,0]);
 }return out;
}
const BEVEL=bevelGeometry();
export function bake(parts){const out=[];for(const p of parts){const m=p.m,col=rgb(p.color||'#888877'),geo=p.geometry||(p.box===false?SPHERE:BOX),cols=[0,4,8].map(k=>[m[k],m[k+1],m[k+2]]),nm=cols.map(v=>V.scale(v,1/Math.max(.00001,V.dot(v,v))));for(let i=0;i<geo.length;i+=6){const v=transform(m,geo.slice(i,i+3)),n=V.unit([0,1,2].map(k=>nm[0][k]*geo[i+3]+nm[1][k]*geo[i+4]+nm[2][k]*geo[i+5]));out.push(...v,...n,...col);}}return new Float32Array(out);}
export function block(x,y,z,w,h,d,color,yaw=0){return {m:scaled(mm(translate([x,y,z]),rotY(yaw)),[w/2,h/2,d/2]),color};}
const clips=new Map(exampleLibrary().map(c=>[c.id,c])),cache=new Map();
export const MUZZLE=[.21,1.19,.87];
export function muzzlePosition(a){const clock=a.moving?a.animation:(a.idleAnimation||0),m=characterMesh('human','shoot',0,a.moving,a.moveYaw||0,clock).muzzle||MUZZLE,c=Math.cos(a.yaw),s=Math.sin(a.yaw);return [a.x+c*m[0]+s*m[2],m[1],a.z-s*m[0]+c*m[2]];}
// 24 Hz interpolated source poses. Geometry stays shared across actors of the same type.
export function characterMesh(kind,state,time,moving,moveYaw=0,locomotionTime=time){
 const zombie=kind!=='human',type=TYPES[kind]||TYPES.normal;
 const id=state==='dead'||state==='hit'?'hit':zombie?(kind==='runner'?'zombie-feral':'zombie'):moving?'walk':'idle';
 const clip=clips.get(id),oneShot=state==='dead'||state==='hit',duration=(clip.frames.length-1)/clip.fps;
 const baseTime=!oneShot?locomotionTime:time;
 const directionalWalk=!zombie&&moving&&!oneShot;
 const tick=Math.floor((oneShot?Math.min(time,duration):baseTime%(directionalWalk?1:clip.frames.length/clip.fps))*24);
 const phase=oneShot&&time>=duration?duration:tick/24,frame=phase*clip.fps,f=Math.min(Math.floor(frame),clip.frames.length-1),next=oneShot?Math.min(f+1,clip.frames.length-1):(f+1)%clip.frames.length;
 const direction=directionalWalk?((Math.round(moveYaw/(Math.PI/8))%16)+16)%16:0;
 const action=state==='attack'?Math.min(15,Math.floor(time*16)):state==='shoot'?Math.min(5,Math.floor(time*30)):state==='reload'?Math.min(23,Math.floor(time*18)):0;
 const key=[kind,state,id,moving,tick,direction,action,oneShot&&time>=duration].join(':');if(cache.has(key))return cache.get(key);
 let p=directionalWalk?gait('walk',phase):interpolate(clip.frames[f],clip.frames[next],frame-f);
 if(directionalWalk){
  // Move the foot targets relative to fixed hips. The pelvis and feet keep the
  // torso's heading, including side steps and backward diagonal steps.
  const angle=direction*Math.PI/8;
  for(const side of ['L','R']){const foot=p.feet[side],stride=foot[2];foot[0]+=stride*Math.sin(angle)*.65;foot[2]=stride*Math.cos(angle);}
 }
 if(!zombie&&state!=='dead'&&state!=='hit'){
  const aim=clips.get('aim-pistol').frames[0];
  for(const j of ['torso','head','upperArmL','upperArmR','forearmL','forearmR','handL','handR'])p.angles[j]=clone(aim.angles[j]);
  p.angles.torso=[2,0,0];p.angles.head=[0,0,0];p.angles.upperArmR=[-86,-5,0];p.angles.forearmR=[-8,0,0];p.angles.handR=[0,0,0];p.weapon='';p.support=false;
  const recoil=state==='shoot'?Math.pow(1-action/5,2)*8:0;
  p.angles.upperArmR[0]-=recoil;p.angles.forearmR[0]-=recoil;
  if(state==='reload'){const reach=Math.sin(action/23*Math.PI);p.angles.upperArmR[0]+=38*reach;p.angles.forearmR[0]-=57*reach;p.angles.upperArmL[0]+=25*reach;p.angles.forearmL[0]-=15*reach;p.angles.head=[15*reach,0,0];}
 }
 if(zombie&&state!=='hit'&&state!=='dead'){
  p.angles.head[1]+=Math.sin(phase*4)*4;
  if(state==='windup'){p.root[1]-=.15;p.angles.torso=[32,0,0];p.angles.upperArmL=[25,-15,0];p.angles.upperArmR=[25,15,0];}
  if(kind==='brute'){p.angles.torso=[19,0,Math.sin(phase*3)*3];p.angles.upperArmL=[-18,-18,0];p.angles.upperArmR=[-22,18,0];}
  if(kind==='worker'){p.angles.upperArmL=[-38,-12,0];p.angles.upperArmR=[-43,12,0];}
  if(kind==='crawler'){
   const cycle=phase*7;p.root[1]=.29;p.angles.torso=[72,0,Math.sin(cycle)*5];p.angles.head=[-45,0,0];p.feet={};
   p.angles.thighL=[-60+15*Math.sin(cycle),-12,0];p.angles.thighR=[-60-15*Math.sin(cycle),12,0];p.angles.shinL=[110,0,0];p.angles.shinR=[110,0,0];
   p.angles.upperArmL=[-30+22*Math.sin(cycle),-12,0];p.angles.upperArmR=[-30-22*Math.sin(cycle),12,0];p.angles.forearmL=[-40,0,0];p.angles.forearmR=[-40,0,0];
  }
  if(state==='attack'){
   const t=action/16,wind=Math.min(1,t/.28),strike=Math.max(0,(t-.28)/.17),arm=t<.28?-65-60*wind:t<.45?-125+105*Math.min(1,strike):-20-45*Math.min(1,(t-.45)/.5);
   p.angles.upperArmL=[arm,-15,0];p.angles.upperArmR=[arm,15,0];p.angles.forearmL=[-20,0,0];p.angles.forearmR=[-20,0,0];p.angles.torso[0]+=t<.45?-10*wind:22*Math.min(1,strike);
  }
 }
 if(kind==='crawler'&&(state==='hit'||state==='dead')){p.root[1]=.29;p.angles.torso=[72,0,0];p.angles.head=[-45,0,0];p.feet={};for(const side of ['L','R']){p.angles['thigh'+side]=[-60,0,0];p.angles['shin'+side]=[110,0,0];}}
 const rig=rigPose(p),parts=[];let muzzle=null;
 const detail=(parent,pos,size,color,box=true)=>parts.push({m:mm(parent,scaled(translate(pos),size)),color,box});
 for(const original of rig.parts){const part={...original},name=part.name;
  let color=zombie?type.skin:'#b99b7c';
  if(/torso|abdomen|upperArm|shoulder|waist/.test(name))color=zombie?type.shirt:'#626b4e';
  if(/pelvis|thigh|shin|hip|knee/.test(name))color=zombie?type.pants:'#515963';
  if(/foot|ankle/.test(name))color=zombie?(kind==='worker'?'#514b40':type.skin):'#66503c';
  if(zombie&&/hand/.test(name))color='#853e36';
  parts.push({...part,color,box:true,geometry:/head|torso|pelvis/.test(name)?BEVEL:BOX});
  if(name==='head'){
   if(!zombie||kind==='runner'||kind==='brute')detail(part.m,[0,.7,-.1],[1.06,.42,1.02],'#443a32');
   for(const x of [-.42,.42]){detail(part.m,[x,.1,.88],[.24,.18,.14],'#34332c');detail(part.m,[x,.12,1],[.085,.055,.04],zombie?'#d9c690':'#b4ba9e');}
   detail(part.m,[0,-.55,.8],[.55,.23,.23],zombie?'#81382e':'#51402f');
   if(zombie)for(const x of [-.25,0,.25])detail(part.m,[x,-.46,1.01],[.07,.08,.04],'#d2c3a2');
   if(kind==='worker'){detail(part.m,[0,.77,0],[1.2,.55,1.15],'#c29442');detail(part.m,[0,.43,.12],[1.4,.1,1.35],'#a77731');}
  }
  if(name==='torso'){
   if(!zombie){detail(part.m,[0,-.02,-1],[.82,.9,.65],'#715b41');detail(part.m,[0,0,.91],[.4,.86,.13],'#b6ab8f');for(const x of [-.66,.66])detail(part.m,[x,0,.82],[.12,.95,.1],'#4e4434');detail(part.m,[0,-.45,-1.65],[.7,.3,.1],'#8c7452');}
   else{detail(part.m,[.5,.3,.86],[.33,.3,.12],'#84332e');detail(part.m,[-.25,-.5,.85],[.3,.18,.12],'#74392f');}
   if(kind==='worker')for(const x of [-.6,.6]){detail(part.m,[x,0,.88],[.22,.96,.12],'#cf8d3f');detail(part.m,[x,0,1.01],[.08,.96,.03],'#d3c9a7');}
   if(kind==='brute')detail(part.m,[0,-.35,.3],[1.1,.9,1.2],'#bfa991');
  }
  if(name==='thighR'&&!zombie)detail(part.m,[.1,-.55,.85],[.55,.2,.15],'#b99b7c');
 }
 if(!zombie&&state!=='dead'){
  // Barrel faces the same local +Z direction used by the ballistic ray.
  const hand=armFrame(rig.p,'R'),grip=V.add(hand.center,[0,.06,.08]);
  const gun=mm(translate(grip),state==='reload'||state==='hit'?mm(hand.m,rotX(90)):rotX(state==='shoot'?-8*Math.pow(1-action/5,2):0));
  muzzle=transform(gun,[0,0,.21]);
  for(const b of [block(0,0,0,.09,.095,.42,'#333a3c'),block(0,-.1,-.10,.075,.18,.10,'#443c32'),block(0,.058,-.1,.04,.025,.04,'#929284')])parts.push({...b,m:mm(gun,b.m)});
 }
 const proportions=zombie?scaled(I(),type.scale):I();
 let fall=I();if(state==='dead'){const progress=Math.min(1,phase/duration);fall=mm(translate([0,.20*progress,0]),rotX((kind==='crawler'?12:88)*progress));}
 for(const part of parts)part.m=mm(fall,mm(proportions,part.m));
 // Place death poses on the ground using their actual geometry, not a guessed offset.
 if(state==='dead'){let lowest=Infinity;for(const part of parts){const geo=part.geometry||BOX;for(let i=0;i<geo.length;i+=6)lowest=Math.min(lowest,transform(part.m,geo.slice(i,i+3))[1]);}if(lowest<.025)for(const part of parts)part.m[13]+=.025-lowest;}
 const mesh=bake(parts);mesh.muzzle=muzzle;cache.set(key,mesh);
 // Bound geometry cache on mobile; poses are cheap to recreate after eviction.
 if(cache.size>480)cache.delete(cache.keys().next().value);
 return mesh;
}
export class WorldRenderer{
 constructor(canvas){this.canvas=canvas;const g=this.g=canvas.getContext('webgl',{alpha:false,antialias:false});if(!g)throw new Error('WebGL is unavailable. Try a browser with hardware acceleration enabled.');
 const vs='attribute vec3 pos;attribute vec3 normal;attribute vec3 color;uniform mat4 vp;varying vec3 c;void main(){float light=.48+.52*max(dot(normalize(normal),normalize(vec3(-.6,1.,.5))),0.);c=color*light;gl_Position=vp*vec4(pos,1.);}';
 const fs='precision mediump float;varying vec3 c;void main(){gl_FragColor=vec4(c,1.);}';
 const shader=(type,src)=>{const s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s;};
 this.program=g.createProgram();g.attachShader(this.program,shader(g.VERTEX_SHADER,vs));g.attachShader(this.program,shader(g.FRAGMENT_SHADER,fs));g.linkProgram(this.program);if(!g.getProgramParameter(this.program,g.LINK_STATUS))throw Error(g.getProgramInfoLog(this.program));g.useProgram(this.program);this.vpLocation=g.getUniformLocation(this.program,'vp');this.attrs=['pos','normal','color'].map(n=>g.getAttribLocation(this.program,n));for(const a of this.attrs)g.enableVertexAttribArray(a);g.enable(g.DEPTH_TEST);this.staticBuffer=g.createBuffer();this.dynamicBuffer=g.createBuffer();this.dynamic=new Float32Array(2000000);this.used=0;this.target=[0,0,0];this.half=10;
 }
 setWorld(parts){const g=this.g,data=bake(parts);g.bindBuffer(g.ARRAY_BUFFER,this.staticBuffer);g.bufferData(g.ARRAY_BUFFER,data,g.STATIC_DRAW);this.staticCount=data.length/9;}
 resize(quality){const dpr=Math.min(window.devicePixelRatio||1,quality),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.half=Math.max(8.5,14/(innerWidth/innerHeight));}
 begin(x,z){this.target=[x,0,z];this.used=0;this.vp=mm(ortho(-this.half*innerWidth/innerHeight,this.half*innerWidth/innerHeight,-this.half,this.half,.1,110),lookAt([x,30,z+30],[x,0,z]));}
 append(mesh,x=0,y=0,z=0,yaw=0,fade=1){if(this.used+mesh.length>this.dynamic.length){const next=new Float32Array(Math.max(this.dynamic.length*2,this.used+mesh.length));next.set(this.dynamic);this.dynamic=next;}const c=Math.cos(yaw),s=Math.sin(yaw),d=this.dynamic;for(let i=0;i<mesh.length;i+=9){const k=this.used;d[k]=c*mesh[i]+s*mesh[i+2]+x;d[k+1]=mesh[i+1]+y;d[k+2]=-s*mesh[i]+c*mesh[i+2]+z;d[k+3]=c*mesh[i+3]+s*mesh[i+5];d[k+4]=mesh[i+4];d[k+5]=-s*mesh[i+3]+c*mesh[i+5];d[k+6]=mesh[i+6]*fade;d[k+7]=mesh[i+7]*fade;d[k+8]=mesh[i+8]*fade;this.used+=9;}}
 draw(){const g=this.g;g.viewport(0,0,this.canvas.width,this.canvas.height);g.clearColor(.13,.16,.13,1);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.uniformMatrix4fv(this.vpLocation,false,this.vp);const bind=buffer=>{g.bindBuffer(g.ARRAY_BUFFER,buffer);this.attrs.forEach((a,i)=>g.vertexAttribPointer(a,3,g.FLOAT,false,36,i*12));};bind(this.staticBuffer);g.drawArrays(g.TRIANGLES,0,this.staticCount);bind(this.dynamicBuffer);g.bufferData(g.ARRAY_BUFFER,this.dynamic.subarray(0,this.used),g.DYNAMIC_DRAW);g.drawArrays(g.TRIANGLES,0,this.used/9);}
 screenGround(clientX,clientY,height=0){return [this.target[0]+(clientX/innerWidth*2-1)*this.half*innerWidth/innerHeight,this.target[2]+(clientY/innerHeight*2-1)*this.half*Math.SQRT2+height];}
}


