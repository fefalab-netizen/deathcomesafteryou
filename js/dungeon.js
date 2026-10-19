import {block} from './render.js';

export const TOWER={x:-64,z:-56};
export const WRECKER_HOME={x:-59,z:52};
export const FLOOR_NAMES=['Foyer & reception','Garden apartments','Family apartments','Offices','Blocked residential wing','Services & residences','Damaged upper apartments','Penthouse residences'];
// Each floor has a south entrance and north exit, with rooms linked through real door openings.
export function makeFloor(index){
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
