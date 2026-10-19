import {TOWER,WRECKER_HOME,makeFloor,makeRoof} from './dungeon.js';
import {BAT,STAMINA} from './combat.js';
import {TYPES,waveRoster} from './zombies.js';
import {WorldRenderer,characterMesh,muzzlePosition,bake,block} from './render.js';
import {world,obstacles,blocked,move,bounds,rebuildField,direction,rayBox,START,inArena,districtName,outdoorObstacles,setCollisionScene} from './world.js';

const $=id=>document.getElementById(id),canvas=$('game'),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let renderer;
try{renderer=new WorldRenderer(canvas);renderer.setWorld(world);}catch(e){$('error').hidden=false;$('errorText').textContent=e.message;throw e;}
const config={speed:3.6,runSpeed:5.2,magazine:12,reload:1.35,fireInterval:.22,zombieHealth:2,zombieSpeed:1.05,maxAlive:60};
const player={x:START.x,z:START.z,yaw:Math.PI,health:100,ammo:12,reload:0,shot:0,hurt:0,animation:0,idleAnimation:0,moving:false,moveYaw:0,slow:0,vx:0,vz:0,weapon:'pistol',stamina:100,regenDelay:0,exhausted:false,swing:-1,swingHit:false,swingYaw:0};
let mobileSprint=false;
let arenaTriggered=false;
let dungeonLevel=-1,dungeonComplete=false,bossDefeated=false,floors=[],savedOutdoor=null,entryPrompt=false;
let roster=[],zombies=[],corpses=[],tracers=[],wave=0,kills=0,pending=0,spawnTimer=0,between=0,running=false,paused=false,dead=false,started=false,elapsed=0,deathTime=0,announcementTime=0;
let cameraX=START.x,cameraZ=START.z,quality=1.5,previous=0,fpsClock=0,fpsFrames=0;
const keys=new Set(),mouse={x:innerWidth/2,y:innerHeight/2,down:false,seen:false},sticks={move:{x:0,y:0,id:null},aim:{x:0,y:0,id:null}};
const shadow=bake([block(0,.018,0,.75,.018,.5,'#292d27')]);
const sight=bake([block(0,.025,0,.05,.02,.4,'#b2c68d')]);
let audio;
function sound(type){try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.type=type==='shot'?'sawtooth':'triangle';osc.frequency.setValueAtTime(type==='shot'?150:type==='hit'?75:440,now);osc.frequency.exponentialRampToValueAtTime(type==='shot'?35:40,now+.09);gain.gain.setValueAtTime(type==='shot'?.035:.025,now);gain.gain.exponentialRampToValueAtTime(.001,now+.12);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(now+.13);}catch{/* Audio is optional; the game remains playable without it. */}}
function announce(text){$('announcement').textContent=text;announcementTime=3;$('announcement').style.opacity=1;}
function clearInput(){keys.clear();mouse.down=false;mobileSprint=false;for(const [name,s] of Object.entries(sticks)){s.x=s.y=0;s.id=null;$(name==='move'?'moveStick':'aimStick').querySelector('i').style.transform='';}}
function isPortrait(){return matchMedia('(pointer:coarse) and (orientation:portrait)').matches;}
function setPaused(value){if(!started||dead||entryPrompt)return;paused=value;clearInput();$('pauseMenu').hidden=!value;$('crosshair').style.display='none';}
function begin(){quality=+$('quality').value;roster=[];zombies=[];corpses=[];tracers=[];wave=kills=pending=0;between=spawnTimer=elapsed=deathTime=0;Object.assign(player,{x:START.x,z:START.z,yaw:Math.PI,health:100,ammo:12,reload:0,shot:0,hurt:0,animation:0,idleAnimation:0,moving:false,moveYaw:0,slow:0,vx:0,vz:0,weapon:'pistol',stamina:100,regenDelay:0,exhausted:false,swing:-1,swingHit:false,swingYaw:0});cameraX=START.x;cameraZ=START.z;arenaTriggered=false;dead=paused=false;running=started=true;clearInput();for(const id of ['menu','pauseMenu','deathMenu'])$(id).hidden=true;$('nextWave').hidden=true;initializeEncounters();announce('EXPLORE · NORTHWEST TOWER · SOUTHWEST WRECKER');sound('ready');}
function startWave(){if(!running||dead||paused||dungeonLevel>=0||pending||arenaEnemies()||!inArena(player.x,player.z))return;wave++;pending=+$('waveSize').value+(wave-1)*4;roster=waveRoster(wave,pending);spawnTimer=0;between=0;$('nextWave').hidden=true;const unlock=Object.values(TYPES).find(t=>t.wave===wave);announce(`WAVE ${String(wave).padStart(2,'0')} · ${pending} INCOMING${unlock?' · '+unlock.name.toUpperCase():''}`);}
function spawn(){const kind=roster[roster.length-1]||'normal',type=TYPES[kind];for(let tries=0;tries<40;tries++){const side=Math.floor(Math.random()*4),offset=(Math.random()-.5)*8;let x,z;if(side===0){x=offset;z=-21.8;}if(side===1){x=offset;z=21.8;}if(side===2){x=-21.8;z=offset;}if(side===3){x=21.8;z=offset;}if(blocked(x,z,type.radius)||Math.hypot(player.x-x,player.z-z)<7||zombies.some(a=>Math.hypot(a.x-x,a.z-z)<type.radius+TYPES[a.kind].radius+.1))continue;zombies.push({kind,encounter:'arena',x,z,yaw:0,health:type.hp,speed:type.speed*(.95+Math.random()*.1)+Math.min((wave-1)*.035,.35),animation:Math.random()*3,hurt:0,attack:0,cooldown:Math.random()*.5,struck:false,flank:Math.random()>.5?1:-1,burst:0,burstCooldown:.6+Math.random()*1.2,windup:0,chargeX:0,chargeZ:0});roster.pop();return true;}return false;}function reload(){if(!running||dead||paused||player.weapon!=='pistol'||player.reload>0||player.ammo===config.magazine)return;player.reload=config.reload;sound('ready');}
function fire(){if(player.weapon==='bat'){startSwing();return;}if(player.reload>0||player.shot>0)return;if(player.ammo===0){reload();return;}player.ammo--;player.shot=config.fireInterval;sound('shot');
 const origin=muzzlePosition(player),dx=Math.sin(player.yaw),dz=Math.cos(player.yaw);let range=25,target=null;
 // Prevent a muzzle protruding through cover from shooting through that cover.
 const mx=origin[0]-player.x,mz=origin[2]-player.z,ml=Math.hypot(mx,mz);
 const obstructed=obstacles.some(o=>rayBox(player.x,player.z,mx/ml,mz/ml,o)<ml);
 if(obstructed)range=0;
 for(const o of obstacles)range=Math.min(range,rayBox(origin[0],origin[2],dx,dz,o));
 for(const z of zombies){const r=TYPES[z.kind].radius+.07,rx=z.x-origin[0],rz=z.z-origin[2],along=rx*dx+rz*dz,perp=rx*dz-rz*dx;if(along< -r||Math.abs(perp)>r)continue;const distance=Math.max(0,along-Math.sqrt(r*r-perp*perp));if(distance<range){range=distance;target=z;}}
 tracers.push({x:origin[0],y:origin[1],z:origin[2],dx,dz,length:range,endY:target?.kind==='crawler'?.4:1.12,life:.085});
 if(target){const type=TYPES[target.kind];target.health--;target.hurt=type.stagger;target.hitDuration=type.stagger;if(target.kind!=='brute'&&target.kind!=='worker'&&target.kind!=='wrecker'){target.attack=0;target.cooldown=.2;target.burst=target.windup=0;}move(target,dx*(target.kind==='brute'?.025:.14),dz*(target.kind==='brute'?.025:.14),type.radius);if(target.health<=0){if(target.kind==='wrecker')bossDefeated=true;kills++;corpses.push({...target,age:0});zombies=zombies.filter(z=>z!==target);if(corpses.length>24)corpses.shift();}sound('hit');}
}
function switchWeapon(){if(!running||paused||dead||player.swing>=0)return;player.weapon=player.weapon==='pistol'?'bat':'pistol';player.reload=0;player.shot=0;}
function startSwing(){if(player.swing>=0||player.stamina<BAT.cost||player.exhausted)return;player.stamina-=BAT.cost;player.regenDelay=STAMINA.delay;player.swing=0;player.swingHit=false;player.swingYaw=player.yaw;}
function batImpact(){
 const dx=Math.sin(player.swingYaw),dz=Math.cos(player.swingYaw);let hits=0;
 for(const target of [...zombies].sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z))){
  const x=target.x-player.x,z=target.z-player.z,d=Math.hypot(x,z),type=TYPES[target.kind];
  if(d>BAT.reach+type.radius||(x*dx+z*dz)/Math.max(d,.001)<Math.cos(BAT.arc))continue;
  if(obstacles.some(o=>rayBox(player.x,player.z,x/Math.max(d,.001),z/Math.max(d,.001),o)<d))continue;
  target.health-=BAT.damage;target.hurt=Math.max(type.stagger,target.kind==='brute'?.08:.3);target.hitDuration=target.hurt;target.attack=0;target.cooldown=.3;target.burst=target.windup=0;
  // Small increments keep knockback from tunneling through narrow obstacles.
  for(let i=0;i<4;i++)move(target,dx*(target.kind==='brute'?.025:.10),dz*(target.kind==='brute'?.025:.10),type.radius);
  if(target.health<=0){if(target.kind==='wrecker')bossDefeated=true;kills++;corpses.push({...target,age:0});zombies=zombies.filter(z=>z!==target);if(corpses.length>24)corpses.shift();}
  if(++hits>=3)break;
 }
 sound(hits?'hit':'ready');
}function arenaEnemies(){return zombies.filter(z=>z.encounter==='arena').length;}
function createEnemy(kind,x,z,encounter){return {kind,x,z,encounter,yaw:Math.PI,health:TYPES[kind].hp,speed:TYPES[kind].speed,animation:Math.random(),hurt:0,attack:0,cooldown:0,struck:false,flank:1,burst:0,burstCooldown:1,windup:0,chargeX:0,chargeZ:0};}
function initializeEncounters(){
 dungeonLevel=-1;dungeonComplete=bossDefeated=entryPrompt=false;floors=[];savedOutdoor=null;$('towerPrompt').hidden=true;
 setCollisionScene(outdoorObstacles);renderer.setWorld(world);
 zombies.push(createEnemy('wrecker',WRECKER_HOME.x,WRECKER_HOME.z,'boss'));refreshMap();
}
function updateWrecker(z,dt,distance){
 const homeDistance=Math.hypot(player.x-WRECKER_HOME.x,player.z-WRECKER_HOME.z);
 if(homeDistance>19){z.attack=z.burst=z.windup=0;const dx=WRECKER_HOME.x-z.x,dz=WRECKER_HOME.z-z.z,l=Math.hypot(dx,dz);if(l>.3){move(z,dx/l*z.speed*dt,dz/l*z.speed*dt,TYPES.wrecker.radius);z.yaw=Math.atan2(dx,dz);z.animation+=dt;}return true;}
 if(z.burst>0){z.burst-=dt;z.yaw=Math.atan2(z.chargeX,z.chargeZ);const x=z.x,zz=z.z;move(z,z.chargeX*7.5*dt,z.chargeZ*7.5*dt,TYPES.wrecker.radius);z.animation+=dt*2;
  if(distance<1.4){damage(z);z.burst=0;z.cooldown=1;}
  if(Math.hypot(z.x-x,z.z-zz)<.01){z.burst=0;z.cooldown=1;}
  return true;
 }
 if(z.windup>0){z.windup-=dt;if(z.windup<=0){z.burst=.8;z.burstCooldown=4;}return true;}
 if(z.attack===0&&z.burstCooldown===0&&distance>4&&distance<13){const dx=(player.x-z.x)/distance,dz=(player.z-z.z)/distance;if(!obstacles.some(o=>rayBox(z.x,z.z,dx,dz,o)<distance)){z.windup=.75;z.chargeX=dx;z.chargeZ=dz;return true;}}
 return false;
}
function storeFloor(){if(dungeonLevel>=0){floors[dungeonLevel].enemies=zombies;floors[dungeonLevel].bodies=corpses;}}
function loadFloor(level,returning=false){
 storeFloor();dungeonLevel=level;
 if(!floors[level]){const data=level===8?makeRoof():makeFloor(level);data.enemies=data.spawns.map(s=>createEnemy(s.kind,s.x,s.z,'dungeon'));data.bodies=[];floors[level]=data;}
 const floor=floors[level];setCollisionScene(floor.obstacles,floor.limit);renderer.setWorld(floor.parts);zombies=floor.enemies;corpses=floor.bodies;tracers=[];
 const spawn=returning?floor.exit:floor.start;player.x=spawn.x;player.z=spawn.z+(returning?2:0);player.swing=-1;player.shot=0;player.reload=0;player.hurt=Math.max(player.hurt,.5);cameraX=player.x;cameraZ=player.z;clearInput();$('nextWave').hidden=true;refreshMap();announce(level===8?'ROOFTOP · CROSS TO THE ESCAPE POINT':`FLOOR ${level+1} / 8 · ${floor.name.toUpperCase()}`);
}
function exitTower(){
 storeFloor();dungeonComplete=true;dungeonLevel=-1;setCollisionScene(outdoorObstacles);renderer.setWorld(world);zombies=savedOutdoor.enemies;corpses=savedOutdoor.bodies;tracers=[];player.x=TOWER.x;player.z=TOWER.z+3;cameraX=player.x;cameraZ=player.z;clearInput();refreshMap();announce('TOWER ESCAPED · EIGHT FLOORS COMPLETE');
}
function interaction(){
 if(dungeonLevel>=0){const floor=floors[dungeonLevel];if(Math.hypot(player.x-floor.exit.x,player.z-floor.exit.z)<3)return dungeonLevel===8?'ESCAPE TO DISTRICT':dungeonLevel===7?'CLIMB TO ROOF':`CLIMB TO FLOOR ${dungeonLevel+2}`;
 if(dungeonLevel>0&&Math.hypot(player.x-floor.start.x,player.z-floor.start.z)<2.2)return 'RETURN TO PREVIOUS FLOOR';return '';}
 return !dungeonComplete&&Math.hypot(player.x-TOWER.x,player.z-TOWER.z)<3.5?'ENTER EIGHT-FLOOR TOWER':'';
}
function interact(){if(!running||dead||paused||player.swing>=0)return;const action=interaction();if(!action)return;
 if(dungeonLevel<0){entryPrompt=true;paused=true;clearInput();$('towerPrompt').hidden=false;return;}
 const floor=floors[dungeonLevel];if(Math.hypot(player.x-floor.exit.x,player.z-floor.exit.z)<3){if(dungeonLevel===8)exitTower();else loadFloor(dungeonLevel+1);}else loadFloor(dungeonLevel-1,true);
}function damage(attacker){if(player.hurt>0||dead)return;const type=TYPES[attacker.kind];player.health=Math.max(0,player.health-type.damage);player.hurt=.55;if(attacker.kind==='crawler')player.slow=1.4;if(attacker.kind==='brute'||attacker.kind==='wrecker'){const dx=player.x-attacker.x,dz=player.z-attacker.z,l=Math.hypot(dx,dz)||1;for(let i=0;i<8;i++)move(player,dx/l*.13,dz/l*.13);}sound('hit');if(player.health===0){dead=true;running=false;deathTime=0;clearInput();$('nextWave').hidden=true;$('result').textContent=`${kills} kills · Wave ${wave} · ${Math.floor(elapsed/60)}m ${Math.floor(elapsed%60)}s survived`;$('crosshair').style.display='none';announce('OVERRUN');}}
function updateZombie(z,dt){
 z.moving=false;
 if(z.encounter==='dungeon'&&!z.awake){
  const dx=player.x-z.x,dz=player.z-z.z,d=Math.hypot(dx,dz);
  const sees=d<8&&!obstacles.some(o=>rayBox(z.x,z.z,dx/Math.max(d,.001),dz/Math.max(d,.001),o)<d);
  if(z.health<TYPES[z.kind].hp||sees||(player.shot>0&&d<12))z.awake=true;else return;
 }
 const type=TYPES[z.kind];z.hurt=Math.max(0,z.hurt-dt);z.cooldown=Math.max(0,z.cooldown-dt);z.burstCooldown=Math.max(0,z.burstCooldown-dt);
 const distance=Math.hypot(player.x-z.x,player.z-z.z);if(z.kind==='wrecker'&&updateWrecker(z,dt,distance))return;z.yaw=Math.atan2(player.x-z.x,player.z-z.z);
 if(z.attack>0){z.attack+=dt;if(z.attack>type.windup&&!z.struck){z.struck=true;if(distance<type.reach+.25&& !obstacles.some(o=>rayBox(z.x,z.z,Math.sin(z.yaw),Math.cos(z.yaw),o)<distance))damage(z);}if(z.attack>type.windup+.26){z.attack=0;z.cooldown=type.recovery;}return;}
 if(distance<type.reach&&z.cooldown<=0){z.attack=.001;z.struck=false;z.burst=0;return;}
 if(z.hurt>0)return;
 if(z.windup>0){z.windup-=dt;if(z.windup<=0){z.burst=.65;z.burstCooldown=1.6;}return;}
 if(z.kind==='runner'&&distance>2.5&&distance<7&&z.burstCooldown===0){
  const dx=(player.x-z.x)/distance,dz=(player.z-z.z)/distance;
  if(!obstacles.some(o=>rayBox(z.x,z.z,dx,dz,o)<distance)){z.windup=.22;z.chargeX=dx;z.chargeZ=dz;return;}
 }
 let [dx,dz]=direction(z.x,z.z,player.x,player.z),l=Math.hypot(dx,dz);if(l<.05||distance<type.reach*.8)return;dx/=l;dz/=l;
 // Runners approach from a side before their committed, dodgeable burst.
 if(z.kind==='runner'&&distance>4&&distance<11&&z.burst<=0){const x=dx;dx+=-dz*z.flank*.45;dz+=x*z.flank*.45;}
 if(z.burst>0){z.burst-=dt;dx=z.chargeX;dz=z.chargeZ;}
 else{let sx=0,sz=0;for(const other of zombies){if(other===z)continue;const ox=z.x-other.x,oz=z.z-other.z,d=Math.hypot(ox,oz),gap=type.radius+TYPES[other.kind].radius;if(d>0&&d<gap){sx+=ox/d*(gap-d);sz+=oz/d*(gap-d);}}dx+=sx*2;dz+=sz*2;}
 l=Math.hypot(dx,dz)||1;let speed=z.speed*(z.burst>0?2.2:1);if(z.kind==='crawler')speed*=.72+.55*Math.max(0,Math.sin(z.animation*7));
 const oldX=z.x,oldZ=z.z;move(z,dx/l*speed*dt,dz/l*speed*dt,type.radius);const traveled=Math.hypot(z.x-oldX,z.z-oldZ);z.moving=traveled>.0001;z.animation+=traveled/(z.kind==='runner'?2.2:z.kind==='brute'?1.1:1.3);z.yaw=Math.atan2(dx,dz);
}
function update(dt){
 if(!running||paused||isPortrait()){if(dead){deathTime+=dt;if(deathTime>.9)$('deathMenu').hidden=false;}return;}
 player.regenDelay=Math.max(0,player.regenDelay-dt);if(player.exhausted&&player.stamina>=STAMINA.recoverThreshold)player.exhausted=false;
 elapsed+=dt;announcementTime-=dt;$('announcement').style.opacity=announcementTime>0?1:0;
 player.shot=Math.max(0,player.shot-dt);player.hurt=Math.max(0,player.hurt-dt);if(player.reload>0){player.reload-=dt;if(player.reload<=0){player.reload=0;player.ammo=config.magazine;}}
 let mx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+sticks.move.x;
 let mz=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+sticks.move.y;
 const mag=Math.hypot(mx,mz);if(mag>1){mx/=mag;mz/=mag;}if(mag<=.08){mx=mz=0;}
 const touchAim=Math.hypot(sticks.aim.x,sticks.aim.y)>.2;
 if(player.swing>=0)player.yaw=player.swingYaw;
 else if(touchAim)player.yaw=Math.atan2(sticks.aim.x,sticks.aim.y);
 else if(mouse.seen){const [x,z]=renderer.screenGround(mouse.x,mouse.y,1.12);player.yaw=Math.atan2(x-player.x,z-player.z);}
 else if(mag>.08)player.yaw=Math.atan2(mx,mz);
 // Resolve facing first so backward speed is correct on the very first step.
 const inputLength=Math.hypot(mx,mz),forward=inputLength>0?(mx*Math.sin(player.yaw)+mz*Math.cos(player.yaw))/inputLength:1;
 const backward=forward<-.15,sprint=(keys.has('ShiftLeft')||keys.has('ShiftRight')||mobileSprint)&&!backward&&inputLength>.08&&player.stamina>0&&!player.exhausted&&player.swing<0;
 const directionalSpeed=forward<0?.9+.3*forward:.9+.1*forward;
 const speed=(sprint?config.runSpeed:config.speed)*directionalSpeed*(player.slow>0?.62:1);
 player.slow=Math.max(0,player.slow-dt);
 const ox=player.x,oz=player.z;move(player,mx*speed*dt,mz*speed*dt);
 player.vx=(player.x-ox)/Math.max(dt,.001);player.vz=(player.z-oz)/Math.max(dt,.001);
 const traveled=Math.hypot(player.x-ox,player.z-oz);player.moving=traveled>.0001;
 if(player.moving){player.moveYaw=Math.atan2(player.vx,player.vz)-player.yaw;player.animation+=traveled/.95;}
 else player.idleAnimation=(player.idleAnimation||0)+dt;
 if(sprint&&player.moving){player.stamina=Math.max(0,player.stamina-STAMINA.sprintDrain*dt);player.regenDelay=STAMINA.delay;if(player.stamina===0)player.exhausted=true;}
 else if(player.regenDelay===0&&player.swing<0)player.stamina=Math.min(STAMINA.max,player.stamina+STAMINA.regen*dt);
 if(player.swing>=0){player.swing+=dt;if(player.swing>=BAT.impact&&!player.swingHit){player.swingHit=true;batImpact();}if(player.swing>=BAT.duration)player.swing=-1;}
 if(mouse.down||touchAim)fire();
 if(dungeonLevel<0&&!arenaTriggered&&inArena(player.x,player.z)){arenaTriggered=true;startWave();}
 rebuildField(player.x,player.z);
 for(const z of zombies){updateZombie(z,dt);if(dead)break;}
 if(dead)return;
 if(dungeonLevel<0&&pending&&zombies.length<config.maxAlive){spawnTimer-=dt;if(spawnTimer<=0){if(spawn())pending--;spawnTimer=Math.max(.10,.28-wave*.025);}}
 if(dungeonLevel<0&&wave>0&&!pending&&!arenaEnemies()){
  if(between===0){between=3;announce('WAVE CLEARED · 3 SECONDS TO REGROUP');$('nextWave').textContent=`START WAVE ${String(wave+1).padStart(2,'0')} →`;}
  const inside=inArena(player.x,player.z);$('nextWave').hidden=!inside;
  if($('endless').checked&&inside){between=Math.max(.001,between-dt);if(between<=.001)startWave();}
 } for(const c of corpses)c.age+=dt;
 for(const t of tracers)t.life-=dt;tracers=tracers.filter(t=>t.life>0);
 cameraX+=(player.x-cameraX)*Math.min(1,dt*5);cameraZ+=(player.z-cameraZ)*Math.min(1,dt*5);
}
function draw(){renderer.resize(quality);renderer.begin(cameraX,cameraZ);renderer.setFlashlight(player.x,player.z,dungeonLevel>=0?(floors[dungeonLevel].walls||obstacles):[],dungeonLevel>=0&&dungeonLevel<8);
 const drawActor=(a,kind,state,t,moving)=>{if(Math.abs(a.x-cameraX)>28||Math.abs(a.z-cameraZ)>23)return;renderer.append(shadow,a.x,0,a.z);const clock=kind==='human'&&!moving?(a.idleAnimation||0):a.animation;renderer.append(characterMesh(kind,state,t,moving,a.moveYaw||0,clock,a.weapon||'pistol'),a.x,0,a.z,a.yaw);};
 for(const c of corpses)drawActor(c,c.kind,'dead',c.age,false);
 for(const z of zombies){const type=TYPES[z.kind],attackPhase=z.attack<=type.windup?.45*z.attack/type.windup:.45+.55*(z.attack-type.windup)/.26;drawActor(z,z.kind,z.attack>0?'attack':z.hurt>0?'hit':z.windup>0?'windup':'walk',z.attack>0?attackPhase:z.hurt>0?Math.max(0,1-z.hurt/(z.hitDuration||type.stagger))*.6:z.animation,!!z.moving);}
 drawActor(player,'human',dead?'dead':player.swing>=0?'swing':player.hurt>0?'hit':player.reload>0?'reload':player.shot>0?'shoot':'idle',dead?deathTime:player.swing>=0?player.swing:player.hurt>0?.55-player.hurt:player.reload>0?config.reload-player.reload:player.shot>0?config.fireInterval-player.shot:player.animation,player.moving); if(started&&!dead&&player.weapon==='pistol'){const dx=Math.sin(player.yaw),dz=Math.cos(player.yaw);for(let i=1;i<5;i++)renderer.append(sight,player.x+dx*i*.8,0,player.z+dz*i*.8,player.yaw);}
 for(const t of tracers){
  // A short moving streak replaces the full-length laser beam. The flash starts at the barrel.
  const age=.085-t.life,head=Math.min(t.length,age*240),tail=Math.max(0,head-1.4),len=head-tail;
  if(len>.01){const middle=(head+tail)/2,y=t.y+(t.endY-t.y)*middle/Math.max(.01,t.length);renderer.append(bake([block(0,y,middle,.018,.018,len,'#d2b87c')]),t.x,0,t.z,Math.atan2(t.dx,t.dz));}
  if(age<.04)renderer.append(bake([block(0,t.y,.06,.075,.065,.16,'#f4d69a')]),t.x,0,t.z,Math.atan2(t.dx,t.dz));
  if(t.length>0&&head>=t.length&&t.life>.015)renderer.append(bake([block(0,t.endY,0,.09,.09,.09,'#b08c63')]),t.x+t.dx*t.length,0,t.z+t.dz*t.length);
 } renderer.draw();
 $('healthText').textContent=player.health;$('healthBar').style.width=`${player.health}%`;$('ammo').innerHTML=`${player.ammo} <small>/ ∞</small>`;$('reloadStatus').textContent=player.reload>0?`RELOADING ${player.reload.toFixed(1)}s`:player.ammo===0?'RELOAD [R]':'READY';$('wave').textContent=String(wave).padStart(2,'0');$('kills').textContent=kills;$('damage').style.opacity=player.hurt*.9;
 $('staminaText').textContent=Math.ceil(player.stamina);$('staminaBar').style.width=`${player.stamina}%`;$('staminaBar').style.background=player.stamina<BAT.cost?'#b27755':'#8cbbac';
 $('weaponName').textContent=player.weapon==='bat'?'BAT':'SIDEARM';
 if(player.weapon==='bat'){$('ammo').textContent='MELEE';$('reloadStatus').textContent=player.swing>=0?'SWINGING':player.stamina<BAT.cost?'LOW STAMINA':'24 STAMINA / SWING';}
 $('touchWeapon').textContent=player.weapon==='bat'?'TO PISTOL':'TO BAT';$('touchReload').hidden=player.weapon==='bat';$('touchSprint').textContent=player.exhausted?'EXHAUSTED':mobileSprint?'RUN: ON':'RUN';
 $('objective').textContent=districtName(player.x,player.z)+' · '+(!arenaTriggered?'ENTER DEAD LOT TO BEGIN WAVES':!inArena(player.x,player.z)?(zombies.length?'PURSUIT ACTIVE · RETURN TO ARENA':'RETURN TO ARENA TO CONTINUE'):'ARENA ACTIVE');
 drawMap();
 const prompt=running&&!paused?interaction():'';$('interact').hidden=!prompt;$('interact').textContent=prompt+' [E]';
 const boss=dungeonLevel<0?zombies.find(z=>z.kind==='wrecker'):null;$('bossHud').hidden=!boss||Math.hypot(boss.x-player.x,boss.z-player.z)>20||!started;
 if(boss)$('bossHealth').value=boss.health;
 if(dungeonLevel>=0){$('objective').textContent=dungeonLevel===8?'ROOFTOP · REACH THE NORTHERN ESCAPE POINT':`FLOOR ${dungeonLevel+1} / 8 · ${floors[dungeonLevel].name.toUpperCase()} · STAIRS NORTH`;$('wave').textContent=dungeonLevel===8?'ROOF':`${dungeonLevel+1}/8`;}
 $('status').textContent=paused?'PAUSED':dead?'SIGNAL LOST':pending||zombies.length?`${zombies.length} ACTIVE · ${pending} INCOMING`:between>0&&$('endless').checked?(inArena(player.x,player.z)?`NEXT WAVE IN ${Math.ceil(between)}s`:'WAVES WAIT AT DEAD LOT'):'PERIMETER QUIET';
 if(dungeonLevel>=0)$('status').textContent=paused?'PAUSED':dead?'SIGNAL LOST':`${zombies.length} FLOOR HOSTILES · NO RESPAWNS`;
 else if(!paused&&!dead&&!pending&&!arenaEnemies())$('status').textContent=between>0?(inArena(player.x,player.z)?`NEXT WAVE ${$('endless').checked?'IN '+Math.ceil(between)+'s':'READY'}`:'RETURN TO DEAD LOT FOR WAVES'):bossDefeated?'WRECKER DEFEATED':dungeonComplete?'TOWER COMPLETE':'EXPLORE THE DISTRICT';
}
const mapCanvas=$('map'),mapContext=mapCanvas.getContext('2d'),mapBase=document.createElement('canvas');mapBase.width=mapBase.height=180;
const mapInk=mapBase.getContext('2d');let mapLimit=bounds;
const mapPoint=(x,z)=>[(x+mapLimit)*180/(mapLimit*2),(z+mapLimit)*180/(mapLimit*2)];
function refreshMap(){mapLimit=dungeonLevel>=0?33:bounds;const scale=180/(mapLimit*2);mapInk.fillStyle='#20271f';mapInk.fillRect(0,0,180,180);mapInk.fillStyle='#656b59';for(const o of obstacles){const [x,y]=mapPoint(o.x-o.w,o.z-o.d);mapInk.fillRect(x,y,o.w*2*scale,o.d*2*scale);}mapInk.font='9px monospace';mapInk.textAlign='center';
 if(dungeonLevel<0){for(const [x,z,label,color] of [[0,0,'ARENA','#c3a35e'],[TOWER.x,TOWER.z,'TOWER','#c5d5aa'],[WRECKER_HOME.x,WRECKER_HOME.z,'BOSS','#ca8264']]){const [px,py]=mapPoint(x,z);mapInk.fillStyle=color;mapInk.fillText(label,px,py);}}
 else{const [x,y]=mapPoint(0,-29);mapInk.fillStyle='#d4c184';mapInk.fillText(dungeonLevel===8?'ESCAPE':'UP',x,y);}
}
function drawMap(){if(!mapContext)return;if(dungeonLevel>=0&&dungeonLevel<8){mapContext.fillStyle='#000';mapContext.fillRect(0,0,180,180);mapContext.fillStyle='#656b59';for(const o of obstacles){if(!renderer.illuminated(o.x,o.z))continue;const [px,py]=mapPoint(o.x-o.w,o.z-o.d);mapContext.fillRect(px,py,o.w*180/mapLimit,o.d*180/mapLimit);}}else mapContext.drawImage(mapBase,0,0);mapContext.fillStyle='#c16850';for(const z of zombies){if(!renderer.illuminated(z.x,z.z))continue;const [x,y]=mapPoint(z.x,z.z);mapContext.fillRect(x-1,y-1,2,2);}const [x,y]=mapPoint(player.x,player.z);mapContext.save();mapContext.translate(x,y);mapContext.rotate(-player.yaw);mapContext.fillStyle='#e3ecc0';mapContext.beginPath();mapContext.moveTo(0,5);mapContext.lineTo(-3,-3);mapContext.lineTo(3,-3);mapContext.closePath();mapContext.fill();mapContext.restore();}
refreshMap();function frame(t){const dt=Math.min((t-previous)/1000||0,.04);previous=t;update(dt);draw();fpsFrames++;fpsClock+=dt;if(fpsClock>.6){$('perf').textContent=`${Math.round(fpsFrames/fpsClock)} FPS · ${zombies.length}/${config.maxAlive} HOSTILES`;fpsFrames=fpsClock=0;}requestAnimationFrame(frame);}

$('start').onclick=begin;$('nextWave').onclick=startWave;$('pause').onclick=()=>setPaused(true);$('resume').onclick=()=>setPaused(false);$('restart').onclick=begin;$('restartPaused').onclick=begin;$('touchReload').onclick=reload;
$('touchWeapon').onclick=switchWeapon;
$('interact').onclick=interact;
$('enterTower').onclick=()=>{if(!entryPrompt)return;entryPrompt=false;paused=false;$('towerPrompt').hidden=true;savedOutdoor={enemies:zombies,bodies:corpses};loadFloor(0);};
$('cancelTower').onclick=()=>{entryPrompt=false;paused=false;$('towerPrompt').hidden=true;clearInput();};
$('touchSprint').onclick=()=>{if(running&&!paused&&!dead)mobileSprint=!mobileSprint;};
$('settings').onclick=()=>{$('deathMenu').hidden=true;$('menu').hidden=false;started=false;dead=false;};
$('quality').onchange=()=>quality=+$('quality').value;
window.addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(e.target.tagName))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape'){setPaused(!paused);return;}if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='KeyQ'&&!e.repeat)switchWeapon();if(e.code==='KeyR'&&!e.repeat)reload();keys.add(e.code);});
window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;mouse.x=e.clientX;mouse.y=e.clientY;mouse.seen=true;$('crosshair').style.left=`${e.clientX}px`;$('crosshair').style.top=`${e.clientY}px`;$('crosshair').style.display=running&&!paused?'block':'none';});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.button===0){mouse.down=true;mouse.seen=true;mouse.x=e.clientX;mouse.y=e.clientY;canvas.setPointerCapture(e.pointerId);}});
window.addEventListener('pointerup',()=>mouse.down=false);canvas.addEventListener('pointercancel',()=>mouse.down=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());
for(const [id,name] of [['moveStick','move'],['aimStick','aim']]){const el=$(id),s=sticks[name],updateStick=e=>{const r=el.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),scale=Math.max(38,len);s.x=len<7?0:dx/scale;s.y=len<7?0:dy/scale;el.querySelector('i').style.transform=`translate(${s.x*35}px,${s.y*35}px)`;};el.addEventListener('pointerdown',e=>{if(s.id!==null||!running||paused)return;e.preventDefault();s.id=e.pointerId;mouse.seen=false;el.setPointerCapture(e.pointerId);updateStick(e);});el.addEventListener('pointermove',e=>{if(e.pointerId===s.id)updateStick(e);});const release=e=>{if(e.pointerId===s.id){s.id=null;s.x=s.y=0;el.querySelector('i').style.transform='';}};for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,release);}
window.addEventListener('blur',()=>{clearInput();setPaused(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();setPaused(true);}});window.addEventListener('resize',()=>{clearInput();if(isPortrait())setPaused(true);});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setPaused(true);$('error').hidden=false;$('errorText').textContent='The graphics context was interrupted. Reload this page to restart the prototype.';});
requestAnimationFrame(frame);







