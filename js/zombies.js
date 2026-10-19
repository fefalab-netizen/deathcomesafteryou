// Tuning is centralized so each playtest can change the roster without touching rendering.
export const TYPES={
 normal:{name:'Shambler',wave:1,hp:4,speed:1.85,radius:.38,damage:14,reach:1.05,windup:.23,recovery:.38,stagger:.12,skin:'#a4aa8a',shirt:'#c4b695',pants:'#635641',scale:[1,1,1]},
 runner:{name:'Runner',wave:2,hp:4,speed:2.8,radius:.34,damage:12,reach:1.0,windup:.15,recovery:.3,stagger:.13,skin:'#a8a18a',shirt:'#7b3934',pants:'#444648',scale:[.88,.98,.9]},
 worker:{name:'Worker',wave:3,hp:8,speed:1.7,radius:.43,damage:20,reach:1.2,windup:.32,recovery:.5,stagger:.05,skin:'#a6a489',shirt:'#b47c36',pants:'#51534e',scale:[1.16,1.04,1.1]},
 crawler:{name:'Crawler',wave:4,hp:5,speed:1.85,radius:.36,damage:10,reach:1.1,windup:.17,recovery:.42,stagger:.1,skin:'#b2a58b',shirt:'#797565',pants:'#454644',scale:[1,1,1]},
 brute:{name:'Brute',wave:5,hp:18,speed:1.35,radius:.48,damage:30,reach:1.55,windup:.55,recovery:.75,stagger:.035,skin:'#c0ad96',shirt:'#b7a38e',pants:'#494648',scale:[1.65,1.4,1.5]}
};
export function waveRoster(wave,count){const pool=['normal','normal','normal'];if(wave>=2)pool.push('runner');if(wave>=3)pool.push('worker');if(wave>=4)pool.push('crawler');if(wave>=5)pool.push('brute');if(wave>=6)pool.push('runner','crawler');const result=Array.from({length:count},()=>pool[Math.floor(Math.random()*pool.length)]);const unlocked=Object.keys(TYPES).filter(k=>TYPES[k].wave<=wave);unlocked.forEach((k,i)=>result[i%count]=k);return result;}

