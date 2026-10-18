import {block,colors} from './render.js';
export const bounds=23,obstacles=[],world=[];
const add=(...a)=>world.push(block(...a));
function solid(x,z,w,d,h,color){obstacles.push({x,z,w:w/2,d:d/2});add(x,h/2,z,w,h,d,color);}
let seed=52;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
add(0,-.22,0,72,.4,72,'#484a3a');add(0,-.06,0,48,.12,48,colors.asphalt);
// Faded parking bays, pavement repairs, aggregate and weeds.
for(const x of [-17,-11,-5,5,11,17])for(const z of [-16,12]){add(x,.009,z,.09,.015,7,'#a5986a');add(x+2.8,.009,z+3.5,5.6,.015,.09,'#a5986a');}
for(let z=-21;z<24;z+=4)add(0,.012,z,.13,.018,1.8,'#ae9252');
for(let i=0;i<150;i++){const x=rand()*46-23,z=rand()*46-23;add(x,.009,z,.08+rand()*.22,.022,.08+rand()*.2,rand()>.5?'#55514b':'#302f2e',rand()*180);}
for(let i=0;i<25;i++){const x=rand()*44-22,z=rand()*44-22;add(x,.012,z,.03,.02,.4+rand()*1.4,'#222722',rand()*180);}
// Leave four perimeter entry routes open.
for(const x of [-16,16]){solid(x,-23,13,.7,1.1,'#77756b');solid(x,23,13,.7,1.1,'#77756b');}
for(const z of [-15,15]){solid(-23,z,.7,15,1.1,'#77756b');solid(23,z,.7,15,1.1,'#77756b');}
function car(x,z,color){solid(x,z,2.25,4.7,.85,color);add(x,1.13,z-.25,1.9,.75,2.4,color);add(x,1.23,z+.9,1.65,.42,.08,'#52605d');add(x,1.23,z-1.46,1.65,.42,.08,'#46504d');add(x,1.53,z-.25,1.95,.12,2.4,color);for(const s of [-1,1]){add(x+s*1.05,.38,z-1.4,.35,.65,.8,'#202422');add(x+s*1.05,.38,z+1.4,.35,.65,.8,'#202422');add(x+s*.73,.65,z+2.36,.46,.22,.06,'#c2b893');add(x+s*.73,.65,z-2.36,.44,.2,.06,'#853b30');}add(x,.35,z+2.4,2.2,.14,.12,'#73756a');add(x+.4,.88,z+1.7,.65,.025,.7,colors.rust);}
car(-14,-13,'#637065');car(-8,-13,'#826c51');car(13,12,'#7e5144');car(7,12,'#777e80');car(17,-14,'#4c5861');
solid(-12,3,5,.65,1.05,'#9a9584');solid(11,-4,5,.65,1.05,'#9a9584');
for(const x of [-13,-11,10,12])add(x,1.065,x<0?3:-4,.65,.03,.68,'#b6a578');
// Closed maintenance shed and dumpster, intentionally no interiors in milestone 1.
solid(-18,13,6,5,3,'#79796a');add(-18,3.12,13,6.5,.25,5.5,'#45483d');add(-18,1.1,15.53,1.6,2.2,.05,'#3c453c');add(-16.2,1.8,15.54,.9,.6,.06,'#90967a');
solid(19,3,2.4,1.5,1.4,'#626b42');add(19,1.48,3,2.6,.18,1.6,'#30372e');add(19.7,.5,3.77,.5,.4,.02,colors.rust);
for(const [x,z] of [[-20,-5],[20,19],[20,-20]]){add(x,2.3,z,.12,4.6,.12,'#726c59');add(x-.5,4.6,z,1.1,.12,.14,'#726c59');add(x-1,4.52,z,.5,.1,.35,'#d8c59b');}
for(let i=0;i<45;i++){const x=(rand()>.5?1:-1)*(21+rand()*3),z=rand()*46-23;add(x,.15,z,.08,.3+rand()*.3,.08,'#7a8050',rand()*70);add(x+.14,.1,z+.1,.25,.2,.07,'#606b42',30);}
for(const [x,z] of [[-5,7],[5,-9],[-19,-18]]){add(x,.06,z,.65,.12,.65,'#5b4934');add(x,.38,z,.32,.55,.32,'#ad6442');add(x,.42,z,.34,.12,.34,'#d4cbb1');}

export function blocked(x,z,r=.4){return Math.abs(x)>bounds-r||Math.abs(z)>bounds-r||obstacles.some(o=>Math.abs(x-o.x)<o.w+r&&Math.abs(z-o.z)<o.d+r);}
export function move(a,dx,dz,r=.38){if(!blocked(a.x+dx,a.z,r))a.x+=dx;if(!blocked(a.x,a.z+dz,r))a.z+=dz;}
// Grid distance field shared by all zombies; rebuilt only as the player changes cell.
const N=47,field=new Int16Array(N*N),queue=new Int32Array(N*N),occupied=new Uint8Array(N*N);let lastCell=-1;
const cell=(x,z)=>[Math.max(0,Math.min(N-1,Math.round(x)+23)),Math.max(0,Math.min(N-1,Math.round(z)+23))];
for(let z=0;z<N;z++)for(let x=0;x<N;x++)occupied[z*N+x]=blocked(x-23,z-23,.48)?1:0;
export function rebuildField(px,pz){const [x,z]=cell(px,pz),start=z*N+x;if(start===lastCell)return;lastCell=start;field.fill(-1);field[start]=0;queue[0]=start;let head=0,tail=1;while(head<tail){const i=queue[head++],cx=i%N,cz=Math.floor(i/N);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,nz=cz+dz,j=nz*N+nx;if(nx<0||nz<0||nx>=N||nz>=N||occupied[j]||field[j]>=0)continue;field[j]=field[i]+1;queue[tail++]=j;}}}
export function direction(x,z,px,pz){const distance=Math.hypot(px-x,pz-z);let clear=true;for(let d=.3;d<distance;d+=.45)if(blocked(x+(px-x)*d/distance,z+(pz-z)*d/distance,.46)){clear=false;break;}if(clear)return [px-x,pz-z];const [cx,cz]=cell(x,z);let best=Infinity,target=null;for(const [dx,dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,nz=cz+dz;if(nx<0||nz<0||nx>=N||nz>=N)continue;const score=field[nz*N+nx];if(score>=0&&score<best){best=score;target=[nx-23-x,nz-23-z];}}return target||[0,0];}
export function rayBox(x,z,dx,dz,o){let near=0,far=60;for(const [p,d,min,max] of [[x,dx,o.x-o.w,o.x+o.w],[z,dz,o.z-o.d,o.z+o.d]]){if(Math.abs(d)<.00001){if(p<min||p>max)return Infinity;}else{let a=(min-p)/d,b=(max-p)/d;if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far)return Infinity;}}return near;}
