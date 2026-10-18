import {V,I,mm,transform,translate,scaled,rotX,rotY,ortho,lookAt,rigPose,project,exampleLibrary,clone,interpolate} from './spriteforge.js';

export const colors={asphalt:'#393636',concrete:'#8c887b',line:'#b9ac79',olive:'#646b49',rust:'#75513c',dark:'#292b28',blood:'#84332e'};
const rgb=c=>c.match(/\w\w/g).map(n=>parseInt(n,16)/255);
function boxGeometry(){const out=[];for(let a=0;a<3;a++)for(const s of [-1,1]){const b=(a+1)%3,c=(a+2)%3,n=[0,0,0];n[a]=s;const p=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{const r=[0,0,0];r[a]=s;r[b]=u;r[c]=v;return r;});for(const i of [0,1,2,0,2,3])out.push(...p[i],...n);}return out;}
function sphereGeometry(){const out=[],point=(u,v)=>[Math.sin(v)*Math.cos(u),Math.cos(v),Math.sin(v)*Math.sin(u)];for(let j=0;j<4;j++)for(let i=0;i<8;i++){const a=point(i/8*Math.PI*2,j/4*Math.PI),b=point((i+1)/8*Math.PI*2,j/4*Math.PI),c=point((i+1)/8*Math.PI*2,(j+1)/4*Math.PI),d=point(i/8*Math.PI*2,(j+1)/4*Math.PI);for(const tri of [[a,b,c],[a,c,d]]){const n=V.unit(V.add(V.add(...tri.slice(0,2)),tri[2]));for(const p of tri)out.push(...p,...n);}}return out;}
const BOX=boxGeometry(),SPHERE=sphereGeometry();
export function bake(parts){const out=[];for(const p of parts){const m=p.m,col=rgb(p.color||'#888877'),geo=p.box===false?SPHERE:BOX,cols=[0,4,8].map(k=>[m[k],m[k+1],m[k+2]]),nm=cols.map(v=>V.scale(v,1/Math.max(.00001,V.dot(v,v))));for(let i=0;i<geo.length;i+=6){const v=transform(m,geo.slice(i,i+3)),n=V.unit([0,1,2].map(k=>nm[0][k]*geo[i+3]+nm[1][k]*geo[i+4]+nm[2][k]*geo[i+5]));out.push(...v,...n,...col);}}return new Float32Array(out);}
export function block(x,y,z,w,h,d,color,yaw=0){return {m:scaled(mm(translate([x,y,z]),rotY(yaw)),[w/2,h/2,d/2]),color};}
const clips=new Map(exampleLibrary().map(c=>[c.id,c])),cache=new Map();
// Bake local-space geometry once per animation frame, shared by every character.
export function characterMesh(kind,state,time,moving){
 const zombie=kind==='zombie',id=state==='dead'?'hit':state==='hit'?'hit':state==='attack'?'punch':zombie?'zombie':moving?'run':'idle';
 const clip=clips.get(id),f=(state==='dead'||state==='hit'||state==='attack')?Math.min(clip.frames.length-1,Math.floor(time*clip.fps)):Math.floor(time*clip.fps)%clip.frames.length;
 const recoil=state==='shoot',reload=state==='reload',key=[kind,state,id,f,recoil,reload].join(':');if(cache.has(key))return cache.get(key);
 let p=clone(clip.frames[f]);
 if(!zombie&&state!=='dead'&&state!=='hit'){
  const aim=clone(clips.get(recoil?'fire-pistol':'aim-pistol').frames[recoil?2:0]);
  for(const j of ['torso','head','upperArmL','upperArmR','forearmL','forearmR','handL','handR'])p.angles[j]=aim.angles[j];
  p.weapon='pistol';p.weaponHand='R';p.support=true;
  if(reload){p.angles.upperArmR=[-35,-10,0];p.angles.forearmR=[-95,0,0];p.angles.head=[20,0,0];}
 }
 const rig=rigPose(p),parts=[];
 for(const part of rig.parts){const name=part.name;let color=zombie?'#a4aa8a':'#b99b7c';
  if(/torso|abdomen|upperArm|shoulder|waist/.test(name))color=zombie?'#c4b695':'#626b4e';
  if(/pelvis|thigh|shin|hip|knee/.test(name))color=zombie?'#635641':'#515963';
  if(/foot|ankle/.test(name))color=zombie?'#8f967a':'#66503c';
  if(/prop-/.test(name))color='#333638';
  parts.push({...part,color,box:/torso|pelvis|foot|prop-/.test(name)||part.box===true?true:false});
  if(name==='head'){
   if(!zombie)parts.push({m:mm(part.m,scaled(translate([0,.75,-.1]),[1.08,.45,1.02])),color:'#51402f',box:true});
   for(const x of [-.42,.42])parts.push({m:mm(part.m,scaled(translate([x,.1,.88]),[.19,.12,.13])),color:'#242624',box:true});
   parts.push({m:mm(part.m,scaled(translate([0,-.55,.8]),[.55,.23,.23])),color:zombie?'#81382e':'#51402f',box:true});
  }
  if(name==='torso'){
   if(!zombie){parts.push({m:mm(part.m,scaled(translate([0,-.02,-1]),[.82,.9,.65])),color:'#715b41',box:true});parts.push({m:mm(part.m,scaled(translate([0,0,.91]),[.4,.86,.13])),color:'#b6ab8f',box:true});}
   else parts.push({m:mm(part.m,scaled(translate([.5,.3,.93]),[.33,.3,.12])),color:'#84332e',box:true});
  }
 }
 if(state==='dead'){
  const progress=Math.min(1,f/(clip.frames.length-1));
  const fall=mm(translate([0,.17*progress,0]),rotX(88*progress));
  for(const part of parts)part.m=mm(fall,part.m);
 }
 const mesh=bake(parts);cache.set(key,mesh);return mesh;
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
 screenGround(clientX,clientY){return [this.target[0]+(clientX/innerWidth*2-1)*this.half*innerWidth/innerHeight,this.target[2]+(clientY/innerHeight*2-1)*this.half*Math.SQRT2];}
}
