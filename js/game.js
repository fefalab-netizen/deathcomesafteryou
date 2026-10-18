import {TYPES,waveRoster} from './zombies.js';
import {WorldRenderer,characterMesh,muzzlePosition,bake,block} from './render.js';
import {world,obstacles,blocked,move,bounds,rebuildField,direction,rayBox} from './world.js';

const $=id=>document.getElementById(id),canvas=$('game'),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let renderer;
try{renderer=new WorldRenderer(canvas);renderer.setWorld(world);}catch(e){$('error').hidden=false;$('errorText').textContent=e.message;throw e;}
const config={speed:3.6,runSpeed:5.2,magazine:12,reload:1.35,fireInterval:.22,zombieHealth:2,zombieSpeed:1.05,maxAlive:60};
const player={x:0,z:4,yaw:Math.PI,health:100,ammo:12,reload:0,shot:0,hurt:0,animation:0,moving:false,moveYaw:0,slow:0,vx:0,vz:0};
let roster=[],zombies=[],corpses=[],tracers=[],wave=0,kills=0,pending=0,spawnTimer=0,between=0,running=false,paused=false,dead=false,started=false,elapsed=0,deathTime=0,announcementTime=0;
let cameraX=0,cameraZ=2,quality=1.5,previous=0,fpsClock=0,fpsFrames=0;
const keys=new Set(),mouse={x:innerWidth/2,y:innerHeight/2,down:false,seen:false},sticks={move:{x:0,y:0,id:null},aim:{x:0,y:0,id:null}};
const shadow=bake([block(0,.018,0,.75,.018,.5,'#292d27')]);
const sight=bake([block(0,.025,0,.05,.02,.4,'#b2c68d')]);
let audio;
function sound(type){try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.type=type==='shot'?'sawtooth':'triangle';osc.frequency.setValueAtTime(type==='shot'?150:type==='hit'?75:440,now);osc.frequency.exponentialRampToValueAtTime(type==='shot'?35:40,now+.09);gain.gain.setValueAtTime(type==='shot'?.035:.025,now);gain.gain.exponentialRampToValueAtTime(.001,now+.12);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(now+.13);}catch{/* Audio is optional; the game remains playable without it. */}}
function announce(text){$('announcement').textContent=text;announcementTime=3;$('announcement').style.opacity=1;}
function clearInput(){keys.clear();mouse.down=false;for(const [name,s] of Object.entries(sticks)){s.x=s.y=0;s.id=null;$(name==='move'?'moveStick':'aimStick').querySelector('i').style.transform='';}}
function isPortrait(){return matchMedia('(pointer:coarse) and (orientation:portrait)').matches;}
function setPaused(value){if(!started||dead)return;paused=value;clearInput();$('pauseMenu').hidden=!value;$('crosshair').style.display='none';}
function begin(){quality=+$('quality').value;roster=[];zombies=[];corpses=[];tracers=[];wave=kills=pending=0;between=spawnTimer=elapsed=deathTime=0;Object.assign(player,{x:0,z:4,yaw:Math.PI,health:100,ammo:12,reload:0,shot:0,hurt:0,animation:0,moving:false,moveYaw:0,slow:0,vx:0,vz:0});cameraX=0;cameraZ=2;dead=paused=false;running=started=true;clearInput();for(const id of ['menu','pauseMenu','deathMenu'])$(id).hidden=true;$('nextWave').hidden=false;$('nextWave').textContent='START WAVE 01 →';announce('THE LOT IS QUIET. GET YOUR BEARINGS.');sound('ready');}
function startWave(){if(!running||dead||paused||pending||zombies.length)return;wave++;pending=+$('waveSize').value+(wave-1)*4;roster=waveRoster(wave,pending);spawnTimer=0;between=0;$('nextWave').hidden=true;const unlock=Object.values(TYPES).find(t=>t.wave===wave);announce(`WAVE ${String(wave).padStart(2,'0')} · ${pending} INCOMING${unlock?' · '+unlock.name.toUpperCase():''}`);}
function spawn(){const kind=roster[roster.length-1]||'normal',type=TYPES[kind];for(let tries=0;tries<40;tries++){const side=Math.floor(Math.random()*4),offset=(Math.random()-.5)*8;let x,z;if(side===0){x=offset;z=-21.8;}if(side===1){x=offset;z=21.8;}if(side===2){x=-21.8;z=offset;}if(side===3){x=21.8;z=offset;}if(blocked(x,z,type.radius)||Math.hypot(player.x-x,player.z-z)<7||zombies.some(a=>Math.hypot(a.x-x,a.z-z)<type.radius+TYPES[a.kind].radius+.1))continue;zombies.push({kind,x,z,yaw:0,health:type.hp,speed:type.speed*(.95+Math.random()*.1)+Math.min((wave-1)*.035,.35),animation:Math.random()*3,hurt:0,attack:0,cooldown:Math.random()*.5,struck:false,flank:Math.random()>.5?1:-1,burst:0,burstCooldown:2+Math.random()*3,windup:0,chargeX:0,chargeZ:0});roster.pop();return true;}return false;}function reload(){if(!running||dead||paused||player.reload>0||player.ammo===config.magazine)return;player.reload=config.reload;sound('ready');}
function fire(){if(player.reload>0||player.shot>0)return;if(player.ammo===0){reload();return;}player.ammo--;player.shot=config.fireInterval;sound('shot');
 const origin=muzzlePosition(player),dx=Math.sin(player.yaw),dz=Math.cos(player.yaw);let range=25,target=null;
 // Prevent a muzzle protruding through cover from shooting through that cover.
 const mx=origin[0]-player.x,mz=origin[2]-player.z,ml=Math.hypot(mx,mz);
 const obstructed=obstacles.some(o=>rayBox(player.x,player.z,mx/ml,mz/ml,o)<ml);
 if(obstructed)range=0;
 for(const o of obstacles)range=Math.min(range,rayBox(origin[0],origin[2],dx,dz,o));
 for(const z of zombies){const r=TYPES[z.kind].radius+.07,rx=z.x-origin[0],rz=z.z-origin[2],along=rx*dx+rz*dz,perp=rx*dz-rz*dx;if(along< -r||Math.abs(perp)>r)continue;const distance=Math.max(0,along-Math.sqrt(r*r-perp*perp));if(distance<range){range=distance;target=z;}}
 tracers.push({x:origin[0],y:origin[1],z:origin[2],dx,dz,length:range,endY:target?.kind==='crawler'?.4:1.12,life:.085});
 if(target){const type=TYPES[target.kind];target.health--;target.hurt=type.stagger;if(target.kind!=='brute'&&target.kind!=='worker'){target.attack=0;target.cooldown=.4;target.burst=target.windup=0;}move(target,dx*(target.kind==='brute'?.025:.14),dz*(target.kind==='brute'?.025:.14),type.radius);if(target.health<=0){kills++;corpses.push({...target,age:0});zombies=zombies.filter(z=>z!==target);if(corpses.length>24)corpses.shift();}sound('hit');}
}
function damage(attacker){if(player.hurt>0||dead)return;const type=TYPES[attacker.kind];player.health=Math.max(0,player.health-type.damage);player.hurt=.55;if(attacker.kind==='crawler')player.slow=1.4;if(attacker.kind==='brute'){const dx=player.x-attacker.x,dz=player.z-attacker.z,l=Math.hypot(dx,dz)||1;for(let i=0;i<8;i++)move(player,dx/l*.13,dz/l*.13);}sound('hit');if(player.health===0){dead=true;running=false;deathTime=0;clearInput();$('nextWave').hidden=true;$('result').textContent=`${kills} kills · Wave ${wave} · ${Math.floor(elapsed/60)}m ${Math.floor(elapsed%60)}s survived`;$('crosshair').style.display='none';announce('OVERRUN');}}
function updateZombie(z,dt){
 const type=TYPES[z.kind];z.hurt=Math.max(0,z.hurt-dt);z.cooldown=Math.max(0,z.cooldown-dt);z.burstCooldown=Math.max(0,z.burstCooldown-dt);
 const distance=Math.hypot(player.x-z.x,player.z-z.z);z.yaw=Math.atan2(player.x-z.x,player.z-z.z);
 if(z.attack>0){z.attack+=dt;if(z.attack>type.windup&&!z.struck){z.struck=true;if(distance<type.reach+.25&& !obstacles.some(o=>rayBox(z.x,z.z,Math.sin(z.yaw),Math.cos(z.yaw),o)<distance))damage(z);}if(z.attack>type.windup+.42){z.attack=0;z.cooldown=type.recovery;}return;}
 if(distance<type.reach&&z.cooldown<=0){z.attack=.001;z.struck=false;z.burst=0;return;}
 if(z.hurt>0)return;
 if(z.windup>0){z.windup-=dt;if(z.windup<=0){z.burst=.65;z.burstCooldown=3.5;}return;}
 if(z.kind==='runner'&&distance>2.5&&distance<7&&z.burstCooldown===0){
  const dx=(player.x-z.x)/distance,dz=(player.z-z.z)/distance;
  if(!obstacles.some(o=>rayBox(z.x,z.z,dx,dz,o)<distance)){z.windup=.4;z.chargeX=dx;z.chargeZ=dz;return;}
 }
 let [dx,dz]=direction(z.x,z.z,player.x,player.z),l=Math.hypot(dx,dz);if(l<.05||distance<type.reach*.8)return;dx/=l;dz/=l;
 // Runners approach from a side before their committed, dodgeable burst.
 if(z.kind==='runner'&&distance>4&&distance<11&&z.burst<=0){const x=dx;dx+=-dz*z.flank*.45;dz+=x*z.flank*.45;}
 if(z.burst>0){z.burst-=dt;dx=z.chargeX;dz=z.chargeZ;}
 else{let sx=0,sz=0;for(const other of zombies){if(other===z)continue;const ox=z.x-other.x,oz=z.z-other.z,d=Math.hypot(ox,oz),gap=type.radius+TYPES[other.kind].radius;if(d>0&&d<gap){sx+=ox/d*(gap-d);sz+=oz/d*(gap-d);}}dx+=sx*2;dz+=sz*2;}
 l=Math.hypot(dx,dz)||1;let speed=z.speed*(z.burst>0?2.2:1);if(z.kind==='crawler')speed*=.72+.55*Math.max(0,Math.sin(z.animation*7));
 const oldX=z.x,oldZ=z.z;move(z,dx/l*speed*dt,dz/l*speed*dt,type.radius);const traveled=Math.hypot(z.x-oldX,z.z-oldZ);z.animation+=traveled/(z.kind==='runner'?2.2:z.kind==='brute'?1.1:1.3);z.yaw=Math.atan2(dx,dz);
}
function update(dt){
 if(!running||paused||isPortrait()){if(dead){deathTime+=dt;if(deathTime>.9)$('deathMenu').hidden=false;}return;}
 elapsed+=dt;announcementTime-=dt;$('announcement').style.opacity=announcementTime>0?1:0;
 player.shot=Math.max(0,player.shot-dt);player.hurt=Math.max(0,player.hurt-dt);if(player.reload>0){player.reload-=dt;if(player.reload<=0){player.reload=0;player.ammo=config.magazine;}}
 let mx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+sticks.move.x;
 let mz=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+sticks.move.y;
 const mag=Math.hypot(mx,mz);if(mag>1){mx/=mag;mz/=mag;}player.moving=mag>.08;const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?config.runSpeed:config.speed)*(player.slow>0?.62:1);player.slow=Math.max(0,player.slow-dt);const ox=player.x,oz=player.z;move(player,mx*speed*dt,mz*speed*dt);player.vx=(player.x-ox)/Math.max(dt,.001);player.vz=(player.z-oz)/Math.max(dt,.001);player.animation+=player.moving?Math.hypot(player.x-ox,player.z-oz)/2.5:dt;
 const touchAim=Math.hypot(sticks.aim.x,sticks.aim.y)>.2;
 if(touchAim)player.yaw=Math.atan2(sticks.aim.x,sticks.aim.y);
 else if(mouse.seen){const [x,z]=renderer.screenGround(mouse.x,mouse.y,1.12);player.yaw=Math.atan2(x-player.x,z-player.z);}
 else if(player.moving)player.yaw=Math.atan2(mx,mz);
 if(player.moving)player.moveYaw=Math.atan2(mx,mz)-player.yaw;
 if(mouse.down||touchAim)fire();
 rebuildField(player.x,player.z);
 for(const z of zombies){updateZombie(z,dt);if(dead)break;}
 if(dead)return;
 if(pending&&zombies.length<config.maxAlive){spawnTimer-=dt;if(spawnTimer<=0){if(spawn())pending--;spawnTimer=Math.max(.13,.38-wave*.025);}}
 if(wave>0&&!pending&&!zombies.length){if(between===0){between=5;announce('WAVE CLEARED · RELOAD & REGROUP');$('nextWave').hidden=false;$('nextWave').textContent=`START WAVE ${String(wave+1).padStart(2,'0')} →`;}if($('endless').checked){between=Math.max(.001,between-dt);if(between<=.001)startWave();}}
 for(const c of corpses)c.age+=dt;
 for(const t of tracers)t.life-=dt;tracers=tracers.filter(t=>t.life>0);
 cameraX+=(player.x-cameraX)*Math.min(1,dt*5);cameraZ+=(player.z-cameraZ)*Math.min(1,dt*5);
}
function draw(){renderer.resize(quality);renderer.begin(cameraX,cameraZ);
 const drawActor=(a,kind,state,t,moving)=>{if(Math.abs(a.x-cameraX)>28||Math.abs(a.z-cameraZ)>23)return;renderer.append(shadow,a.x,0,a.z);renderer.append(characterMesh(kind,state,t,moving,a.moveYaw||0,a.animation),a.x,0,a.z,a.yaw);};
 for(const c of corpses)drawActor(c,c.kind,'dead',c.age,false);
 for(const z of zombies){const type=TYPES[z.kind],attackPhase=z.attack<=type.windup?.45*z.attack/type.windup:.45+.55*(z.attack-type.windup)/.42;drawActor(z,z.kind,z.attack>0?'attack':z.hurt>0?'hit':z.windup>0?'windup':'walk',z.attack>0?attackPhase:z.hurt>0?type.stagger-z.hurt:z.animation,true);}
 drawActor(player,'human',dead?'dead':player.hurt>0?'hit':player.reload>0?'reload':player.shot>0?'shoot':'idle',dead?deathTime:player.hurt>0?.55-player.hurt:player.reload>0?config.reload-player.reload:player.shot>0?config.fireInterval-player.shot:player.animation,player.moving); if(started&&!dead){const dx=Math.sin(player.yaw),dz=Math.cos(player.yaw);for(let i=1;i<5;i++)renderer.append(sight,player.x+dx*i*.8,0,player.z+dz*i*.8,player.yaw);}
 for(const t of tracers){
  // A short moving streak replaces the full-length laser beam. The flash starts at the barrel.
  const age=.085-t.life,head=Math.min(t.length,age*240),tail=Math.max(0,head-1.4),len=head-tail;
  if(len>.01){const middle=(head+tail)/2,y=t.y+(t.endY-t.y)*middle/Math.max(.01,t.length);renderer.append(bake([block(0,y,middle,.018,.018,len,'#d2b87c')]),t.x,0,t.z,Math.atan2(t.dx,t.dz));}
  if(age<.04)renderer.append(bake([block(0,t.y,.06,.075,.065,.16,'#f4d69a')]),t.x,0,t.z,Math.atan2(t.dx,t.dz));
  if(t.length>0&&head>=t.length&&t.life>.015)renderer.append(bake([block(0,t.endY,0,.09,.09,.09,'#b08c63')]),t.x+t.dx*t.length,0,t.z+t.dz*t.length);
 } renderer.draw();
 $('healthText').textContent=player.health;$('healthBar').style.width=`${player.health}%`;$('ammo').innerHTML=`${player.ammo} <small>/ ∞</small>`;$('reloadStatus').textContent=player.reload>0?`RELOADING ${player.reload.toFixed(1)}s`:player.ammo===0?'RELOAD [R]':'READY';$('wave').textContent=String(wave).padStart(2,'0');$('kills').textContent=kills;$('damage').style.opacity=player.hurt*.9;
 $('status').textContent=paused?'PAUSED':dead?'SIGNAL LOST':pending||zombies.length?`${zombies.length} ACTIVE · ${pending} INCOMING`:between>0&&$('endless').checked?`NEXT WAVE IN ${Math.ceil(between)}s`:'PERIMETER QUIET';
}
function frame(t){const dt=Math.min((t-previous)/1000||0,.04);previous=t;update(dt);draw();fpsFrames++;fpsClock+=dt;if(fpsClock>.6){$('perf').textContent=`${Math.round(fpsFrames/fpsClock)} FPS · ${zombies.length}/${config.maxAlive} HOSTILES`;fpsFrames=fpsClock=0;}requestAnimationFrame(frame);}

$('start').onclick=begin;$('nextWave').onclick=startWave;$('pause').onclick=()=>setPaused(true);$('resume').onclick=()=>setPaused(false);$('restart').onclick=begin;$('restartPaused').onclick=begin;$('touchReload').onclick=reload;
$('settings').onclick=()=>{$('deathMenu').hidden=true;$('menu').hidden=false;started=false;dead=false;};
$('quality').onchange=()=>quality=+$('quality').value;
window.addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(e.target.tagName))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape'){setPaused(!paused);return;}if(e.code==='KeyR'&&!e.repeat)reload();keys.add(e.code);});
window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;mouse.x=e.clientX;mouse.y=e.clientY;mouse.seen=true;$('crosshair').style.left=`${e.clientX}px`;$('crosshair').style.top=`${e.clientY}px`;$('crosshair').style.display=running&&!paused?'block':'none';});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.button===0){mouse.down=true;mouse.seen=true;mouse.x=e.clientX;mouse.y=e.clientY;canvas.setPointerCapture(e.pointerId);}});
window.addEventListener('pointerup',()=>mouse.down=false);canvas.addEventListener('pointercancel',()=>mouse.down=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());
for(const [id,name] of [['moveStick','move'],['aimStick','aim']]){const el=$(id),s=sticks[name],updateStick=e=>{const r=el.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),scale=Math.max(38,len);s.x=len<7?0:dx/scale;s.y=len<7?0:dy/scale;el.querySelector('i').style.transform=`translate(${s.x*35}px,${s.y*35}px)`;};el.addEventListener('pointerdown',e=>{if(s.id!==null||!running||paused)return;e.preventDefault();s.id=e.pointerId;mouse.seen=false;el.setPointerCapture(e.pointerId);updateStick(e);});el.addEventListener('pointermove',e=>{if(e.pointerId===s.id)updateStick(e);});const release=e=>{if(e.pointerId===s.id){s.id=null;s.x=s.y=0;el.querySelector('i').style.transform='';}};for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,release);}
window.addEventListener('blur',()=>{clearInput();setPaused(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();setPaused(true);}});window.addEventListener('resize',()=>{clearInput();if(isPortrait())setPaused(true);});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setPaused(true);$('error').hidden=false;$('errorText').textContent='The graphics context was interrupted. Reload this page to restart the prototype.';});
requestAnimationFrame(frame);

