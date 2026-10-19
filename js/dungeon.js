import {block} from './render.js';

export const TOWER={x:-64,z:-56};
export const WRECKER_HOME={x:-59,z:52};
export const FLOOR_NAMES=['Foyer & reception','Garden apartments','Family apartments','Offices','Blocked residential wing','Services & residences','Damaged upper apartments','Penthouse residences'];
// Each floor has a south entrance and north exit, with rooms linked through real door openings.
export function makeFloor(index){
 if(index!==0&&index!==3)return residentialFloor(index);
 const parts=[],obstacles=[],rooms=[],spawns=[],start={x:0,z:29},exit={x:0,z:-29};
 const add=(...v)=>parts.push(block(...v));
 const solid=(x,z,w,d,h=1.05,color='#a29a83')=>{obstacles.push({x,z,w:w/2,d:d/2});add(x,h/2,z,w,h,d,color);};
 const wallX=(x,z,length,doorPositions=[])=>{let from=z-length/2;for(const door of [...doorPositions].sort((a,b)=>a-b)){const to=door-1.25;if(to>from)solid(x,(from+to)/2,.24,to-from);from=door+1.25;}if(from<z+length/2)solid(x,(from+z+length/2)/2,.24,z+length/2-from);};
 add(0,-.08,0,44,.16,64,index===3?'#777b70':'#8e8570');
 add(0,.01,0,5.8,.025,62,index===0?'#bbb094':'#626959');
 solid(-22,0,.4,64);solid(22,0,.4,64);solid(0,-32,44,.4);solid(0,32,44,.4);
 const labels=index===0?['Waiting room','Reception','Security','Service room']:index===3?['Meeting room','Office','Break room','Records']:index===5?['Maintenance','Kitchen','Bedroom','Utility room']:['Living room','Bedroom','Kitchen','Bathroom'];
 for(let band=0;band<3;band++){
  const z=18-band*18;
  for(const side of [-1,1]){
   wallX(side*3,z,16,[z-5,z+5]);wallX(side*12,z,16,[z+(index%2?2:-2)]);
   for(const zz of [z-8,z+8])solid(side*12.5,zz,18.8,.24);
   for(let col=0;col<2;col++){
    const x=side*(col?17:7.5),label=labels[(band+col+(side>0?1:0)+index)%labels.length];
    rooms.push({x,z,name:label});add(x,.012,z,col?9.5:8.6,.025,15.6,(band+col+index)%2?'#9c9178':'#8b8d79');
    // Furniture stays away from door corridors and the reserved zombie spawn cells.
    if(label==='Bedroom'||label.includes('apartments')){solid(x,z+1.5,2,3,.45,'#645a48');add(x,.52,z+1.5,1.85,.2,2.8,'#b0aa8b');add(x,.68,z+2.4,1.4,.14,.65,'#d2c7a9');}
    else if(label==='Bathroom'){solid(x,z+2,1.4,2,.4,'#c0baa8');add(x,.48,z+2,1,.1,1.5,'#717e75');}
    else if(label==='Kitchen'||label==='Utility room'){solid(x,z+3,4,1,.8,'#737566');add(x,.84,z+3,4.1,.1,1.1,'#b3ad97');}
    else{solid(x,z+2,2.8,1.3,.7,label==='Reception'?'#84654b':'#79765e');add(x-.8,.83,z+2,.6,.25,.4,'#323c37');}
    const count=1+Math.floor(Math.random()*4);
    const positions=[[-1.7,-4.5],[1.7,-4.5],[-1.7,5],[1.7,5]];
    const pool=index<2?['normal','normal','runner']:index<4?['normal','runner','worker']:index<6?['normal','runner','worker','crawler']:['normal','normal','runner','worker','crawler','brute'];
    for(let n=0;n<count;n++){const [dx,dz]=positions[n];spawns.push({x:x+dx,z:z+dz,kind:pool[Math.floor(Math.random()*pool.length)]});}
   }
  }
  // Alternate obstruction positions between floors; at least one band requires a room detour.
  if(band===(index%3)||index>=4&&band!==1){const bz=z+(index%2?1:-1);solid(0,bz,6.1,1.1,1.2,'#625e4d');for(const x of [-1.8,0,1.8])add(x,1.28,bz,.8,.22,.8,'#85806b',index*13);}
 }
 if(index===0){solid(-9,27,5,1.2,.9,'#896d4e');solid(9,27,4,1,.65,'#75745d');}
 // Visible stair flights at both ends; transition requires an explicit interaction.
 for(const base of [29,-29])for(let i=0;i<5;i++)add(0,.05+i*.06,base+1-i*.4,2.7,.1+i*.12,.42,'#b8ae91');
 add(0,.03,-27,3,.03,.25,'#c9b372');
 return {parts,obstacles,spawns,rooms,start,exit,name:FLOOR_NAMES[index],limit:33};
}
export function makeRoof(){const parts=[],obstacles=[];const solid=(x,z,w,d,h,color)=>{obstacles.push({x,z,w:w/2,d:d/2});parts.push(block(x,h/2,z,w,h,d,color));};parts.push(block(0,-.1,0,44,.2,64,'#636b60'));for(const x of [-22,22])solid(x,0,.4,64,.8,'#a09a84');for(const z of [-32,32])solid(0,z,44,.4,.8,'#a09a84');for(const x of [-12,12])solid(x,0,5,7,1.2,'#717a70');parts.push(block(0,.02,-26,6,.04,6,'#c1b47c'));return {parts,obstacles,spawns:[],rooms:[],start:{x:0,z:29},exit:{x:0,z:-26},name:'Rooftop escape',limit:33};}


function residentialFloor(index){
 const parts=[],obstacles=[],walls=[],rooms=[],spawns=[];
 const add=(...v)=>parts.push(block(...v));
 const solid=(x,z,w,d,h,color,wall=false)=>{const o={x,z,w:w/2,d:d/2};obstacles.push(o);if(wall)walls.push(o);add(x,h/2,z,w,h,d,color);};
 add(0,-.08,0,44,.16,64,'#747365');add(0,.01,0,6,.02,62,'#606553');
 for(const x of [-22,22])solid(x,0,.35,64,1.2,'#99937f',true);
 for(const z of [-32,32])solid(0,z,44,.35,1.2,'#99937f',true);
 for(const side of [-1,1])for(let unit=0;unit<2;unit++){
  const z0=unit===0?-25:1,flip=(index+unit+(side>0?1:0))%2===0;
  const point=(u,v)=>[side*(3+u),z0+(flip?24-v:v)];
  const box=(u,v,w,d,h,color,wall=false)=>{const [x,z]=point(u,v);solid(x,z,w,d,h,color,wall);};
  const wall=(axis,at,from,to,doors=[])=>{let a=from;for(const door of [...doors].sort((a,b)=>a-b)){const b=door-1.1;if(b>a)segment(a,b);a=door+1.1;}if(a<to)segment(a,to);function segment(a,b){if(axis==='u')box(at,(a+b)/2,.22,b-a,1.05,'#aaa18c',true);else box((a+b)/2,at,b-a,.22,1.05,'#aaa18c',true);}};
  // A genuine entry corridor, transverse private hall, and exterior-facing rooms.
  wall('u',0,0,24,[3,21]);wall('v',0,0,19);wall('v',24,0,19);
  wall('u',3,0,24,[11.5,20]);wall('v',10,3,19,[7,15]);wall('v',13,3,19,[7,15]);wall('u',11,0,10);
  const twoBedroom=(index+unit)%2===0;
  wall('u',11,13,24,twoBedroom?[21]:[18,21]);if(twoBedroom)wall('v',18,11,19);
  // Ruptured secondary doorway is an emergency bypass, not a second front door.
  box(0,21,1.1,.14,.12,'#706b59');
  const room=(name,u0,v0,u1,v1)=>{
   const u=(u0+u1)/2,v=(v0+v1)/2,[x,z]=point(u,v),w=u1-u0,d=v1-v0;
   rooms.push({x,z,name,apartment:`${index+1}${side>0?'B':'A'}${unit+1}`});add(x,.018,z,w-.25,.025,d-.25,name==='Bathroom'?'#a4aaa0':name==='Kitchen'?'#938d79':'#927c60');
   if(name.includes('Bedroom')){box(u,v+1,2.1,3.2,.48,'#66513d');const [bx,bz]=point(u,v+1);add(bx,.57,bz,2,.18,3,'#a8a08b');const [px,pz]=point(u,v+2);add(px,.72,pz,1.5,.12,.6,'#d3cbb6');box(u0+1,v0+1,1.1,1.5,1.15,'#6a5845');}
   else if(name==='Bathroom'){box(u1-1,v+1,1.4,2.6,.45,'#c1c1ae');box(u0+1,v0+1,1,1,.6,'#aeb4a4');box(u0+1,v1-1,1.2,.7,.7,'#babba9');}
   else if(name==='Kitchen'){box(u1-.65,v,(1),Math.max(2,d-2),.85,'#78806b');box(u,v1-.7,Math.max(2,w-2),1,.85,'#78806b');box(u1-1,v0+1,1.3,1.3,1.5,'#b6b4a2');}
   else{box(u0+1.1,v+1,1.3,3.4,.65,'#666d50');box(u,v+1,1.7,1.2,.42,'#7d6246');box(u1-.6,v+1,.6,2.3,.6,'#514d40');box(u,v0+2,2,1.5,.75,'#8e7654');}
   const valid=[];for(let vv=v0+.9;vv<v1-.7;vv+=1.3)for(let uu=u0+.9;uu<u1-.7;uu+=1.3){const [sx,sz]=point(uu,vv);if(!obstacles.some(o=>Math.abs(sx-o.x)<o.w+.55&&Math.abs(sz-o.z)<o.d+.55))valid.push({x:sx,z:sz});}
   const count=1+Math.floor(Math.random()*4),pool=index<3?['normal','normal','runner']:index<6?['normal','worker','runner','crawler']:['normal','worker','runner','crawler','brute'];
   for(let n=0;n<count&&valid.length;n++){const i=Math.floor(Math.random()*valid.length),pos=valid.splice(i,1)[0];spawns.push({...pos,kind:pool[Math.floor(Math.random()*pool.length)]});}
  };
  room('Bedroom',3,0,11,10);room('Bathroom',11,0,19,10);room('Living / dining',3,13,11,24);
  if(twoBedroom){room('Bedroom 2',11,13,19,18);room('Kitchen',11,18,19,24);}else room('Kitchen',11,13,19,24);
  // Blocking both shared hall and entry passage makes the route pass through the living room.
  if(unit===index%2){const [,bz]=point(0,12);solid(0,bz,6.1,.8,1.1,'#615d50',true);box(1.5,12,3,.6,.9,'#6c6553',true);}
  for(const v of [4,16,21]){const [x,z]=point(18.8,v);add(x,1,z,.1,.45,1.5,'#3f4d4b');}
 }
 for(const z of [-29,29])for(let i=0;i<5;i++)add(0,.05+i*.06,z+1-i*.4,2.7,.1+i*.12,.42,'#b8ae91');
 return {parts,obstacles,walls,rooms,spawns,start:{x:0,z:29},exit:{x:0,z:-29},limit:33,name:FLOOR_NAMES[index]};
}
