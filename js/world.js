import {mm,rotX,translate,scaled} from './spriteforge.js';
import {block,colors} from './render.js';
export const bounds=80,obstacles=[],world=[];
const add=(...a)=>world.push(block(...a));
function solid(x,z,w,d,h,color){obstacles.push({x,z,w:w/2,d:d/2});add(x,h/2,z,w,h,d,color);}
let seed=52;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
add(0,-.22,0,164,.4,164,'#484a3a');add(0,-.06,0,48,.12,48,colors.asphalt);
// Faded parking bays, pavement repairs, aggregate and weeds.
for(const x of [-17,-11,-5,5,11,17])for(const z of [-16,12]){add(x,.009,z,.09,.015,7,'#a5986a');add(x+2.8,.009,z+3.5,5.6,.015,.09,'#a5986a');}
for(let z=-21;z<24;z+=4)add(0,.012,z,.13,.018,1.8,'#ae9252');
for(let i=0;i<150;i++){const x=rand()*46-23,z=rand()*46-23;add(x,.009,z,.08+rand()*.22,.022,.08+rand()*.2,rand()>.5?'#55514b':'#302f2e',rand()*180);}
for(let i=0;i<25;i++){const x=rand()*44-22,z=rand()*44-22;add(x,.012,z,.03,.02,.4+rand()*1.4,'#222722',rand()*180);}
// Leave four perimeter entry routes open.
for(const x of [-16,16]){solid(x,-23,13,.7,1.1,'#77756b');solid(x,23,13,.7,1.1,'#77756b');}
for(const z of [-15,15]){solid(-23,z,.7,15,1.1,'#77756b');solid(23,z,.7,15,1.1,'#77756b');}
// Low-poly 12-sided tires, with separate rims, replace the old square wheels.
function wheel(x,y,z,r,width){const geometry=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2,b=(i+1)/12*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);const vertices=[[-1,ca,sa],[1,ca,sa],[1,cb,sb],[-1,cb,sb]],n=[0,Math.cos((a+b)/2),Math.sin((a+b)/2)];for(const k of [0,1,2,0,2,3])geometry.push(...vertices[k],...n);for(const s of [-1,1])for(const v of [[s,0,0],[s,ca,sa],[s,cb,sb]])geometry.push(...v,s,0,0);}const m=scaled(translate([x,y,z]),[width/2,r,r]);world.push({m,color:'#242624',geometry});for(const s of [-1,1])world.push({m:scaled(translate([x+s*(width/2+.006),y,z]),[.012,r*.52,r*.52]),color:'#827a68',box:false});}
function car(x,z,color,style='suv'){
 const van=style==='van',pickup=style==='pickup',police=style==='police';
 const length=van?5.2:4.7,front=length/2,roof=van?2.2:1.65;
 obstacles.push({x,z,w:1.23,d:length/2+.12});
 const b=(xx,y,zz,w,h,d,col)=>add(x+xx,y,z+zz,w,h,d,col);
 b(0,.40,0,1.9,.22,length-.2,'#2e302a');b(0,.78,0,2.15,.62,length,color);
 b(0,1.10,front-.7,2.1,.15,1.25,police?'#303637':color);
 if(pickup){
  b(0,1.34,.25,1.9,.72,1.7,color);b(0,1.75,.25,2,.13,1.8,color);
  b(0,1.38,1.13,1.7,.48,.05,'#414749');b(0,1.4,-.63,1.65,.43,.05,'#414749');
  b(0,1.02,-1.46,1.8,.06,1.5,'#393c36');
  for(const s of [-1,1])b(s*1.01,1.2,-1.4,.14,.48,1.8,color);
  b(0,1.2,-front,2.12,.48,.12,color);
  for(let i=-3;i<=3;i++)b(i*.22,1.065,-1.4,.035,.02,1.65,'#55554a');
 }else{
  b(0,(1.04+roof)/2,-.3,1.94,roof-1.04,van?3.5:2.5,color);
  b(0,roof+.04,-.3,2.03,.12,van?3.6:2.6,police?'#d3ccad':color);
  const glass=block(x,van?1.56:1.35,z+(van?1.43:1.01),1.75,van?.66:.50,.055,'#414749');glass.m=mm(translate([x,van?1.56:1.35,z+(van?1.43:1.01)]),mm(rotX(18),scaled(translate([0,0,0]),[.875,van?.33:.25,.028])));world.push(glass);
  if(!van)b(0,1.35,-1.57,1.7,.42,.055,'#414749');
 }
 for(const s of [-1,1]){
  const glazing=van?1:pickup?1:2;
  for(let i=0;i<glazing;i++){const zz=pickup?.3:van?.92:.47-i*1.04;b(s*.986,van?1.6:1.35,zz,.025,van?.54:.42,pickup?1.35:van?.85:.85,'#44494b');}
  b(s*1.11,1.18,1.12,.23,.22,.27,'#3b403b');
  b(s*1.082,.83,pickup?.25:.25,.025,.48,.025,'#44483d');b(s*1.10,1.02,.1,.035,.045,.20,'#b5aa91');
  b(s*1.05,.6,0,.10,.12,length-.35,'#686557');
  for(const zz of [-1.5,1.5])wheel(x+s*1.02,.47,z+zz,.46,.35);
  b(s*.77,.87,front+.015,.45,.29,.05,'#d4c39b');b(s*.99,.83,front+.035,.12,.20,.05,'#b97e40');b(s*.8,.83,-front-.025,.34,.25,.05,'#873c32');
  for(let i=0;i<3;i++)b(s*1.084,.67+i*.075,-.7+i*.2,.018,.13,.28,'#79583e');
 }
 b(0,.78,front+.04,1,.3,.07,'#2b302d');for(let i=0;i<3;i++)b(0,.67+i*.095,front+.08,.95,.022,.02,'#6d7168');
 for(const end of [-1,1])b(0,.46,end*(front+.09),2.23,.22,.18,'#8c887a');
 b(0,.49,front+.19,.4,.15,.02,'#b5ab8e');
 b(.38,1.185,front-.67,.38,.016,.42,'#78634a');b(-.6,1.185,front-.4,.22,.016,.3,'#777c4f');
 if(style==='suv')for(const s of [-1,1])b(s*.7,roof+.17,-.3,.09,.12,2.35,'#373b34');
 if(police){b(0,roof+.18,-.3,1.4,.12,.28,'#343b37');b(-.4,roof+.28,-.3,.55,.16,.25,'#486783');b(.4,roof+.28,-.3,.55,.16,.25,'#a34839');for(const s of [-1,1]){b(s*1.085,.86,.1,.02,.34,.9,'#c7c0a4');b(s*1.104,.9,.1,.025,.18,.18,'#a18c50');}}
 if(van)for(const s of [-1,1]){b(s*.62,roof+.11,-.35,.035,.025,3.35,'#b0a68c');b(s*1.0,1.5,-.6,.025,1.05,.025,'#898778');}
}
car(-14,-13,'#667c8b','suv');car(-8,-13,'#8b8b68','pickup');car(13,12,'#b6ac90','van');car(7,12,'#343c3e','police');car(17,-14,'#825d4a','suv');solid(-12,3,5,.65,1.05,'#9a9584');solid(11,-4,5,.65,1.05,'#9a9584');
for(const x of [-13,-11,10,12])add(x,1.065,x<0?3:-4,.65,.03,.68,'#b6a578');
// Closed maintenance shed and dumpster, intentionally no interiors in milestone 1.
solid(-18,13,6,5,3,'#79796a');add(-18,3.12,13,6.5,.25,5.5,'#45483d');add(-18,1.1,15.53,1.6,2.2,.05,'#3c453c');add(-16.2,1.8,15.54,.9,.6,.06,'#90967a');
solid(19,3,2.4,1.5,1.4,'#626b42');add(19,1.48,3,2.6,.18,1.6,'#30372e');add(19.7,.5,3.77,.5,.4,.02,colors.rust);
for(const [x,z] of [[-20,-5],[20,19],[20,-20]]){add(x,2.3,z,.12,4.6,.12,'#726c59');add(x-.5,4.6,z,1.1,.12,.14,'#726c59');add(x-1,4.52,z,.5,.1,.35,'#d8c59b');}
for(let i=0;i<45;i++){const x=(rand()>.5?1:-1)*(21+rand()*3),z=rand()*46-23;add(x,.15,z,.08,.3+rand()*.3,.08,'#7a8050',rand()*70);add(x+.14,.1,z+.1,.25,.2,.07,'#606b42',30);}
for(const [x,z] of [[-5,7],[5,-9],[-19,-18]]){add(x,.06,z,.65,.12,.65,'#5b4934');add(x,.38,z,.32,.55,.32,'#ad6442');add(x,.42,z,.34,.12,.34,'#d4cbb1');}

// Explorable district around the original 46 m parking arena. No arena walls are moved.
export const START={x:0,z:64};
export const inArena=(x,z)=>Math.abs(x)<21.5&&Math.abs(z)<21.5;
export const landmarks=[{x:0,z:0,name:'DEAD LOT'},{x:0,z:64,name:'SOUTH APPROACH'},{x:-47,z:46,name:'SERVICE ROW'},{x:46,z:46,name:'MOTOR YARD'},{x:-46,z:-44,name:'OLD HOMES'},{x:46,z:-44,name:'FREIGHT YARD'}];
export function districtName(x,z){if(inArena(x,z))return 'DEAD LOT / ARENA';if(z>27)return x< -23?'SERVICE ROW':x>23?'MOTOR YARD':'SOUTH APPROACH';if(z< -27)return x< -23?'OLD HOMES':x>23?'FREIGHT YARD':'NORTH ROAD';return x<0?'WEST SERVICE ROAD':'EAST SERVICE ROAD';}
for(const [x,z,w,d] of [[0,51,12,56],[0,-51,12,56],[51,0,56,12],[-51,0,56,12],[0,43,150,12],[0,-43,150,12],[-43,0,12,150],[43,0,12,150]]){
 add(x,-.015,z,w,.03,d,'#40403b');
 if(w>d){for(let xx=x-w/2+2;xx<x+w/2;xx+=5)add(xx,.012,z,2,.025,.1,'#af9a63');}
 else for(let zz=z-d/2+2;zz<z+d/2;zz+=5)add(x,.012,zz,.1,.025,2,'#af9a63');
}
function building(x,z,w,d,color){
 solid(x,z,w,d,3.1,color);add(x,3.18,z,w+.4,.18,d+.4,'#454b40');
 for(let xx=x-w/2+1.6;xx<x+w/2-1;xx+=3.2){add(xx,1.7,z+d/2+.025,1.2,.95,.06,'#46534d');add(xx,1.7,z-d/2-.025,1.2,.95,.06,'#46534d');}
 add(x,1.05,z+d/2+.04,1.1,2.1,.08,'#433f33');
 add(x,2.65,z+d/2+.07,w*.65,.4,.08,'#a1926d');
}
// Walkable alleys and open yards between closed building shells.
for(const x of [-64,-23])for(const z of [-63,62])if(x!==-23||z!==62)building(x,z,13,10,x< -40?'#807b68':'#747960');
for(const x of [24,64])building(x,-64,13,11,'#797b73');
building(-64,23,13,12,'#777263');building(-64,-23,13,12,'#777263');
building(65,23,12,13,'#7e7868');building(65,-23,12,13,'#7e7868');
// Ruined workshop: low walls and door openings allow the player to walk through.
solid(-23,53,13,.45,1.2,'#89816b');solid(-29.3,59,.45,12,1.2,'#89816b');
solid(-16.7,59,.45,12,1.2,'#89816b');
// Motor yard and shipping containers create alternate routes.
car(25,55,'#7c8169','pickup');car(35,62,'#b6ad95','van');car(58,57,'#717f8b','suv');car(-55,32,'#8c6650','pickup');car(-33,-54,'#7a8075','suv');car(53,-31,'#9a947e','van');
for(const [x,z] of [[24,-29],[58,-58],[28,-59]]){solid(x,z,4,9,2.5,'#6a7765');for(let zz=z-4;zz<z+4;zz+=.7)add(x+2.025,1.25,zz,.04,2.3,.07,'#89907a');}
for(const [x,z] of [[-33,28],[33,28],[-33,-28],[33,-28]]){solid(x,z,2,1.3,1.2,'#626c48');add(x,1.28,z,2.15,.15,1.4,'#343b30');}
for(let i=0;i<90;i++){const x=rand()*150-75,z=rand()*150-75;if(Math.abs(x)<26&&Math.abs(z)<26)continue;
 const road=Math.abs(x)<8||Math.abs(z)<8||Math.abs(Math.abs(x)-43)<8||Math.abs(Math.abs(z)-43)<8;
 if(road)continue;add(x,.10,z,.12,.2+rand()*.3,.1,'#747b4e');add(x+.2,.07,z,.3,.15,.08,'#616c44');}
// Visible district boundary; roads end at barricades rather than an unexplained invisible edge.
for(const s of [-1,1]){solid(s*79.5,0,.6,159,1,'#777666');solid(0,s*79.5,159,.6,1,'#777666');}
// Approach arrows and hazard-colored threshold identify the automatic trigger.
for(const z of [59,49,34,25]){add(0,.035,z,.2,.04,1.8,'#d5bc79');add(-.35,.035,z-.6,.15,.04,1,'#d5bc79',-45);add(.35,.035,z-.6,.15,.04,1,'#d5bc79',45);}
for(let x=-4;x<=4;x+=.8)add(x,.04,21.5,.45,.04,.65,'#c1a358',-25);
// Landmark exteriors: the tower door opens a separate floor scene.
for(let floor=1;floor<8;floor++){
 const y=3.1+floor*1.35;add(-64,y,-63,12.5,1.25,9.5,'#6f756a');
 for(const x of [-68,-64,-60])add(x,y,-58.22,1.3,.65,.04,'#a8b4a2');
}
add(-64,.04,-56,3,.08,2,'#b5b87b');add(-64,2.6,-57.9,5,.45,.08,'#c4b177');
for(const [x,z,w,d] of [[-71,51,.5,9],[-59,46,14,.5],[-51,54,.5,6]])solid(x,z,w,d,1,'#6f695b');
add(-59,.03,52,8,.05,7,'#645646');
export const outdoorObstacles=obstacles.map(o=>({...o}));
let activeLimit=bounds;
export function setCollisionScene(list,limit=bounds){obstacles.splice(0,obstacles.length,...list.map(o=>({...o})));activeLimit=limit;lastCell=-1;for(let z=0;z<N;z++)for(let x=0;x<N;x++)occupied[z*N+x]=blocked(x-bounds,z-bounds,.48)?1:0;}export function blocked(x,z,r=.4){return Math.abs(x)>activeLimit-r||Math.abs(z)>activeLimit-r||obstacles.some(o=>Math.abs(x-o.x)<o.w+r&&Math.abs(z-o.z)<o.d+r);}
export function move(a,dx,dz,r=.38){if(!blocked(a.x+dx,a.z,r))a.x+=dx;if(!blocked(a.x,a.z+dz,r))a.z+=dz;}
// Grid distance field shared by all zombies; rebuilt only as the player changes cell.
const N=bounds*2+1,field=new Int16Array(N*N),queue=new Int32Array(N*N),occupied=new Uint8Array(N*N);let lastCell=-1;
const cell=(x,z)=>[Math.max(0,Math.min(N-1,Math.round(x)+bounds)),Math.max(0,Math.min(N-1,Math.round(z)+bounds))];
for(let z=0;z<N;z++)for(let x=0;x<N;x++)occupied[z*N+x]=blocked(x-bounds,z-bounds,.48)?1:0;
export function rebuildField(px,pz){const [x,z]=cell(px,pz),start=z*N+x;if(start===lastCell)return;lastCell=start;field.fill(-1);field[start]=0;queue[0]=start;let head=0,tail=1;while(head<tail){const i=queue[head++],cx=i%N,cz=Math.floor(i/N);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,nz=cz+dz,j=nz*N+nx;if(nx<0||nz<0||nx>=N||nz>=N||occupied[j]||field[j]>=0)continue;field[j]=field[i]+1;queue[tail++]=j;}}}
export function direction(x,z,px,pz){const distance=Math.hypot(px-x,pz-z);let clear=true;for(let d=.3;d<distance;d+=.45)if(blocked(x+(px-x)*d/distance,z+(pz-z)*d/distance,.46)){clear=false;break;}if(clear)return [px-x,pz-z];const [cx,cz]=cell(x,z);let best=Infinity,target=null;for(const [dx,dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,nz=cz+dz;if(nx<0||nz<0||nx>=N||nz>=N)continue;const score=field[nz*N+nx];if(score>=0&&score<best){best=score;target=[nx-bounds-x,nz-bounds-z];}}return target||[0,0];}
export function rayBox(x,z,dx,dz,o){let near=0,far=60;for(const [p,d,min,max] of [[x,dx,o.x-o.w,o.x+o.w],[z,dz,o.z-o.d,o.z+o.d]]){if(Math.abs(d)<.00001){if(p<min||p>max)return Infinity;}else{let a=(min-p)/d,b=(max-p)/d;if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far)return Infinity;}}return near;}



